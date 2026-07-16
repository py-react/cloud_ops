import logging
import importlib.util
import os
from fastapi import Request, HTTPException, BackgroundTasks
from app.gcp_client import (
    load_service_account_json,
    GCPInstanceFactory,
    GCPProvisioningError,
)
from app.gcp_client.gcp_auth import GCPAuthError, get_active_gcp_credential, get_gcp_credential_by_id
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_preflight_checker import gcp_preflight_guard
from app.db_client.db import get_session
from app.db_client.controllers.compute_instance import (
    get_compute_instance_by_name,
    delete_compute_instance,
    update_instance_status,
)
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

_bastion_root = os.path.join(os.path.dirname(__file__), "../../../../../bastion")

_spec = importlib.util.spec_from_file_location(
    "bastion_systems_by_id",
    os.path.join(_bastion_root, "systems", "[systemId]", "index.py"),
)
_archive_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_archive_module)
archive_system_by_id = _archive_module.archive_system_by_id


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


def _get_sa_data(cred_id: int | None) -> tuple[dict, str]:
    """Resolve a credential to raw SA JSON dict + project_id for factory calls."""
    if cred_id:
        credential = get_gcp_credential_by_id(cred_id)
    else:
        credential = get_active_gcp_credential()
    if not credential:
        raise GCPAuthError("No GCP credential found")
    sa_data = load_service_account_json(credential)
    project_id = sa_data.get("project_id", "")
    return sa_data, project_id

def async_gcp_delete_worker(
    instance_record_id: int,
    instance_name: str,
    project_id: str,
    zone: str,
    credential_id: int | None,
    bastion_system_id: int | None,
    is_local_only: bool = False,
):
    """Background worker that deletes a GCP VM via GCPInstanceFactory and purges the DB record.

    If is_local_only is True (instance was never created on GCP), skip the cloud API call
    and just purge the DB record.
    """
    import traceback
    gcp_delete_succeeded = False
    try:
        if is_local_only:
            logger.info(f"Local-only instance {instance_name} — skipping GCP API call, purging DB record")
            gcp_delete_succeeded = True
        else:
            sa_data, _ = _get_sa_data(credential_id)
            GCPInstanceFactory.delete_instance(sa_data, project_id, zone, instance_name)
            logger.info(f"GCPInstanceFactory.delete_instance completed for {instance_name}")
            gcp_delete_succeeded = True

        with get_session() as db_session:
            delete_compute_instance(db_session, instance_name)
        logger.info(f"Local DB record purged for {instance_name}")

        if bastion_system_id and gcp_delete_succeeded:
            archive_system_by_id(bastion_system_id)
            logger.info(f"Archived linked Bastion system ID {bastion_system_id} for {instance_name}")
        elif bastion_system_id and not gcp_delete_succeeded:
            logger.warning(f"NOT archiving Bastion system ID {bastion_system_id} — GCP delete failed for {instance_name}")

    except Exception as e:
        logger.error(f"Background GCP delete failed for {instance_name}: {e}\n{traceback.format_exc()}")
        # Preserve original status (RUNNING) — delete failed but instance still exists in cloud

@gcp_error_interceptor
@gcp_preflight_guard("compute.googleapis.com")
async def GET(request: Request, instance_name: str):
    """Fetch deep details for a specific VM instance."""
    user = get_current_user(request)

    db_id = None
    db_zone = None
    db_machine_type = None
    db_boot_disk_size_gb = None
    db_gcp_resource_id = None
    db_temp_password = None
    db_ssh_username = None
    db_bastion_system_id = None

    with get_session() as db_session:
        db_record = get_compute_instance_by_name(db_session, instance_name)
        if db_record:
            if db_record.created_by_user_id != user.id:
                raise HTTPException(status_code=403, detail="Forbidden: You do not own this compute instance")
            db_id = db_record.id
            db_zone = db_record.zone
            db_machine_type = db_record.machine_type
            db_boot_disk_size_gb = db_record.boot_disk_size_gb
            db_gcp_resource_id = db_record.gcp_resource_id
            db_temp_password = db_record.temporary_admin_password
            db_ssh_username = db_record.ssh_username
            db_bastion_system_id = db_record.bastion_system_id

    zone = db_zone or request.query_params.get("zone")
    if not zone:
        raise HTTPException(status_code=400, detail="Missing zone")

    credential_id = request.query_params.get("credential_id")
    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data, project_id = _get_sa_data(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        instance = GCPInstanceFactory.get_instance(sa_data, project_id, zone, instance_name)
    except GCPProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)

    external_ip = instance.get("external_ip")
    has_onboarding_password = bool(db_temp_password and db_temp_password.strip())
    resolved_username = db_ssh_username or "admin"

    result = {
        "id": db_id,
        "instance_name": instance_name,
        "zone": zone,
        "machine_type": db_machine_type or instance.get("machine_type"),
        "boot_disk_size_gb": db_boot_disk_size_gb,
        "gcp_resource_id": db_gcp_resource_id or instance.get("gcp_resource_id"),
        "name": instance.get("name"),
        "status": instance.get("status"),
        "creation_timestamp": instance.get("creation_timestamp"),
        "description": instance.get("description"),
        "tags": instance.get("tags", []),
        "external_ip": external_ip,
        "ssh_username": resolved_username,
        "disks": instance.get("disks", []),
        "network_interfaces": instance.get("network_interfaces", []),
        "has_onboarding_password": has_onboarding_password,
        "onboarding_username": resolved_username if has_onboarding_password else None,
        "onboarding_password": db_temp_password if has_onboarding_password else None,
    }

    db_temp_password = None

    return result

@gcp_error_interceptor
@gcp_preflight_guard("compute.googleapis.com")
async def DELETE(request: Request, instance_name: str, background_tasks: BackgroundTasks, credential_id: str | None = None, zone: str | None = None):
    """Trigger asynchronous deletion of a VM instance using background tasks."""
    user = get_current_user(request)

    db_id = None
    db_zone = None
    db_machine_type = None
    db_boot_disk_size_gb = None
    db_gcp_resource_id = None
    db_ssh_username = None
    db_status = None
    db_bastion_system_id = None

    with get_session() as db_session:
        db_record = get_compute_instance_by_name(db_session, instance_name)
        if db_record:
            if db_record.created_by_user_id != user.id:
                raise HTTPException(status_code=403, detail="Forbidden: You do not own this compute instance")
            db_id = db_record.id
            db_zone = db_record.zone
            db_machine_type = db_record.machine_type
            db_boot_disk_size_gb = db_record.boot_disk_size_gb
            db_gcp_resource_id = db_record.gcp_resource_id
            db_ssh_username = db_record.ssh_username
            db_status = db_record.status
            db_bastion_system_id = db_record.bastion_system_id
            update_instance_status(db_session, instance_name, "STOPPING")

    zone = db_zone or zone
    if not zone:
        raise HTTPException(status_code=400, detail="Missing zone — cannot locate instance")

    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data, project_id = _get_sa_data(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    is_local_only = db_status in ("PROVISIONING", "FAILED") or not db_gcp_resource_id

    if db_id:
        background_tasks.add_task(
            async_gcp_delete_worker,
            db_id,
            instance_name,
            project_id,
            zone,
            cred_id,
            db_bastion_system_id,
            is_local_only,
        )

    logger.info(f"Delete queued for instance {instance_name} in {zone}")

    return {
        "id": db_id,
        "instance_name": instance_name,
        "zone": zone,
        "machine_type": db_machine_type,
        "boot_disk_size_gb": db_boot_disk_size_gb,
        "gcp_resource_id": db_gcp_resource_id,
        "ssh_username": db_ssh_username,
        "status": "STOPPING",
        "message": f"VM '{instance_name}' deletion queued — GCP is processing in background",
    }
