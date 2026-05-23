import logging
from fastapi import Request, HTTPException
from app.gcp_client import (
    load_service_account_json,
    PersistentDiskFactory,
    StorageProvisioningError,
)
from app.gcp_client.gcp_auth import GCPAuthError
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_preflight_checker import gcp_preflight_guard

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


def _get_credential(cred_id: int | None):
    from app.db_client.db import get_session
    from app.db_client.models.github_pat.github_pat import IntegrationCredential
    from sqlmodel import select

    with get_session() as session:
        if cred_id:
            statement = select(IntegrationCredential).where(IntegrationCredential.id == cred_id)
        else:
            statement = select(IntegrationCredential).where(
                IntegrationCredential.provider == "gcp"
            ).order_by(IntegrationCredential.id)
        credential = session.exec(statement).first()

    if not credential:
        raise GCPAuthError("No GCP credential found")

    sa_data = load_service_account_json(credential)
    return sa_data


@gcp_error_interceptor
@gcp_preflight_guard("compute.googleapis.com")
async def POST(request: Request, disk_name: str):
    project_id = request.query_params.get("project_id")
    zone = request.query_params.get("zone")
    credential_id = request.query_params.get("credential_id")

    if not project_id or not zone:
        raise HTTPException(status_code=400, detail="Missing project_id or zone")

    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    body = await request.json()
    snapshot_name = body.get("snapshot_name", "")

    try:
        result = PersistentDiskFactory.create_snapshot(sa_data, project_id, disk_name, zone, snapshot_name)
        return result
    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
