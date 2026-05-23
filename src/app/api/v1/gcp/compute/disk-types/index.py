"""
/api/v1/gcp/compute/disk-types

Query params (GET):
  project_id      : GCP project ID
  zone            : GCP zone (e.g., us-central1-a)
  credential_id   : Optional credential ID

Returns disk types available in the specified zone.
"""
from fastapi import Request, HTTPException
from app.gcp_client import get_gcp_credentials, GCPAuthError
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_storage_factory import ComputeDiscovery
import logging

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
    project_id = request.query_params.get("project_id")
    zone = request.query_params.get("zone")
    credential_id = request.query_params.get("credential_id")

    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")

    if not zone:
        raise HTTPException(status_code=400, detail="zone is required")

    cred_id = _parse_cred_id(credential_id)

    try:
        credentials, _ = get_gcp_credentials(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    from app.db_client.db import get_session
    from app.db_client.models.github_pat.github_pat import IntegrationCredential
    from sqlmodel import select
    from app.gcp_client import load_service_account_json

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
        logger.error(f"Failed to load SA data for disk type discovery: {e}")

    if not sa_data:
        return {"disk_types": []}

    disk_types = ComputeDiscovery.list_disk_types(sa_data, project_id, zone)

    return {"disk_types": disk_types, "zone": zone}
