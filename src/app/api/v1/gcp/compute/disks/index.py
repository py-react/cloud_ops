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
import pydantic

logger = logging.getLogger(__name__)


class DiskCreateRequest(pydantic.BaseModel):
    project_id: str
    disk_name: str
    size_gb: int
    zone: str
    disk_type: str = "pd-balanced"


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


def _get_credential(cred_id: int | None):
    """Load and decrypt the service account credential."""
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
async def GET(request: Request, credential_id: str | None = None, project_id: str | None = None):
    """List all persistent disks in the selected project."""
    if not project_id:
        return {"disks": []}

    cred_id = _parse_cred_id(credential_id)

    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        disks = PersistentDiskFactory.list(sa_data, project_id)
        return {"disks": disks}
    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@gcp_error_interceptor
@gcp_preflight_guard("compute.googleapis.com")
async def POST(request: Request, credential_id: str | None = None):
    """Create a new persistent disk."""
    cred_id = _parse_cred_id(credential_id)

    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    body = await request.json()
    req = DiskCreateRequest(**body)

    try:
        result = PersistentDiskFactory.create(
            sa_data=sa_data,
            project_id=req.project_id,
            disk_name=req.disk_name,
            size_gb=req.size_gb,
            zone=req.zone,
            disk_type=req.disk_type,
        )
        return {
            "message": "Disk created successfully",
            "disk": result,
        }
    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
