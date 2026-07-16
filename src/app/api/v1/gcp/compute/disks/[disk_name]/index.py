import logging
from fastapi import Request, HTTPException
from app.gcp_client import (
    get_gcp_credentials,
    load_service_account_json,
    StorageProvisioningError,
)
from app.gcp_client.gcp_auth import GCPAuthError
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_preflight_checker import gcp_preflight_guard
from google.cloud import compute_v1
from google.oauth2 import service_account
import gc

logger = logging.getLogger(__name__)


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
async def GET(request: Request, disk_name: str):
    """Get details for a specific persistent disk."""
    project_id = request.query_params.get("project_id")
    zone = request.query_params.get("zone")

    if not project_id or not zone:
        raise HTTPException(status_code=400, detail="Missing project_id or zone")

    credential_id = request.query_params.get("credential_id")
    cred_id = _parse_cred_id(credential_id)

    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    creds = None
    client = None
    try:
        creds = service_account.Credentials.from_service_account_info(
            sa_data,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        client = compute_v1.DisksClient(credentials=creds)
        disk = client.get(project=project_id, zone=zone, disk=disk_name)

        return {
            "name": disk.name,
            "status": disk.status,
            "zone": zone,
            "size_gb": disk.size_gb,
            "type": disk.type_.split("/")[-1] if disk.type_ else "pd-standard",
            "creation_timestamp": disk.creation_timestamp,
            "last_attach_timestamp": disk.last_attach_timestamp if hasattr(disk, "last_attach_timestamp") else None,
            "users": list(disk.users) if disk.users else [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if creds:
            del creds
        if client:
            del client
        gc.collect()


@gcp_error_interceptor
@gcp_preflight_guard("compute.googleapis.com")
async def DELETE(request: Request, disk_name: str, credential_id: str | None = None, project_id: str | None = None, zone: str | None = None):
    """Delete a persistent disk."""
    if not project_id or not zone:
        raise HTTPException(status_code=400, detail="Missing project_id or zone")

    cred_id = _parse_cred_id(credential_id)

    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    creds = None
    client = None
    try:
        creds = service_account.Credentials.from_service_account_info(
            sa_data,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        client = compute_v1.DisksClient(credentials=creds)
        operation = client.delete(project=project_id, zone=zone, disk=disk_name)

        logger.info(f"Disk delete operation for {disk_name}: {operation.name}")

        return {
            "message": f"Disk '{disk_name}' deletion initiated",
            "operation_id": operation.name,
            "status": "DELETING",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if creds:
            del creds
        if client:
            del client
        gc.collect()
