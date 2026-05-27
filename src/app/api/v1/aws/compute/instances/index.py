import logging
import uuid
import importlib
import os
import time
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi import Request, HTTPException, BackgroundTasks
import pydantic

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    aws_error_interceptor,
    EC2InstanceFactory,
    EC2ProvisioningError,
    list_aws_regions,
)
from app.db_client.db import get_session
from app.db_client.models.ssh_management import SSHKey
from sqlmodel import select
from app.utils.auth import get_current_user
from app.db_client.controllers.compute_instance import (
    create_compute_instance,
    update_compute_instance,
    list_compute_instances,
    update_instance_status,
)
from app.db_client.controllers.compute_instance.types import (
    ComputeInstanceCreateType,
    ComputeInstanceUpdateType,
)

logger = logging.getLogger(__name__)

SERVICE_KEY_NAME = "Bastion Service Identity Key"

_bastion_root = os.path.join(
    os.path.dirname(__file__),
    "../../../../bastion",
)

_spec = importlib.util.spec_from_file_location(
    "bastion_systems",
    os.path.join(_bastion_root, "systems", "index.py"),
)
_bastion_systems_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_bastion_systems_module)
register_system = _bastion_systems_module.register_system


class EC2CreateRequest(pydantic.BaseModel):
    instance_name: str
    region: str = "us-east-1"
    image_id: str = ""
    instance_type: str = "t2.micro"
    key_name: str | None = None
    security_group_ids: list[str] = []
    subnet_id: str = ""
    bastion_enabled: bool = False
    tags: dict[str, str] = {}


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


def _build_bastion_user_data(bastion_public_key: str) -> str:
    return (
        "#!/bin/bash\n"
        "if ! id -u admin >/dev/null 2>&1; then\n"
        "    groupadd -f admin 2>/dev/null || true\n"
        "    useradd -m -G wheel -s /bin/bash -g admin admin 2>/dev/null || "
        "useradd -m -G sudo -s /bin/bash -g admin admin 2>/dev/null || "
        "useradd -m -s /bin/bash -g admin admin 2>/dev/null || true\n"
        "fi\n"
        'echo "admin ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/admin\n'
        "chmod 440 /etc/sudoers.d/admin\n"
        "mkdir -p /home/admin/.ssh && chmod 700 /home/admin/.ssh\n"
        "cat > /home/admin/.ssh/authorized_keys <<'BASTION_AWS_MARKER'\n"
        + bastion_public_key + "\n"
        "BASTION_AWS_MARKER\n"
        "chmod 600 /home/admin/.ssh/authorized_keys\n"
        "chown -R admin:admin /home/admin/.ssh 2>/dev/null || chown -R admin /home/admin/.ssh 2>/dev/null || true\n"
    )


def _check_port(host: str, port: int, timeout: int = 10) -> bool:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception:
        return False


def _bastion_register_worker(
    access_key: str,
    secret_key: str,
    region: str,
    endpoint_url: str | None,
    instance_id: str,
    instance_name: str,
    db_instance_id: int,
):
    """Background task: wait for public IP, register in Bastion."""
    try:
        # Polling loop for public IP
        public_ip = ""
        max_ip_attempts = 12
        for attempt in range(max_ip_attempts):
            try:
                instance_detail = EC2InstanceFactory.get_instance(
                    access_key, secret_key, region, instance_id, endpoint_url=endpoint_url
                )
                public_ip = instance_detail.get("public_ip", "")
                if public_ip:
                    break
            except Exception as e:
                logger.warning(f"Attempt {attempt+1}: failed to describe instance {instance_name}: {e}")
            time.sleep(5)

        if not public_ip:
            logger.warning(f"EC2 instance {instance_name} has no public IP — skipping Bastion registration")
            with get_session() as db_session:
                update_instance_status(db_session, instance_name, "FAILED")
            return

        logger.info(f"EC2 instance {instance_name} has public IP {public_ip} — checking SSH port 22")
        
        # Retry loop checking SSH port 22
        ssh_reachable = False
        max_ssh_attempts = 8
        for attempt in range(max_ssh_attempts):
            ssh_reachable = _check_port(public_ip, 22, timeout=5)
            if ssh_reachable:
                break
            logger.info(f"SSH port 22 not ready on {public_ip} (attempt {attempt + 1}/{max_ssh_attempts}), retrying...")
            time.sleep(10)

        bastion_status = "configured" if ssh_reachable else "ssh_unreachable"

        bastion_system = register_system(
            name=instance_name,
            hostname=instance_name,
            ip_address=public_ip,
            username="admin",
            os_type="linux",
            connection_type="ssh",
            provider="aws",
            auto_provisioned=ssh_reachable,
        )
        logger.info(
            f"Registered Bastion SSH system for {instance_name} "
            f"(ID: {bastion_system.id}, status: {bastion_status})"
        )

        with get_session() as db_session:
            update_compute_instance(
                db_session,
                instance_name,
                ComputeInstanceUpdateType(
                    bastion_system_id=bastion_system.id,
                    status="RUNNING" if ssh_reachable else "FAILED"
                ),
            )
    except Exception as e:
        logger.error(f"Failed to register Bastion system for {instance_name}: {e}", exc_info=True)
        try:
            with get_session() as db_session:
                update_instance_status(db_session, instance_name, "FAILED")
        except Exception:
            pass


@aws_error_interceptor
async def GET(request: Request):
    region = request.query_params.get("region", "")
    credential_id = request.query_params.get("credential_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    local_instances = {}
    try:
        with get_session() as db_session:
            db_records = list_compute_instances(db_session, provider="aws")
            for record in db_records:
                local_instances[record.instance_name] = {
                    "ssh_username": record.ssh_username,
                    "status": record.status,
                    "bastion_system_id": record.bastion_system_id,
                }
    except Exception as e:
        logger.error(f"Failed to query local DB AWS instances: {e}")

    try:
        if region:
            instances = EC2InstanceFactory.list_instances(access_key, secret_key, region, endpoint_url=endpoint_url)
            for inst in instances:
                inst["region"] = region
        else:
            regions_data = list_aws_regions(access_key, secret_key, endpoint_url=endpoint_url)
            regions = [r["value"] for r in regions_data]
            instances = []
            with ThreadPoolExecutor(max_workers=8) as executor:
                fut_map = {
                    executor.submit(
                        EC2InstanceFactory.list_instances, access_key, secret_key, r, endpoint_url=endpoint_url
                    ): r for r in regions
                }
                for fut in as_completed(fut_map):
                    r = fut_map[fut]
                    try:
                        region_instances = fut.result()
                        for inst in region_instances:
                            inst["region"] = r
                        instances.extend(region_instances)
                    except Exception:
                        logger.warning(f"Failed to list instances in region {r}", exc_info=True)

        # Merge local DB status/ssh_username details
        for inst in instances:
            local = local_instances.get(inst["name"], {})
            inst["ssh_username"] = local.get("ssh_username", "admin")
            if local.get("status") in ("PROVISIONING", "FAILED"):
                inst["state"] = local["status"].lower()

        return {"instances": instances}
    except EC2ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@aws_error_interceptor
async def POST(request: Request, background_tasks: BackgroundTasks):
    user = get_current_user(request)
    credential_id = request.query_params.get("credential_id")
    cred_id = _parse_cred_id(credential_id)

    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    body = await request.json()
    req = EC2CreateRequest(**body)

    instance_name = f"{req.instance_name}-{uuid.uuid4().hex[:4]}"

    bastion_public_key = None
    bastion_status = "disabled"

    if req.bastion_enabled:
        try:
            with get_session() as session:
                ssh_key_record = session.exec(
                    select(SSHKey).where(SSHKey.name == SERVICE_KEY_NAME)
                ).first()
                if ssh_key_record:
                    bastion_public_key = ssh_key_record.public_key
                    logger.info(f"Loaded Bastion Service Identity Key for EC2 instance {instance_name}")
                else:
                    logger.warning(f"No Bastion Service Identity Key found — cannot inject SSH key")
                    bastion_status = "no_key_found"
        except Exception as e:
            logger.error(f"Failed to load Bastion key: {e}")
            bastion_status = "key_load_error"

    user_data = _build_bastion_user_data(bastion_public_key) if bastion_public_key else None

    image_id = req.image_id
    if not image_id or image_id == "__latest__":
        try:
            image_id = EC2InstanceFactory.resolve_ami(access_key, secret_key, req.region, endpoint_url=endpoint_url)
            logger.info(f"Resolved AMI {image_id} for region {req.region}")
        except EC2ProvisioningError as e:
            raise HTTPException(status_code=e.code, detail=e.message)
    elif not image_id.startswith("ami-"):
        try:
            image_id = EC2InstanceFactory.resolve_os_ami(access_key, secret_key, req.region, image_id, endpoint_url=endpoint_url)
            logger.info(f"Resolved OS '{req.image_id}' to AMI {image_id} for region {req.region}")
        except EC2ProvisioningError as e:
            raise HTTPException(status_code=e.code, detail=e.message)

    # Create local DB record
    db_instance = None
    try:
        with get_session() as db_session:
            create_data = ComputeInstanceCreateType(
                instance_name=instance_name,
                zone=req.region,
                machine_type=req.instance_type,
                boot_disk_size_gb=10,
                created_by_user_id=user.id,
                provider="aws",
                ssh_username="admin",
                status="PROVISIONING",
            )
            db_instance = create_compute_instance(db_session, create_data)
    except Exception as e:
        logger.error(f"Failed to create local DB record for {instance_name}: {e}")

    try:
        result = EC2InstanceFactory.create_instance(
            access_key=access_key,
            secret_key=secret_key,
            region=req.region,
            instance_name=instance_name,
            image_id=image_id,
            instance_type=req.instance_type,
            key_name=req.key_name or None,
            security_group_ids=req.security_group_ids if req.security_group_ids else None,
            subnet_id=req.subnet_id if req.subnet_id else None,
            user_data=user_data,
            tags=req.tags or None,
            endpoint_url=endpoint_url,
        )
    except EC2ProvisioningError as e:
        if db_instance:
            try:
                with get_session() as db_session:
                    update_instance_status(db_session, instance_name, "FAILED")
            except Exception:
                pass
        raise HTTPException(status_code=e.code, detail=e.message)

    if result.get("instance_id") and db_instance:
        try:
            with get_session() as db_session:
                update_compute_instance(
                    db_session,
                    instance_name,
                    ComputeInstanceUpdateType(gcp_resource_id=result["instance_id"]),
                )
        except Exception as e:
            logger.error(f"Failed to update resource ID for {instance_name}: {e}")

    if bastion_public_key and result.get("instance_id") and db_instance:
        background_tasks.add_task(
            _bastion_register_worker,
            access_key,
            secret_key,
            req.region,
            endpoint_url,
            result["instance_id"],
            instance_name,
            db_instance.id,
        )
        bastion_status = "pending"
    else:
        if db_instance:
            try:
                with get_session() as db_session:
                    update_instance_status(db_session, instance_name, "RUNNING")
            except Exception:
                pass

    return {
        "message": "EC2 Instance provisioning queued",
        "instance": result,
        "bastion_enabled": req.bastion_enabled,
        "bastion_status": bastion_status,
    }
