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

    if instance_name:
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
                    logger.info(f"Archived Bastion system '{instance_name}' (ID: {system.id})")
        except Exception as e:
            logger.error(f"Failed to archive Bastion system for {instance_name}: {e}")


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
    )

    return {
        "message": f"Instance '{instance_id}' termination and cleanup initiated",
        "instance_id": instance_id,
        "region": region,
    }
