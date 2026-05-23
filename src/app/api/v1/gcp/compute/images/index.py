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
from app.gcp_client import get_gcp_credentials, GCPAuthError
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_storage_factory import ComputeDiscovery
from app.db_client.db import get_session
from app.db_client.models.github_pat.github_pat import IntegrationCredential
from sqlmodel import select
from app.gcp_client import load_service_account_json

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


@gcp_error_interceptor
async def GET(request: Request):
    """Fetch live GCP image catalog with official API resolution."""
    project_id = request.query_params.get("project_id")
    credential_id = request.query_params.get("credential_id")

    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    cred_id = _parse_cred_id(credential_id)
    try:
        credentials, _ = get_gcp_credentials(cred_id)
    except GCPAuthError as e:
        logger.error(f"Failed to get GCP credentials: {e}")
        raise HTTPException(status_code=401, detail=str(e))

    sa_data = None
    try:
        with get_session() as session:
            if cred_id:
                statement = select(IntegrationCredential).where(IntegrationCredential.id == cred_id)
            else:
                statement = select(IntegrationCredential).where(
                    IntegrationCredential.provider == "gcp"
                ).order_by(IntegrationCredential.id)
            credential = session.exec(statement).first()
        
        if credential:
            sa_data = load_service_account_json(credential)
    except Exception as e:
        logger.error(f"Failed to load SA data for image catalog: {e}")
        raise HTTPException(status_code=500, detail="Failed to load service account data")

    if not sa_data:
        raise HTTPException(status_code=404, detail="No service account data available")

    catalog = ComputeDiscovery.get_live_image_catalog(sa_data, project_id)

    return {
        "images": catalog,
        "status": "success",
    }
