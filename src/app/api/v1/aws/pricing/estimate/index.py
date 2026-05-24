import logging
from fastapi import Request, HTTPException

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    estimate_s3_storage_cost,
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


async def GET(request: Request):
    credential_id = request.query_params.get("credential_id")
    resource_type = request.query_params.get("resource_type", "s3_bucket")
    region = request.query_params.get("region", "us-east-1")
    storage_class = request.query_params.get("storage_class", "STANDARD")
    size_gb_str = request.query_params.get("size_gb", "10")

    try:
        size_gb = int(size_gb_str)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid size_gb")

    if resource_type != "s3_bucket":
        raise HTTPException(status_code=400, detail=f"Unsupported resource_type: {resource_type}")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        result = estimate_s3_storage_cost(
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            storage_class=storage_class,
            size_gb=size_gb,
        )
        return result
    except AWSPricingError as e:
        raise HTTPException(status_code=500, detail=e.message)
