from fastapi import Request
from fastapi.responses import JSONResponse
from google.api_core import exceptions as google_exceptions
from oauthlib.oauth2.rfc6749.errors import OAuth2Error
import logging
import re

logger = logging.getLogger(__name__)

class GCPErrorResponse:
    """Helper to generate standardized GCP error responses."""
    
    @staticmethod
    def error_content(exc: Exception, project_id: str = None, service_name: str = None) -> dict:
        """Classify an exception and return a standardised error dict (no HTTP wrapper)."""
        error_type = "GCP_UNKNOWN_ERROR"
        message = getattr(exc, 'detail', str(exc))
        action_required = "Contact support or check logs."

        msg = str(exc).lower()

        if "insufficient authentication scopes" in msg or isinstance(exc, (OAuth2Error, google_exceptions.Unauthenticated)):
            error_type = "GCP_SCOPE_MISMATCH"
            message = "Authentication scope is insufficient or session has expired."
            action_required = "Sign out and sign in again, ensuring all requested permissions are checked."

        elif "disabled" in msg or "has not been used" in msg or "api_not_enabled" in msg:
            error_type = "GCP_API_NOT_ENABLED"
            action_required = "Enable the required API (e.g. Storage, Compute) in the GCP Console Library."

        elif "billing" in msg or getattr(exc, 'status_code', None) == 402:
            error_type = "GCP_BILLING_REQUIRED"
            message = "This operation requires a project with an active billing account."
            action_required = "Enable billing for this project in the Google Cloud Console."

        elif isinstance(exc, google_exceptions.Forbidden) or "permission" in msg:
            error_type = "GCP_INSUFFICIENT_PERMISSIONS"
            if "viewer" in msg:
                action_required = "Grant 'Editor' or 'Owner' permissions to your account in the GCP Console."
            else:
                action_required = "Ensure your authenticated account has sufficient IAM permissions for this project."

        elif isinstance(exc, google_exceptions.GoogleAPIError):
            error_type = "GCP_API_ERROR"
            action_required = "Review the technical message above for specific GCP requirements."

        return {
            "status": "error",
            "error_type": error_type,
            "message": str(exc),
            "action_required": action_required,
            "project_id": project_id,
            "service_name": service_name,
        }

    @staticmethod
    def handle_exception(exc: Exception, project_id: str = None, service_name: str = None):
        """Map raw exceptions to a standardised JSONResponse."""
        content = GCPErrorResponse.error_content(exc, project_id, service_name)
        status_code = 403 if content["error_type"] in ("GCP_API_NOT_ENABLED", "GCP_INSUFFICIENT_PERMISSIONS") else (
            401 if content["error_type"] == "GCP_SCOPE_MISMATCH" else (
            402 if content["error_type"] == "GCP_BILLING_REQUIRED" else 500
        ))

        logger.error(f"Standardized GCP Error [{content['error_type']}]: {str(exc)}", exc_info=True)

        return JSONResponse(
            status_code=status_code,
            content={**content, "raw_details": str(exc) if status_code == 500 else None}
        )

from functools import wraps

def gcp_error_interceptor(func):
    """Decorator to catch Google errors and return standardized JSON."""
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        try:
            return await func(request, *args, **kwargs)
        except (google_exceptions.GoogleAPIError, OAuth2Error, Exception) as e:
            # Try to resolve project_id and service_name for better error linking
            project_id = request.query_params.get("project_id")
            service_name = None
            
            # Extract service name from exception message if possible
            msg = str(e)
            if "apis/api/" in msg:
                try:
                    service_name = msg.split("apis/api/")[1].split("/")[0].split("?")[0]
                except: pass
            elif "googleapis.com" in msg and not service_name:
                try:
                    # Try to find something like "compute.googleapis.com"
                    match = re.search(r'([a-z0-9-]+\.googleapis\.com)', msg)
                    if match:
                        service_name = match.group(1)
                except: pass

            return GCPErrorResponse.handle_exception(e, project_id=project_id, service_name=service_name)
    return wrapper
