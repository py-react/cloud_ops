import logging
from fastapi import Request, HTTPException

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
    prefix = request.query_params.get("prefix", "")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        result = S3BucketFactory.list_objects(access_key, secret_key, region, bucket_name, prefix, endpoint_url=endpoint_url)
        return result
    except S3ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@aws_error_interceptor
async def POST(request: Request, bucket_name: str):
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    body = await request.json()
    action = body.get("action")

    if action == "create_folder":
        folder_name = body.get("folder_name")
        prefix = body.get("prefix", "")
        if not folder_name:
            raise HTTPException(status_code=400, detail="folder_name is required")
        try:
            result = S3BucketFactory.create_folder(
                access_key=access_key,
                secret_key=secret_key,
                region=region,
                bucket_name=bucket_name,
                folder_name=folder_name,
                prefix=prefix,
                endpoint_url=endpoint_url,
            )
            return result
        except S3ProvisioningError as e:
            raise HTTPException(status_code=e.code, detail=e.message)

    elif action == "move":
        source_object = body.get("source_object")
        destination_object = body.get("destination_object")
        is_folder = body.get("is_folder", False)
        if not source_object or not destination_object:
            raise HTTPException(status_code=400, detail="source_object and destination_object are required")
        try:
            if is_folder:
                result = S3BucketFactory.move_folder(
                    access_key=access_key,
                    secret_key=secret_key,
                    region=region,
                    bucket_name=bucket_name,
                    source_prefix=source_object,
                    destination_prefix=destination_object,
                    endpoint_url=endpoint_url,
                )
            else:
                result = S3BucketFactory.move_object(
                    access_key=access_key,
                    secret_key=secret_key,
                    region=region,
                    bucket_name=bucket_name,
                    source_object=source_object,
                    destination_object=destination_object,
                    endpoint_url=endpoint_url,
                )
            return result
        except S3ProvisioningError as e:
            raise HTTPException(status_code=e.code, detail=e.message)

    else:
        raise HTTPException(status_code=400, detail=f"Unknown action: {action}")


@aws_error_interceptor
async def DELETE(request: Request, bucket_name: str):
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")
    object_name = request.query_params.get("object")
    is_folder = request.query_params.get("is_folder")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        if object_name:
            if is_folder and is_folder.lower() == "true":
                result = S3BucketFactory.delete_folder(
                    access_key=access_key,
                    secret_key=secret_key,
                    region=region,
                    bucket_name=bucket_name,
                    folder_prefix=object_name,
                    endpoint_url=endpoint_url,
                )
            else:
                result = S3BucketFactory.delete_object(
                    access_key=access_key,
                    secret_key=secret_key,
                    region=region,
                    bucket_name=bucket_name,
                    object_name=object_name,
                    endpoint_url=endpoint_url,
                )
            return result
        else:
            result = S3BucketFactory.delete_bucket(access_key, secret_key, region, bucket_name, endpoint_url=endpoint_url)
            return result
    except S3ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
