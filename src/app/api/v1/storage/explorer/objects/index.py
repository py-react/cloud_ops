import logging
from fastapi import Request, HTTPException, UploadFile, File, Form
from app.gcp_client import (
    load_service_account_json,
    GCSBucketFactory,
    StorageProvisioningError,
)
from app.gcp_client.gcp_auth import GCPAuthError
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_preflight_checker import gcp_preflight_guard

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


def _get_credential(cred_id: int | None):
    from app.db_client.db import get_session
    from app.db_client.models.github_pat.github_pat import IntegrationCredential
    from sqlmodel import select

    with get_session() as session:
        if cred_id:
            statement = select(IntegrationCredential).where(IntegrationCredential.id == cred_id)
        else:
            statement = select(IntegrationCredential).where(
                IntegrationCredential.provider == "gcp"
            ).order_by(IntegrationCredential.id)
        credential = session.exec(statement).first()

    if not credential:
        raise GCPAuthError("No GCP credential found")

    sa_data = load_service_account_json(credential)
    return sa_data


@gcp_error_interceptor
@gcp_preflight_guard("storage.googleapis.com")
async def POST(request: Request):
    bucket_name = request.query_params.get("bucket")
    project_id = request.query_params.get("project_id")
    prefix = request.query_params.get("prefix", "")
    credential_id = request.query_params.get("credential_id")
    action = request.query_params.get("action", "upload")

    if not bucket_name or not project_id:
        raise HTTPException(status_code=400, detail="Missing bucket or project_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        if action == "upload":
            form = await request.form()
            file = form.get("file")
            if not file or not hasattr(file, "read"):
                raise HTTPException(status_code=400, detail="No file provided")
            file_contents = await file.read()
            content_type = getattr(file, "content_type", "application/octet-stream") or "application/octet-stream"
            file_name = getattr(file, "filename", "unknown")
            result = GCSBucketFactory.upload_file(sa_data, project_id, bucket_name, file_name, file_contents, content_type, prefix)
            return result

        elif action == "copy":
            body = await request.json()
            source_object = body.get("source_object")
            destination_object = body.get("destination_object")
            dest_bucket = body.get("dest_bucket", "")
            if not source_object or not destination_object:
                raise HTTPException(status_code=400, detail="source_object and destination_object are required")
            result = GCSBucketFactory.copy_object(sa_data, project_id, bucket_name, source_object, destination_object, dest_bucket)
            return result

        elif action == "move":
            body = await request.json()
            source_object = body.get("source_object")
            destination_object = body.get("destination_object")
            is_folder = body.get("is_folder", False)
            if not source_object or not destination_object:
                raise HTTPException(status_code=400, detail="source_object and destination_object are required")
            if is_folder:
                result = GCSBucketFactory.move_folder(sa_data, project_id, bucket_name, source_object, destination_object)
            else:
                result = GCSBucketFactory.move_object(sa_data, project_id, bucket_name, source_object, destination_object)
            return result

        else:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action}")

    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@gcp_error_interceptor
@gcp_preflight_guard("storage.googleapis.com")
async def GET(request: Request):
    bucket_name = request.query_params.get("bucket")
    object_name = request.query_params.get("object")
    project_id = request.query_params.get("project_id")
    credential_id = request.query_params.get("credential_id")

    if not bucket_name or not object_name or not project_id:
        raise HTTPException(status_code=400, detail="Missing bucket, object, or project_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        result = GCSBucketFactory.generate_signed_url(sa_data, project_id, bucket_name, object_name)
        return result
    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@gcp_error_interceptor
@gcp_preflight_guard("storage.googleapis.com")
async def DELETE(request: Request):
    bucket_name = request.query_params.get("bucket")
    object_name = request.query_params.get("object")
    project_id = request.query_params.get("project_id")
    credential_id = request.query_params.get("credential_id")
    is_folder = request.query_params.get("is_folder", "false").lower() == "true"

    if not bucket_name or not object_name or not project_id:
        raise HTTPException(status_code=400, detail="Missing bucket, object, or project_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        if is_folder:
            result = GCSBucketFactory.delete_folder(sa_data, project_id, bucket_name, object_name)
        else:
            result = GCSBucketFactory.delete_object(sa_data, project_id, bucket_name, object_name)
        return result
    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
