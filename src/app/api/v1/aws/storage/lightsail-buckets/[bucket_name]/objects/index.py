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
    prefix = request.query_params.get("prefix", "")
    bucket_url = request.query_params.get("bucket_url")

    if not bucket_url:
        raise HTTPException(status_code=400, detail="bucket_url query parameter is required")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        result = LightsailBucketFactory.list_objects(
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            bucket_name=bucket_name,
            bucket_url=bucket_url,
            prefix=prefix,
            endpoint_url=endpoint_url,
        )
        return result
    except LightsailProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@aws_error_interceptor
async def DELETE(request: Request, bucket_name: str):
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")
    object_name = request.query_params.get("object")
    bucket_url = request.query_params.get("bucket_url")

    if not object_name:
        raise HTTPException(status_code=400, detail="object query parameter is required")
    if not bucket_url:
        raise HTTPException(status_code=400, detail="bucket_url query parameter is required")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        result = LightsailBucketFactory.delete_object(
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            bucket_name=bucket_name,
            bucket_url=bucket_url,
            object_name=object_name,
            endpoint_url=endpoint_url,
        )
        return result
    except LightsailProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
