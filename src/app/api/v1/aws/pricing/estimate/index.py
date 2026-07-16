import logging
from fastapi import Request, HTTPException

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    estimate_s3_storage_cost,
    estimate_ec2_instance_cost,
    AWSPricingError,
)

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


async def GET(request: Request, credential_id: str | None = None, resource_type: str = "s3_bucket", region: str = "us-east-1", storage_class: str = "STANDARD", size_gb: int = 10, instance_type: str = "t2.micro", volume_size: int = 10, volume_type: str = "gp3"):
    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        if resource_type == "ec2_instance":
            result = estimate_ec2_instance_cost(
                access_key=access_key,
                secret_key=secret_key,
                instance_type=instance_type,
                region=region,
                volume_size=volume_size,
                volume_type=volume_type,
            )
        elif resource_type == "s3_bucket":
            result = estimate_s3_storage_cost(
                access_key=access_key,
                secret_key=secret_key,
                region=region,
                storage_class=storage_class,
                size_gb=size_gb,
            )
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported resource_type: {resource_type}")
        return result
    except AWSPricingError as e:
        return {
            "available": False,
            "estimated_cost_hourly": None,
            "estimated_cost_monthly": None,
            "message": str(e),
        }
