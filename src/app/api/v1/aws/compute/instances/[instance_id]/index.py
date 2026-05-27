import logging
import importlib
import os
from fastapi import Request, HTTPException, BackgroundTasks
from sqlmodel import select

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    aws_error_interceptor,
    EC2InstanceFactory,
    EC2ProvisioningError,
)
from app.db_client.db import get_session
from app.db_client.models.ssh_management import System
from app.db_client.models.compute_instance import ComputeInstance

logger = logging.getLogger(__name__)

_bastion_root = os.path.join(
    os.path.dirname(__file__),
    "../../../../../bastion",
)

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


def _cleanup_worker(
    access_key: str,
    secret_key: str,
    region: str,
    endpoint_url: str | None,
    instance_id: str,
    instance_name: str,
    bastion_system_id: int | None,
):
    """Background task: terminate instance, remove volumes, snapshots, Elastic IPs, archive Bastion."""
    try:
        result = EC2InstanceFactory.cleanup_instance_resources(
            access_key, secret_key, region, instance_id, endpoint_url=endpoint_url
        )
        logger.info(
            f"Cleanup for {instance_name} ({instance_id}): "
            f"volumes={result['volumes']} snapshots={result['snapshots']} elastic_ips={result['elastic_ips']}"
        )
    except Exception as e:
        logger.error(f"Failed to clean up resources for {instance_name}: {e}")

    # Delete local DB record
    if instance_name:
        try:
            with get_session() as db_session:
                from app.db_client.controllers.compute_instance import delete_compute_instance
                delete_compute_instance(db_session, instance_name)
                logger.info(f"Deleted local DB ComputeInstance record for {instance_name}")
        except Exception as e:
            logger.error(f"Failed to delete local DB record for {instance_name}: {e}")

    # Archive Bastion system
    if bastion_system_id:
        try:
            archive_system_by_id(bastion_system_id)
            logger.info(f"Archived linked Bastion system ID {bastion_system_id} for {instance_name}")
        except Exception as e:
            logger.error(f"Failed to archive Bastion system ID {bastion_system_id}: {e}")
    elif instance_name:
        try:
            with get_session() as db:
                system = db.exec(
                    select(System).where(
                        System.name == instance_name,
                        System.status != "deleted",
                        System.provider == "aws",
                    )
                ).first()
                if system:
                    archive_system_by_id(system.id)
                    logger.info(f"Archived Bastion system '{instance_name}' (ID: {system.id}) via name fallback")
        except Exception as e:
            logger.error(f"Failed fallback archive Bastion system for {instance_name}: {e}")


@aws_error_interceptor
async def GET(request: Request, instance_id: str):
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        instance = EC2InstanceFactory.get_instance(access_key, secret_key, region, instance_id, endpoint_url=endpoint_url)

        # Merge local DB properties
        db_record = None
        try:
            with get_session() as db_session:
                db_record = db_session.exec(
                    select(ComputeInstance).where(
                        ComputeInstance.gcp_resource_id == instance_id,
                        ComputeInstance.provider == "aws"
                    )
                ).first()
        except Exception as e:
            logger.error(f"Failed to query DB for details: {e}")

        if db_record:
            instance["ssh_username"] = db_record.ssh_username or "admin"
            instance["bastion_system_id"] = db_record.bastion_system_id
            if db_record.status in ("PROVISIONING", "FAILED"):
                instance["state"] = db_record.status.lower()
        else:
            instance["ssh_username"] = "admin"
            instance["bastion_system_id"] = None

        return instance
    except EC2ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@aws_error_interceptor
async def DELETE(request: Request, instance_id: str, background_tasks: BackgroundTasks):
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    instance_name = None
    bastion_system_id = None
    try:
        with get_session() as db_session:
            db_record = db_session.exec(
                select(ComputeInstance).where(
                    ComputeInstance.gcp_resource_id == instance_id,
                    ComputeInstance.provider == "aws"
                )
            ).first()
            if db_record:
                instance_name = db_record.instance_name
                bastion_system_id = db_record.bastion_system_id
                from app.db_client.controllers.compute_instance import update_instance_status
                update_instance_status(db_session, instance_name, "STOPPING")
    except Exception as e:
        logger.error(f"Failed to lookup DB record before delete: {e}")

    if not instance_name:
        try:
            instance_detail = EC2InstanceFactory.get_instance(
                access_key, secret_key, region, instance_id, endpoint_url=endpoint_url
            )
            instance_name = instance_detail.get("name", "")
        except Exception:
            logger.warning(f"Could not fetch instance {instance_id} details before deletion")

    background_tasks.add_task(
        _cleanup_worker,
        access_key,
        secret_key,
        region,
        endpoint_url,
        instance_id,
        instance_name,
        bastion_system_id,
    )

    return {
        "message": f"Instance '{instance_id}' termination and cleanup initiated",
        "instance_id": instance_id,
        "region": region,
    }
