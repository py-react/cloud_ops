import logging
from fastapi import Request, HTTPException
from app.gcp_client import (
    load_service_account_json,
    GCSBucketFactory,
    PersistentDiskFactory,
    FilestoreInstanceFactory,
    StorageProvisioningError,
    ComputeDiscovery,
    GCSDiscovery,
    FilestoreDiscovery,
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
async def GET(request: Request, credential_id: str | None = None, project_id: str | None = None, type: str | None = None, id: str | None = None, path: str = ""):
    resource_type = type
    resource_id = id

    if not resource_type:
        raise HTTPException(status_code=400, detail="Missing 'type' parameter (OBJECT_STORAGE, BLOCK_STORAGE, FILE_STORAGE)")

    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    if not project_id:
        return {"resources": [], "objects": [], "folders": []}

    try:
        if resource_type == "OBJECT_STORAGE":
            if not resource_id:
                buckets = GCSBucketFactory.list(sa_data, project_id)
                return {"resources": buckets, "objects": [], "folders": []}
            result = GCSBucketFactory.list_objects(sa_data, project_id, resource_id, path)
            return result

        elif resource_type == "BLOCK_STORAGE":
            disks = PersistentDiskFactory.list(sa_data, project_id)
            if not resource_id:
                return {"resources": disks, "objects": [], "folders": []}
            disk = next((d for d in disks if d["name"] == resource_id), None)
            if not disk:
                raise StorageProvisioningError(404, f"Disk '{resource_id}' not found", "")
            return {"resources": disks, "selected_disk": disk, "objects": [], "folders": []}

        elif resource_type == "FILE_STORAGE":
            instances = FilestoreInstanceFactory.list(sa_data, project_id)
            if not resource_id:
                return {"resources": instances, "objects": [], "folders": []}
            instance = next((i for i in instances if i["name"].endswith(f"/instances/{resource_id}")), None)
            if not instance:
                raise StorageProvisioningError(404, f"Filestore instance '{resource_id}' not found", "")
            return {"resources": instances, "selected_instance": instance, "objects": [], "folders": []}

        else:
            raise HTTPException(status_code=400, detail=f"Unknown resource type: {resource_type}")

    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@gcp_error_interceptor
async def POST(request: Request, credential_id: str | None = None, project_id: str | None = None, type: str | None = None, id: str | None = None):
    resource_type = type
    resource_id = id

    if not resource_type or not resource_id:
        raise HTTPException(status_code=400, detail="Missing 'type' or 'id' parameter")

    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    if not project_id:
        raise HTTPException(status_code=400, detail="Missing project_id")

    body = await request.json()

    try:
        if resource_type == "OBJECT_STORAGE":
            action = body.get("action", "create_folder")
            if action == "create_folder":
                folder_name = body.get("folder_name", "").strip().strip("/")
                prefix = body.get("prefix", "")
                if not folder_name:
                    raise HTTPException(status_code=400, detail="folder_name is required")
                result = GCSBucketFactory.create_folder(sa_data, project_id, resource_id, folder_name, prefix)
                return result
            else:
                raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

        elif resource_type == "BLOCK_STORAGE":
            action = body.get("action")
            zone = body.get("zone")
            if not zone:
                raise HTTPException(status_code=400, detail="zone is required for block storage operations")

            if action == "resize":
                new_size_gb = body.get("new_size_gb")
                if not new_size_gb:
                    raise HTTPException(status_code=400, detail="new_size_gb is required")
                result = PersistentDiskFactory.resize(sa_data, project_id, resource_id, zone, new_size_gb)
                return result

            elif action == "snapshot":
                snapshot_name = body.get("snapshot_name", "")
                result = PersistentDiskFactory.create_snapshot(sa_data, project_id, resource_id, zone, snapshot_name)
                return result

            else:
                raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

        elif resource_type == "FILE_STORAGE":
            action = body.get("action")
            location = body.get("location")
            if not location:
                raise HTTPException(status_code=400, detail="location is required for filestore operations")

            if action == "expand":
                share_name = body.get("share_name")
                new_capacity_gb = body.get("new_capacity_gb")
                if not share_name or not new_capacity_gb:
                    raise HTTPException(status_code=400, detail="share_name and new_capacity_gb are required")
                result = FilestoreInstanceFactory.expand(sa_data, project_id, resource_id, location, share_name, new_capacity_gb)
                return result

            else:
                raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

        else:
            raise HTTPException(status_code=400, detail=f"Unknown resource type: {resource_type}")

    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
