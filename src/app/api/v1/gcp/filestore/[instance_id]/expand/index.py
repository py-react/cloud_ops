import logging
from fastapi import Request, HTTPException
from app.gcp_client import (
    load_service_account_json,
    FilestoreInstanceFactory,
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
@gcp_preflight_guard("file.googleapis.com")
async def POST(request: Request, instance_id: str):
    project_id = request.query_params.get("project_id")
    location = request.query_params.get("location")
    credential_id = request.query_params.get("credential_id")

    if not project_id or not location:
        raise HTTPException(status_code=400, detail="Missing project_id or location")

    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    body = await request.json()
    share_name = body.get("share_name")
    new_capacity_gb = body.get("new_capacity_gb")

    if not share_name or not new_capacity_gb:
        raise HTTPException(status_code=400, detail="share_name and new_capacity_gb are required")

    try:
        result = FilestoreInstanceFactory.expand(sa_data, project_id, instance_id, location, share_name, new_capacity_gb)
        return result
    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
