import logging
from fastapi import Request, HTTPException

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    aws_error_interceptor,
    LightsailBucketFactory,
    LightsailProvisioningError,
)

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


@aws_error_interceptor
async def GET(request: Request, bucket_name: str):
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        bucket = LightsailBucketFactory.get_bucket(access_key, secret_key, region, bucket_name, endpoint_url=endpoint_url)
        return bucket
    except LightsailProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@aws_error_interceptor
async def DELETE(request: Request, bucket_name: str, credential_id: str | None = None, region: str = "us-east-1"):
    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        result = LightsailBucketFactory.delete_bucket(access_key, secret_key, region, bucket_name, endpoint_url=endpoint_url)
        return result
    except LightsailProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
