import logging
from fastapi import Request, HTTPException, UploadFile, File

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    aws_error_interceptor,
    S3BucketFactory,
    S3ProvisioningError,
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
    object_key = request.query_params.get("object")

    if not object_key:
        raise HTTPException(status_code=400, detail="object query parameter is required")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        url = S3BucketFactory.generate_presigned_url(
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            bucket_name=bucket_name,
            object_key=object_key,
            endpoint_url=endpoint_url,
        )
        return {"url": url}
    except S3ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@aws_error_interceptor
async def POST(request: Request, bucket_name: str):
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")
    prefix = request.query_params.get("prefix", "")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    form = await request.form()
    file: UploadFile = form.get("file")

    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    contents = await file.read()

    try:
        result = S3BucketFactory.upload_file(
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            bucket_name=bucket_name,
            file_name=file.filename or "uploaded_file",
            file_contents=contents,
            prefix=prefix,
            endpoint_url=endpoint_url,
        )
        return result
    except S3ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
