import logging
from fastapi import Request, HTTPException
from app.gcp_client import (
    load_service_account_json,
    GCSBucketFactory,
    StorageProvisioningError,
)
from app.gcp_client.gcp_auth import GCPAuthError
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_preflight_checker import gcp_preflight_guard
import pydantic

logger = logging.getLogger(__name__)


class BucketCreateRequest(pydantic.BaseModel):
    project_id: str
    bucket_name: str
    location: str
    storage_class: str = "STANDARD"
    labels: dict[str, str] = {}
    autoclass_enabled: bool = False
    hierarchical_namespace_enabled: bool = False
    rapid_cache_enabled: bool = False
    soft_delete_days: int = 7
    versioning_enabled: bool = False
    encryption_kms_key: str = ""


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


def _get_credential(cred_id: int | None):
    """Load and decrypt the service account credential."""
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
async def GET(request: Request):
    """List all GCS buckets."""
    project_id = request.query_params.get("project_id")
    if not project_id:
        return {"buckets": []}

    credential_id = request.query_params.get("credential_id")
    cred_id = _parse_cred_id(credential_id)

    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        buckets = GCSBucketFactory.list(sa_data, project_id)
        return {"buckets": buckets}
    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@gcp_error_interceptor
@gcp_preflight_guard("storage.googleapis.com")
async def POST(request: Request):
    """Create a new GCS bucket."""
    credential_id = request.query_params.get("credential_id")
    cred_id = _parse_cred_id(credential_id)

    try:
        sa_data = _get_credential(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    body = await request.json()
    req = BucketCreateRequest(**body)

    try:
        result = GCSBucketFactory.create(
            sa_data=sa_data,
            project_id=req.project_id,
            bucket_name=req.bucket_name,
            location=req.location,
            storage_class=req.storage_class,
            labels=req.labels,
            autoclass_enabled=req.autoclass_enabled,
            hierarchical_namespace_enabled=req.hierarchical_namespace_enabled,
            rapid_cache_enabled=req.rapid_cache_enabled,
            soft_delete_days=req.soft_delete_days if req.soft_delete_days > 0 else None,
            versioning_enabled=req.versioning_enabled,
            encryption_kms_key=req.encryption_kms_key if req.encryption_kms_key else None,
        )
        return {
            "message": "Bucket created successfully",
            "bucket": result,
        }
    except StorageProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
