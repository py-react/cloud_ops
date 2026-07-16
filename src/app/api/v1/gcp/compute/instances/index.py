import logging
import importlib.util
import os
from fastapi import Request, HTTPException, BackgroundTasks, Body, Query
from google.cloud import compute_v1
from app.gcp_client import (
    get_gcp_credentials,
    load_service_account_json,
    GCPInstanceFactory,
    GCPProvisioningError,
)
from app.gcp_client.gcp_auth import GCPAuthError, get_active_gcp_credential, get_gcp_credential_by_id
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_preflight_checker import gcp_preflight_guard
from app.db_client.db import get_session
from app.db_client.models.github_pat.github_pat import IntegrationCredential
from app.db_client.models.ssh_management import SSHKey
from sqlmodel import select
import pydantic
import uuid
from app.db_client.controllers.compute_instance import (
    create_compute_instance,
    list_compute_instances,
    update_instance_status,
    get_compute_instance_by_name,
    update_compute_instance,
)
from app.db_client.controllers.compute_instance.types import (
    ComputeInstanceCreateType,
    ComputeInstanceUpdateType,
)
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)

SERVICE_KEY_NAME = "Bastion Service Identity Key"

_bastion_root = os.path.join(os.path.dirname(__file__), "../../../../bastion")

_spec = importlib.util.spec_from_file_location(
    "bastion_systems",
    os.path.join(_bastion_root, "systems", "index.py"),
)
_bastion_systems_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bastion_systems_module)
register_system = _bastion_systems_module.register_system

_spec2 = importlib.util.spec_from_file_location(
    "bastion_systems_by_id",
    os.path.join(_bastion_root, "systems", "[systemId]", "index.py"),
)
_archive_module = importlib.util.module_from_spec(_spec2)
_spec2.loader.exec_module(_archive_module)
archive_system_by_id = _archive_module.archive_system_by_id

class VMCreateRequest(pydantic.BaseModel):
    project_id: str
    instance_name: str
    zone: str = "us-central1-a"
    machine_type: str = "e2-micro"
    boot_disk_size_gb: int = 10
    boot_disk_type: str = "pd-balanced"
    os_image: str = "projects/debian-cloud/global/images/family/debian-12"
    selected_os_key: str | None = None
    ssh_username: str | None = None
    ssh_key: str | None = None

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


def _auto_archive_bastion_system(bastion_system_id: int):
    """Background task: Archive the Bastion system using existing service pipeline."""
    try:
        archive_system_by_id(bastion_system_id)
    except Exception as e:
        logger.error(f"Failed to archive Bastion system ID {bastion_system_id}: {e}")


def async_gcp_provision_worker(
    instance_record_id: int,
    instance_name: str,
    project_id: str,
    zone: str,
    machine_type: str,
    boot_disk_size_gb: int,
    boot_disk_type: str,
    os_image: str,
    credential_id: int | None,
    bastion_public_key: str | None,
    os_family: str = "linux-debian",
):
    """Background worker that provisions a GCP VM via GCPInstanceFactory with OS-aware configuration."""
    import time
    import socket
    import secrets
    import string

    sa_data = None
    bastion_key = bastion_public_key
    windows_password = None
    is_windows = os_family == "windows"
    is_ubuntu = os_family == "linux-ubuntu"
    try:
        sa_data, _ = _get_sa_data(credential_id)

        # --- Build OS-specific metadata and tags (same logic, now separated from SDK wiring) ---
        logger.info(f"Disk Config: source_image={os_image}, size={boot_disk_size_gb}GB, type={boot_disk_type}")

        metadata_items: list[dict] = [{"key": "created-by", "value": "k1w1-orchestrator"}]
        target_tags = None
        firewall_rule_name = None
        instance_specific_tag = None

        if is_windows:
            alphabet = string.ascii_letters + string.digits + "-_"
            windows_password = ''.join(secrets.choice(alphabet) for _ in range(16))

            windows_init_ps1 = (
                f'$Password = ConvertTo-SecureString "{windows_password}" -AsPlainText -Force\n'
                f'New-LocalUser -Name "admin" -Password $Password -Description "Bastion Admin Profile" -FullName "Admin"\n'
                f'Add-LocalGroupMember -Group "Administrators" -Member "admin"\n'
                f'Add-LocalGroupMember -Group "Remote Desktop Users" -Member "admin"\n'
                f'Set-ItemProperty -Path "HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server" -name "fDenyTSConnections" -value 0\n'
                f'Enable-NetFirewallRule -DisplayGroup "Remote Desktop"\n'
                f'netsh advfirewall firewall add rule name="Allow RDP" dir=in action=allow protocol=TCP localport=3389\n'
                f'Set-ItemProperty -Path "HKLM:\\System\\CurrentControlSet\\Control\\Terminal Server" -Name "fAllowToGetHelp" -Value 1\n'
                f'reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Terminal Server" /v "fEnableTemps" /t REG_DWORD /d 1 /f\n'
            )
            metadata_items.append({"key": "windows-startup-script-ps1", "value": windows_init_ps1})
            logger.info("Windows Core Provisioning: Injected PowerShell RDP activation manifests")

            base_name = instance_name[:40]
            instance_specific_tag = f"rdp-target-{base_name}"
            firewall_rule_name = f"allow-rdp-{base_name}"
            target_tags = [instance_specific_tag, "http-server", "https-server"]
            logger.info(f"Assigned isolated target tag {instance_specific_tag} to Windows VM")
        else:
            metadata_items.append({"key": "enable-oslogin", "value": "FALSE"})
            if bastion_key:
                if is_ubuntu:
                    ubuntu_user_script = (
                        '#!/bin/bash\n'
                        'id -u admin >/dev/null 2>&1 || (groupadd -f admin && useradd -m -G sudo -s /bin/bash -g admin admin)\n'
                        'echo "admin ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/admin\n'
                        'chmod 440 /etc/sudoers.d/admin\n'
                        'mkdir -p /home/admin/.ssh && chmod 700 /home/admin/.ssh\n'
                        'cat > /home/admin/.ssh/authorized_keys <<\'BASTION_UBUNTU_MARKER\'\n'
                        + bastion_key + '\n'
                        'BASTION_UBUNTU_MARKER\n'
                        'chmod 600 /home/admin/.ssh/authorized_keys\n'
                        'chown -R admin:admin /home/admin/.ssh\n'
                    )
                    metadata_items.append({"key": "startup-script", "value": ubuntu_user_script})
                    logger.info("Ubuntu SSH key injection configured for user 'admin' via startup-script")
                else:
                    gcp_ssh_metadata_value = f"admin:{bastion_key} admin"
                    metadata_items.append({"key": "ssh-keys", "value": gcp_ssh_metadata_value})
                    logger.info(f"Debian/Rocky SSH key prefix: {bastion_key[:80]}...")

        logger.info(f"Metadata audit - keys: {[m['key'] for m in metadata_items]}")
        logger.info(f"Triggering instance creation via GCPInstanceFactory for: {instance_name}")

        # Delegate the entire VM insert + firewall to the factory
        result = GCPInstanceFactory.create_instance(
            sa_data=sa_data,
            project_id=project_id,
            instance_name=instance_name,
            zone=zone,
            machine_type=machine_type,
            boot_disk_size_gb=boot_disk_size_gb,
            boot_disk_type=boot_disk_type,
            os_image=os_image,
            metadata_items=metadata_items,
            target_tags=target_tags,
            firewall_rule_name=firewall_rule_name if is_windows else None,
        )

        external_ip = result.get("external_ip")
        internal_ip = result.get("internal_ip")
        gcp_resource_id = result.get("gcp_resource_id", "")
        operation_name = instance_name  # factory already waited; use name as ref

        with get_session() as db_session:
            update_compute_instance(
                db_session,
                instance_name,
                ComputeInstanceUpdateType(
                    status="RUNNING",
                    internal_ip=internal_ip,
                    external_ip=external_ip,
                    gcp_resource_id=gcp_resource_id,
                ),
            )

        if external_ip:
            if is_windows:
                logger.info(f"Windows detected: waiting for RDP port 3389 to become ready on {external_ip}")
                time.sleep(60)

                max_retries = 5
                retry_delay = 20
                rdp_ready = False
                for attempt in range(max_retries):
                    try:
                        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        sock.settimeout(5)
                        result = sock.connect_ex((external_ip, 3389))
                        sock.close()
                        if result == 0:
                            rdp_ready = True
                            break
                    except Exception:
                        pass

                    if attempt < max_retries - 1:
                        logger.info(f"RDP port 3389 not ready on {external_ip} (attempt {attempt + 1}/{max_retries}), retrying in {retry_delay}s")
                        time.sleep(retry_delay)

                if not rdp_ready:
                    logger.warning(f"RDP port 3389 not reachable on {external_ip} after retries, proceeding with registration anyway")

                # PROTECTIVE WORKAROUND: Track "windows-core" explicitly.
                # Server Core lacks a Desktop Window Manager and requires uncompressed RDP flags.
                # We must separate it from "windows-desktop" to prevent bandwidth degradation on standard UI instances.
                exact_os_type = "windows-core" if "-core-" in os_image.lower() else "windows-desktop"

                bastion_system = register_system(
                    name=instance_name,
                    hostname=instance_name,
                    ip_address=external_ip,
                    username="admin",
                    password=windows_password,
                    os_type=exact_os_type,
                    connection_type="rdp",
                    connection_port=3389,
                    provider="gcp",
                    auto_provisioned=False,
                )
                logger.info(f"Registered Bastion RDP system for {instance_name} (ID: {bastion_system.id})")
            else:
                if is_ubuntu:
                    logger.info(f"Ubuntu detected: waiting 45s for ssh.socket and google-guest-agent to stabilize")
                    time.sleep(45)
                    
                    max_retries = 3
                    retry_delay = 15
                    registered = False
                    for attempt in range(max_retries):
                        try:
                            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                            sock.settimeout(5)
                            result = sock.connect_ex((external_ip, 22))
                            sock.close()
                            if result == 0:
                                registered = True
                                break
                        except Exception:
                            pass
                        
                        if attempt < max_retries - 1:
                            logger.info(f"Ubuntu SSH not ready (attempt {attempt + 1}/{max_retries}), retrying in {retry_delay}s")
                            time.sleep(retry_delay)
                
                    if not registered:
                        logger.warning(f"Ubuntu SSH port 22 not reachable after retries, proceeding with registration anyway")

                bastion_system = register_system(
                    name=instance_name,
                    hostname=instance_name,
                    ip_address=external_ip,
                    username="admin",
                    os_type="linux",
                    connection_type="ssh",
                    provider="gcp",
                    auto_provisioned=True,
                )
                logger.info(f"Registered Bastion SSH system for {instance_name} (ID: {bastion_system.id})")
            
            with get_session() as db_session:
                update_compute_instance(
                    db_session,
                    instance_name,
                    ComputeInstanceUpdateType(bastion_system_id=bastion_system.id),
                )
            logger.info(f"Linked Bastion system ID {bastion_system.id} to GCP VM {instance_name}")

        logger.info(f"Background provision operation {operation_name} completed for {instance_name} in {zone}")

    except Exception as e:
        error_msg = str(e)
        logger.error(f"Background GCP provision failed for {instance_name}: {error_msg}")
        try:
            with get_session() as db_session:
                update_instance_status(db_session, instance_name, "FAILED", error_message=error_msg)
        except Exception:
            pass
    finally:
        bastion_key = None
        windows_password = None
        sa_data = None

@gcp_error_interceptor
@gcp_preflight_guard("compute.googleapis.com")
async def GET(request: Request, project_id: str = Query(...), credential_id: str = Query(None)):
    """List all instances across all zones in the selected project."""
    if not project_id:
        return {"instances": []}

    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data, _ = _get_sa_data(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # Load local DB augmentation (status overrides, ssh_username)
    local_instances: dict = {}
    try:
        with get_session() as db_session:
            db_records = list_compute_instances(db_session)
            for record in db_records:
                local_instances[record.instance_name] = {
                    "ssh_username": record.ssh_username,
                    "status": record.status,
                }
    except Exception:
        pass

    # Delegate the actual GCP API call to the factory
    try:
        raw_instances = GCPInstanceFactory.list_instances(sa_data, project_id)
    except GCPProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)

    instances = []
    for inst in raw_instances:
        local = local_instances.get(inst["name"], {})
        ls = local.get("status")
        if ls == "FAILED":
            status = "FAILED"
        elif ls == "PROVISIONING" and inst["status"] in ("PROVISIONING", "STAGING", ""):
            status = "PROVISIONING"
        else:
            status = inst["status"]
        instances.append({
            **inst,
            "status": status,
            "ssh_username": local.get("ssh_username", "admin"),
        })

    return {"instances": instances}

@gcp_error_interceptor
@gcp_preflight_guard("compute.googleapis.com")
async def POST(request: Request, background_tasks: BackgroundTasks, credential_id: str | None = None, body: VMCreateRequest = Body(...)):
    """Provision a new VM instance using SSH key authentication."""
    user = get_current_user(request)
    cred_id = _parse_cred_id(credential_id)

    try:
        creds, project_id = get_gcp_credentials(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    req = body
    logger.info(f"DATA DISCOVERY AUDIT - Parsed Pydantic Model: project_id={req.project_id}, instance_name={req.instance_name}, selected_os_key={req.selected_os_key}, os_image={req.os_image}, boot_disk_size_gb={req.boot_disk_size_gb}")

    selected_os_key = req.selected_os_key or "debian-12"

    os_family_map = {
        "ubuntu-2204": "linux-ubuntu",
        "windows-2022": "windows",
        "rocky-linux-9": "linux-rhel",
        "debian-12": "linux-debian",
    }
    resolved_os_family = os_family_map.get(selected_os_key, "linux-debian")
    resolved_source_image = req.os_image

    bastion_public_key = None

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
                ssh_key_record = session.exec(
                    select(SSHKey).where(SSHKey.name == SERVICE_KEY_NAME)
                ).first()
                if ssh_key_record:
                    bastion_public_key = ssh_key_record.public_key
                    logger.info(f"Loaded Bastion Service Identity Key from SSHKey table")
                    from app.db_client.models.service_settings import ServiceSetting
                    pub_setting = session.exec(
                        select(ServiceSetting).where(ServiceSetting.key == "service_public_key")
                    ).first()
                    if pub_setting:
                        if pub_setting.value != bastion_public_key:
                            logger.error(f"KEY MISMATCH: SSHKey public key differs from ServiceSetting public key!")
                            logger.error(f"SSHKey prefix: {bastion_public_key[:80]}...")
                            logger.error(f"ServiceSetting prefix: {pub_setting.value[:80]}...")
    except Exception as e:
        logger.error(f"Failed to load Bastion key: {e}")

    instance_name = f"{req.instance_name}-{uuid.uuid4().hex[:4]}"

    try:
        with get_session() as db_session:
            create_data = ComputeInstanceCreateType(
                instance_name=instance_name,
                zone=req.zone,
                machine_type=req.machine_type,
                boot_disk_size_gb=req.boot_disk_size_gb,
                created_by_user_id=user.id,
                gcp_resource_id="",
                ssh_username="admin",
                status="PROVISIONING",
                temporary_admin_password="",
            )
            db_instance = create_compute_instance(db_session, create_data)

        background_tasks.add_task(
            async_gcp_provision_worker,
            db_instance.id,
            instance_name,
            req.project_id,
            req.zone,
            req.machine_type,
            req.boot_disk_size_gb,
            req.boot_disk_type,
            resolved_source_image,
            cred_id,
            bastion_public_key,
            resolved_os_family,
        )

    except Exception as e:
        logger.error(f"Failed to queue provision for {instance_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to queue provision operation: {str(e)}")
    finally:
        bastion_public_key = None
        try:
            del bastion_public_key
        except NameError:
            pass

    logger.info(f"Provision queued for {instance_name} in {req.zone}")

    return {
        "message": "VM Provisioning queued — GCP is provisioning in background",
        "instance_name": instance_name,
        "status": "PROVISIONING"
    }
