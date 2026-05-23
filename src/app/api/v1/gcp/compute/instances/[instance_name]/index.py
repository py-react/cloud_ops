import logging
import importlib.util
import os
from fastapi import Request, HTTPException, BackgroundTasks
from google.cloud import compute_v1
from app.gcp_client import get_gcp_credentials
from app.gcp_client.gcp_auth import GCPAuthError
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

def async_gcp_delete_worker(
    instance_record_id: int,
    instance_name: str,
    project_id: str,
    zone: str,
    credential_id: int | None,
    bastion_system_id: int | None,
):
    """Background worker that executes the GCP SDK delete call and purges DB record on completion."""
    creds = None
    instance_client = None
    try:
        creds, _ = get_gcp_credentials(credential_id)
        instance_client = compute_v1.InstancesClient(credentials=creds)

        operation = instance_client.delete(project=project_id, zone=zone, instance=instance_name)
        operation_name = operation.name

        logger.info(f"Background delete operation {operation_name} submitted for {instance_name} in {zone}")

        with get_session() as db_session:
            delete_compute_instance(db_session, instance_name)

        logger.info(f"Local DB record purged for {instance_name} after GCP deletion")

        if bastion_system_id:
            archive_system_by_id(bastion_system_id)
            logger.info(f"Archived linked Bastion system ID {bastion_system_id} for {instance_name}")

        firewall_rule_name = f"allow-rdp-{instance_name}"
        try:
            firewalls_client = compute_v1.FirewallsClient(credentials=creds)
            fw_operation = firewalls_client.delete(project=project_id, firewall=firewall_rule_name)
            fw_operation.result()
            logger.info(f"Cleaned up per-instance firewall rule {firewall_rule_name}")
        except Exception:
            logger.info(f"Firewall rule {firewall_rule_name} already absent or cleanup skipped")

    except Exception as e:
        logger.error(f"Background GCP delete failed for {instance_name}: {e}")
        try:
            with get_session() as db_session:
                update_instance_status(db_session, instance_name, "FAILED")
        except Exception:
            pass
    finally:
        if instance_client:
            del instance_client
        if creds:
            del creds

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
        creds, project_id = get_gcp_credentials(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    instance_client = compute_v1.InstancesClient(credentials=creds)
    instance = instance_client.get(project=project_id, zone=zone, instance=instance_name)

    external_ip = None
    if instance.network_interfaces and instance.network_interfaces[0].access_configs:
        external_ip = instance.network_interfaces[0].access_configs[0].nat_i_p

    has_onboarding_password = bool(db_temp_password and db_temp_password.strip())
    resolved_username = db_ssh_username or "admin"

    result = {
        "id": db_id,
        "instance_name": instance_name,
        "zone": zone,
        "machine_type": db_machine_type or instance.machine_type.split("/")[-1],
        "boot_disk_size_gb": db_boot_disk_size_gb,
        "gcp_resource_id": db_gcp_resource_id or str(instance.id),
        "name": instance.name,
        "status": instance.status,
        "creation_timestamp": instance.creation_timestamp,
        "description": instance.description,
        "tags": [item.key for item in instance.metadata.items] if instance.metadata else [],
        "external_ip": external_ip,
        "ssh_username": resolved_username,
        "disks": [
            {
                "device_name": disk.device_name,
                "type": disk.type_,
                "boot": disk.boot,
                "size_gb": disk.disk_size_gb
            } for disk in instance.disks
        ],
        "network_interfaces": [
            {
                "network": ni.network.split("/")[-1],
                "ip": ni.network_i_p,
                "external_ip": ni.access_configs[0].nat_i_p if ni.access_configs else None
            } for ni in instance.network_interfaces
        ],
        "has_onboarding_password": has_onboarding_password,
        "onboarding_username": resolved_username if has_onboarding_password else None,
        "onboarding_password": db_temp_password if has_onboarding_password else None,
    }

    db_temp_password = None
    try:
        del db_temp_password
    except NameError:
        pass

    return result

@gcp_error_interceptor
@gcp_preflight_guard("compute.googleapis.com")
async def DELETE(request: Request, instance_name: str, background_tasks: BackgroundTasks):
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

    zone = db_zone or request.query_params.get("zone")
    if not zone:
        raise HTTPException(status_code=400, detail="Missing zone — cannot locate instance")

    credential_id = request.query_params.get("credential_id")
    cred_id = _parse_cred_id(credential_id)
    try:
        creds, project_id = get_gcp_credentials(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    if db_id:
        background_tasks.add_task(
            async_gcp_delete_worker,
            db_id,
            instance_name,
            project_id,
            zone,
            cred_id,
            db_bastion_system_id,
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
