import logging
from functools import wraps
from typing import Optional, Any
from fastapi import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.gcp_client import get_gcp_credentials
from app.gcp_client.gcp_auth import GCPAuthError
from app.gcp_client.gcp_error_handler import GCPErrorResponse

logger = logging.getLogger(__name__)

# Service Registry: Map of GCP services and whether they strictly require billing
GCP_SERVICE_BILLING_REQUIREMENTS = {
    "compute.googleapis.com": True,
    "container.googleapis.com": True,
    "cloudbuild.googleapis.com": True,
    "run.googleapis.com": True,
    "storage.googleapis.com": False,
    "cloudresourcemanager.googleapis.com": False,
}

class PreflightException(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)

class GCPPreflightChecker:
    @staticmethod
    def is_billing_enabled(project_id: str, credentials) -> bool:
        """Proactively checks if billing is enabled."""
        try:
            billing_service = build("cloudbilling", "v1", credentials=credentials)
            project_name = f"projects/{project_id}"
            billing_info = billing_service.projects().getBillingInfo(name=project_name).execute()
            return billing_info.get("billingEnabled", False)
        except HttpError as e:
            # If the Billing API itself is not enabled or permission denied,
            # we log it but don't strictly block if we can't verify.
            # However, for Compute/Container, it's almost certain it will fail later.
            logger.warning(f"Could not verify billing status for {project_id} (API error): {e}")
            return True # Fail open to let the actual API call provide a more accurate error
        except Exception as e:
            logger.error(f"Billing Check Failed for {project_id}: {e}")
            return True # Fail open

    @staticmethod
    def is_api_enabled(project_id: str, service_name: str, credentials) -> tuple[bool, Optional[str]]:
        """
        Proactively checks if a specific API service is enabled.
        Returns (is_enabled, error_message)
        """
        try:
            service_usage = build("serviceusage", "v1", credentials=credentials)
            resource_name = f"projects/{project_id}/services/{service_name}"

            service_info = service_usage.services().get(name=resource_name).execute()
            state = service_info.get("state")

            if state == "ENABLED":
                return True, None

            return False, f"The Google Cloud API '{service_name}' is currently {state}."
        except HttpError as e:
            if e.resp.status in [403, 404]:
                # If we can't check Service Usage, we fail open.
                # The actual API call will give a 403 anyway if it's disabled.
                return True, None
            return False, f"API check failed: {str(e)}"
        except Exception as e:
            logger.error(f"Service Activation Check Failed for {service_name}: {e}")
            return True, None # Fail open

def gcp_preflight_guard(service_name: str):
    """
    Advanced Decorator to perform sequential pre-flight validation.
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            project_id = request.query_params.get("project_id")
            if not project_id:
                try:
                    body = await request.json()
                    project_id = body.get("project_id")
                except: pass

            try:
                credential_id = request.query_params.get("credential_id")
                cred_id = int(credential_id) if credential_id and credential_id != "undefined" else None
                credentials, _ = get_gcp_credentials(cred_id)
            except GCPAuthError:
                credentials = None

            if project_id and credentials:
                # 1. Check Service Activation first (User says they enabled it!)
                is_enabled, check_msg = GCPPreflightChecker.is_api_enabled(project_id, service_name, credentials)
                if not is_enabled:
                    return GCPErrorResponse.handle_exception(
                        PreflightException(428, f"The Google Cloud API '{service_name}' is not enabled. {check_msg}"),
                        project_id=project_id,
                        service_name=service_name
                    )

                # 2. Check Billing only if API is enabled
                requires_billing = GCP_SERVICE_BILLING_REQUIREMENTS.get(service_name, False)
                if requires_billing:
                    if not GCPPreflightChecker.is_billing_enabled(project_id, credentials):
                        # If the API check passed but billing check failed,
                        # it's possible our billing check is too strict or API is stale.
                        # We only block if we are 100% sure billing is disabled.
                        return GCPErrorResponse.handle_exception(
                            PreflightException(402, f"Billing is disabled for project '{project_id}'. Enable it to use {service_name}."),
                            project_id=project_id,
                            service_name=service_name
                        )

            return await func(request, *args, **kwargs)
        return wrapper
    return decorator
