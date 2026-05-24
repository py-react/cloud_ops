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


class BucketCreateRequest(pydantic.BaseModel):
    bucket_name: str
    region: str = "us-east-1"
    storage_class: str = "STANDARD"
    versioning_enabled: bool = False
    object_lock_enabled: bool = False
    object_lock_mode: str = "GOVERNANCE"
    object_lock_days: int = 30
    versioning_expire_days: int = 0
    encryption: str = "AES256"
    kms_key_id: str = ""
    bucket_policy: str = ""
    tags: dict[str, str] = {}


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


@aws_error_interceptor
async def GET(request: Request):
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        buckets = S3BucketFactory.list_buckets(access_key, secret_key, region, endpoint_url=endpoint_url)
        return {"buckets": buckets}
    except S3ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@aws_error_interceptor
async def POST(request: Request):
    credential_id = request.query_params.get("credential_id")
    cred_id = _parse_cred_id(credential_id)

    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    body = await request.json()
    req = BucketCreateRequest(**body)

    try:
        result = S3BucketFactory.create_bucket(
            access_key=access_key,
            secret_key=secret_key,
            region=req.region,
            bucket_name=req.bucket_name,
            object_lock_enabled=req.object_lock_enabled,
            object_lock_mode=req.object_lock_mode,
            object_lock_days=req.object_lock_days,
            versioning_enabled=req.versioning_enabled,
            versioning_expire_days=req.versioning_expire_days,
            storage_class=req.storage_class,
            encryption=req.encryption,
            kms_key_id=req.kms_key_id or None,
            bucket_policy=req.bucket_policy or None,
            tags=req.tags or None,
            endpoint_url=endpoint_url,
        )
        return {"message": "Bucket created successfully", "bucket": result}
    except S3ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
