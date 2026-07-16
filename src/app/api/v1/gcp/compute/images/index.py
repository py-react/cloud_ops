"""
/api/v1/gcp/compute/images

GET endpoint that returns live GCP image catalog with official API resolution.
Query params:
  credential_id: GCP credential ID (optional, uses default if not provided)
  project_id: GCP project ID (required)

Returns a dictionary mapping os_key to enriched image metadata including
live selfLink URI, minimum disk requirements, and OS family classification.
"""
import logging
from fastapi import Request, HTTPException
from app.gcp_client import load_service_account_json, GCPAuthError
from app.gcp_client.gcp_auth import get_active_gcp_credential, get_gcp_credential_by_id
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_compute_factory import ComputeDiscovery

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


@gcp_error_interceptor
async def GET(request: Request, credential_id: str | None = None, project_id: str | None = None):
    """Fetch live GCP image catalog with official API resolution."""
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    cred_id = _parse_cred_id(credential_id)
    try:
        if cred_id:
            credential = get_gcp_credential_by_id(cred_id)
        else:
            credential = get_active_gcp_credential()
        if not credential:
            raise HTTPException(status_code=404, detail="No GCP credential found")
        sa_data = load_service_account_json(credential)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to load SA data for image catalog: {e}")
        raise HTTPException(status_code=500, detail="Failed to load service account data")

    catalog = ComputeDiscovery.get_live_image_catalog(sa_data, project_id)

    return {
        "images": catalog,
        "status": "success",
    }
