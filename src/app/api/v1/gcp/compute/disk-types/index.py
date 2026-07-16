"""
/api/v1/gcp/compute/disk-types

Query params (GET):
  project_id      : GCP project ID
  zone            : GCP zone (e.g., us-central1-a)
  credential_id   : Optional credential ID

Returns disk types available in the specified zone.
"""
from fastapi import Request, HTTPException
from app.gcp_client import load_service_account_json, GCPAuthError
from app.gcp_client.gcp_auth import get_active_gcp_credential, get_gcp_credential_by_id
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_compute_factory import ComputeDiscovery
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
async def GET(request: Request, credential_id: str | None = None, project_id: str | None = None, zone: str | None = None):
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
    if not zone:
        raise HTTPException(status_code=400, detail="zone is required")

    cred_id = _parse_cred_id(credential_id)
    try:
        if cred_id:
            credential = get_gcp_credential_by_id(cred_id)
        else:
            credential = get_active_gcp_credential()
        if not credential:
            return {"disk_types": []}
        sa_data = load_service_account_json(credential)
    except Exception as e:
        logger.error(f"Failed to load SA data for disk type discovery: {e}")
        return {"disk_types": []}

    disk_types = ComputeDiscovery.list_disk_types(sa_data, project_id, zone)
    return {"disk_types": disk_types, "zone": zone}
