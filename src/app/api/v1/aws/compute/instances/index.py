import logging
import uuid
import importlib
import os
import time
import socket
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi import Request, HTTPException, BackgroundTasks, Body, Query
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
    # Escape any single quotes in the key (should never happen with RSA/Ed25519 pub keys,
    # but defensive)
    safe_key = bastion_public_key.replace("'", "'\\''")
    return (
        "#!/bin/bash\n"
        "set -e\n"
        "# Create admin group if it doesn't exist\n"
        "groupadd -f admin 2>/dev/null || true\n"
        "# Create admin user if it doesn't exist\n"
        "if ! id -u admin >/dev/null 2>&1; then\n"
        "    useradd -m -G wheel,admin -s /bin/bash admin 2>/dev/null || \\\n"
        "    useradd -m -G sudo,admin -s /bin/bash admin 2>/dev/null || \\\n"
        "    useradd -m -s /bin/bash admin 2>/dev/null || true\n"
        "fi\n"
        "# Grant passwordless sudo\n"
        'echo "admin ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/admin\n'
        "chmod 440 /etc/sudoers.d/admin\n"
        "# Inject bastion service public key\n"
        "mkdir -p /home/admin/.ssh\n"
        "chmod 700 /home/admin/.ssh\n"
        # Use printf to safely write key — avoids heredoc encoding pitfalls
        f"printf '%s\\n' '{safe_key}' > /home/admin/.ssh/authorized_keys\n"
        "chmod 600 /home/admin/.ssh/authorized_keys\n"
        "chown -R admin:admin /home/admin/.ssh 2>/dev/null || true\n"
        "# Fix SELinux context if applicable (Amazon Linux / Rocky Linux)\n"
        "restorecon -Rv /home/admin/.ssh 2>/dev/null || true\n"
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
    instance_name: str,
    db_instance_id: int,
    image_id: str,
    instance_type: str,
    key_name: str | None,
    security_group_ids: list[str],
    subnet_id: str,
    user_data: str | None,
    tags: dict[str, str],
    bastion_public_key: str | None,
):
    """Background task: create EC2 instance, wait for readiness, register in Bastion.
    
    Updates DB at each phase. Exits only after RUNNING or FAILED.
    """
    logger.info(f"Starting provision worker for {instance_name}")
    try:
        # Phase 1: Create EC2 instance
        logger.info(f"Creating EC2 instance: name={instance_name}, type={instance_type}, region={region}, image_id={image_id}")
        result = EC2InstanceFactory.create_instance(
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            instance_name=instance_name,
            image_id=image_id,
            instance_type=instance_type,
            key_name=key_name or None,
            security_group_ids=security_group_ids if security_group_ids else None,
            subnet_id=subnet_id if subnet_id else None,
            user_data=user_data,
            tags=tags or None,
            endpoint_url=endpoint_url,
        )
        instance_id = result.get("instance_id", "")
        private_ip = result.get("private_ip", "")
        instance_state = result.get("state", "pending")
        logger.info(f"EC2 instance created: instance_id={instance_id}, state={instance_state}, private_ip={private_ip}")

        # Phase 2: Update DB with instance details
        with get_session() as db_session:
            update_compute_instance(
                db_session,
                instance_name,
                ComputeInstanceUpdateType(
                    gcp_resource_id=instance_id,
                    internal_ip=private_ip,
                    state=instance_state,
                ),
            )

        # If bastion is disabled, mark RUNNING and exit
        if not bastion_public_key:
            with get_session() as db_session:
                update_instance_status(db_session, instance_name, "RUNNING")
            logger.info(f"Instance {instance_name} created without bastion — marked RUNNING")
            return

        # Phase 3: Wait for public IP
        public_ip = ""
        max_ip_attempts = 12
        instance_detail = {}
        for attempt in range(max_ip_attempts):
            try:
                instance_detail = EC2InstanceFactory.get_instance(
                    access_key, secret_key, region, instance_id, endpoint_url=endpoint_url
                )
                public_ip = instance_detail.get("public_ip", "")
                if public_ip:
                    logger.info(f"Instance {instance_name} got public IP: {public_ip}")
                    break
                logger.info(f"Attempt {attempt+1}/{max_ip_attempts}: {instance_name} has no public IP yet, waiting...")
            except Exception as e:
                logger.warning(f"Attempt {attempt+1}: failed to describe instance {instance_name}: {e}")
            time.sleep(5)

        if not public_ip:
            logger.error(f"Instance {instance_name} has no public IP after {max_ip_attempts} attempts — marking FAILED")
            with get_session() as db_session:
                update_instance_status(db_session, instance_name, "FAILED", error_message="No public IP assigned")
            return

        with get_session() as db_session:
            update_compute_instance(
                db_session,
                instance_name,
                ComputeInstanceUpdateType(
                    external_ip=public_ip,
                    state="provisioning",
                ),
            )

        # Phase 4: Wait for SSH — give cloud-init enough time to write authorized_keys
        # 18 attempts × 10s = 3 minutes max
        ssh_reachable = False
        max_ssh_attempts = 18
        for attempt in range(max_ssh_attempts):
            ssh_reachable = _check_port(public_ip, 22, timeout=5)
            if ssh_reachable:
                logger.info(f"SSH port 22 reachable on {public_ip}")
                # Extra grace period so cloud-init finishes writing authorized_keys
                time.sleep(10)
                break
            logger.info(f"Attempt {attempt+1}/{max_ssh_attempts}: port 22 not ready on {public_ip}, retrying...")
            time.sleep(10)

        # Phase 5: Register bastion
        bastion_system = register_system(
            name=instance_name,
            hostname=instance_name,
            ip_address=public_ip,
            username="admin",
            os_type="linux",
            connection_type="ssh",
            provider="aws",
            auto_provisioned=bool(bastion_public_key),
        )
        logger.info(f"Registered Bastion SSH system for {instance_name} (ID: {bastion_system.id})")

        # Phase 6: Final DB update — instance is running since bastion registered
        with get_session() as db_session:
            update_compute_instance(
                db_session,
                instance_name,
                ComputeInstanceUpdateType(
                    bastion_system_id=bastion_system.id,
                    status="RUNNING",
                    state="running",
                    internal_ip=instance_detail.get("private_ip", private_ip),
                    external_ip=public_ip,
                ),
            )
        logger.info(f"Instance {instance_name} is RUNNING (bastion registered, ssh_reachable={ssh_reachable})")
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Provision worker failed for {instance_name}: {error_msg}", exc_info=True)
        try:
            with get_session() as db_session:
                update_instance_status(db_session, instance_name, "FAILED", error_message=error_msg)
            logger.info(f"Instance {instance_name} marked FAILED: {error_msg}")
        except Exception as db_e:
            logger.error(f"Failed to update instance {instance_name} status to FAILED: {db_e}")


@aws_error_interceptor
async def GET(request: Request, credential_id: str = Query(None), region: str = Query("")):
    cred_id = _parse_cred_id(credential_id)

    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        if region:
            raw = EC2InstanceFactory.list_instances(access_key, secret_key, region, endpoint_url=endpoint_url)
            for inst in raw:
                inst["region"] = region
            return {"instances": raw}
        else:
            regions_data = list_aws_regions(access_key, secret_key, endpoint_url=endpoint_url)
            regions = [r["value"] for r in regions_data]
            cloud_instances = []
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
                        cloud_instances.extend(region_instances)
                    except Exception:
                        logger.warning(f"Failed to list instances in region {r}", exc_info=True)

            return {"instances": cloud_instances}
    except EC2ProvisioningError:
        raise


@aws_error_interceptor
async def POST(request: Request, background_tasks: BackgroundTasks, credential_id: str | None = None, body: EC2CreateRequest = Body(...)):
    user = get_current_user(request)
    cred_id = _parse_cred_id(credential_id)

    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    req = body

    instance_name = f"{req.instance_name}-{uuid.uuid4().hex[:4]}"

    bastion_public_key = None

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
        except Exception as e:
            logger.error(f"Failed to load Bastion key: {e}")

    user_data = _build_bastion_user_data(bastion_public_key) if bastion_public_key else None

    image_id = req.image_id
    if not image_id or image_id == "__latest__":
        try:
            image_id = EC2InstanceFactory.resolve_ami(access_key, secret_key, req.region, endpoint_url=endpoint_url)
            logger.info(f"Resolved AMI {image_id} for region {req.region}")
        except EC2ProvisioningError:
            raise
    elif image_id.startswith("ami-"):
        # If the AMI ID is one of our known hardcoded AMIs from any region, swap it for the
        # correct regional AMI without making a live EC2 API call.
        try:
            # Build a reverse map: ami_id → os_family, scanning all regions
            all_regional = EC2InstanceFactory.REGIONAL_OS_IMAGES
            os_family = None
            for _region_amis in all_regional.values():
                for fam, info in _region_amis.items():
                    if info["image_id"] == image_id:
                        os_family = fam
                        break
                if os_family:
                    break

            if os_family:
                # Try the fast regional map first
                target_region_amis = all_regional.get(req.region, {})
                if os_family in target_region_amis:
                    new_image_id = target_region_amis[os_family]["image_id"]
                    if new_image_id != image_id:
                        logger.info(
                            f"Swapped hardcoded AMI {image_id} → {new_image_id} "
                            f"({os_family}) for region {req.region} (fast path)"
                        )
                        image_id = new_image_id
                else:
                    # Fall back to live EC2 API for regions not in our map
                    image_id = EC2InstanceFactory.resolve_os_ami(
                        access_key, secret_key, req.region, os_family, endpoint_url=endpoint_url
                    )
                    logger.info(f"Re-resolved {os_family} to {image_id} for region {req.region} (live API)")
            else:
                logger.warning(f"Provided AMI {image_id} not found in regional map, using as-is for region {req.region}")
        except EC2ProvisioningError:
            raise
        except Exception as e:
            logger.warning(f"Failed to re-resolve AMI for region {req.region}: {e}")
    elif not image_id.startswith("ami-"):
        try:
            image_id = EC2InstanceFactory.resolve_os_ami(access_key, secret_key, req.region, image_id, endpoint_url=endpoint_url)
            logger.info(f"Resolved OS '{req.image_id}' to AMI {image_id} for region {req.region}")
        except EC2ProvisioningError:
            raise


    # Resolve or create "bastion-ssh" security group if bastion is enabled and no security groups are specified
    security_group_ids = list(req.security_group_ids)
    if req.bastion_enabled and not security_group_ids:
        try:
            sgs = EC2InstanceFactory.list_security_groups(access_key, secret_key, req.region, endpoint_url=endpoint_url)
            bastion_sg = next((sg for sg in sgs if sg["group_name"] == "bastion-ssh"), None)
            if bastion_sg:
                security_group_ids.append(bastion_sg["group_id"])
                logger.info(f"Using existing security group 'bastion-ssh' ({bastion_sg['group_id']})")
            else:
                vpc_id = ""
                with EC2InstanceFactory._ec2_client(access_key, secret_key, req.region, endpoint_url) as client:
                    vpcs = client.describe_vpcs(Filters=[{"Name": "is-default", "Values": ["true"]}])
                    if vpcs.get("Vpcs"):
                        vpc_id = vpcs["Vpcs"][0]["VpcId"]
                
                sg_res = EC2InstanceFactory.create_security_group(
                    access_key=access_key,
                    secret_key=secret_key,
                    region=req.region,
                    group_name="bastion-ssh",
                    description="Allow inbound SSH traffic for Bastion",
                    vpc_id=vpc_id,
                    ingress_rules=[{
                        "protocol": "tcp",
                        "from_port": 22,
                        "to_port": 22,
                        "cidr": "0.0.0.0/0",
                        "description": "Allow SSH from anywhere"
                    }],
                    endpoint_url=endpoint_url
                )
                security_group_ids.append(sg_res["group_id"])
                logger.info(f"Created new security group 'bastion-ssh' ({sg_res['group_id']})")
        except Exception as e:
            logger.error(f"Failed to ensure 'bastion-ssh' security group: {e}", exc_info=True)

    # Create local DB record — POST returns immediately, worker does the rest
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
        raise HTTPException(status_code=500, detail=f"Failed to create instance record: {e}")

    logger.info(f"Queueing provision worker for {instance_name}")
    background_tasks.add_task(
        _bastion_register_worker,
        access_key,
        secret_key,
        req.region,
        endpoint_url,
        instance_name,
        db_instance.id,
        image_id,
        req.instance_type,
        req.key_name,
        security_group_ids,
        req.subnet_id,
        user_data,
        req.tags or {},
        bastion_public_key,
    )

    return {
        "message": "EC2 Instance provisioning queued",
        "instance_name": instance_name,
        "bastion_enabled": req.bastion_enabled,
    }
