import logging
from fastapi import Request, HTTPException
import pydantic

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    aws_error_interceptor,
    S3BucketFactory,
    S3ProvisioningError,
)

logger = logging.getLogger(__name__)


class BucketUpdateRequest(pydantic.BaseModel):
    versioning_enabled: bool | None = None
    versioning_expire_days: int | None = None
    encryption: str | None = None
    kms_key_id: str | None = None
    bucket_policy: str | None = None
    tags: dict[str, str] | None = None


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
        config = S3BucketFactory.get_config(access_key, secret_key, region, bucket_name, endpoint_url=endpoint_url)
        return config
    except S3ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@aws_error_interceptor
async def PUT(request: Request, bucket_name: str):
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    body = await request.json()
    req = BucketUpdateRequest(**body)

    try:
        result = S3BucketFactory.update_config(
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            bucket_name=bucket_name,
            versioning_enabled=req.versioning_enabled,
            versioning_expire_days=req.versioning_expire_days,
            encryption=req.encryption,
            kms_key_id=req.kms_key_id or None,
            bucket_policy=req.bucket_policy or None,
            tags=req.tags or None,
            endpoint_url=endpoint_url,
        )
        return result
    except S3ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
