import logging
from fastapi import Request, HTTPException
from app.gcp_client import (
    load_service_account_json,
    GCPInstanceFactory,
    GCPProvisioningError,
)
from app.gcp_client.gcp_auth import GCPAuthError, get_active_gcp_credential, get_gcp_credential_by_id
from app.gcp_client.gcp_error_handler import gcp_error_interceptor
from app.gcp_client.gcp_preflight_checker import gcp_preflight_guard
from app.db_client.db import get_session
from app.db_client.models.compute_instance import ComputeInstance
from app.utils.auth import get_current_user
from sqlmodel import select

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


def _get_sa_data(cred_id: int | None) -> tuple[dict, str]:
    """Resolve a credential to raw SA JSON dict + project_id for factory calls."""
    if cred_id:
        credential = get_gcp_credential_by_id(cred_id)
    else:
        credential = get_active_gcp_credential()
    if not credential:
        raise GCPAuthError("No GCP credential found")
    sa_data = load_service_account_json(credential)
    project_id = sa_data.get("project_id", "")
    return sa_data, project_id


@gcp_error_interceptor
@gcp_preflight_guard("compute.googleapis.com")
async def POST(request: Request, instance_name: str):
    """Stop a running VM instance (graceful shutdown)."""
    user = get_current_user(request)

    # Verify ownership and load zone from local database
    db_zone = None
    with get_session() as db_session:
        db_record = db_session.exec(
            select(ComputeInstance).where(ComputeInstance.instance_name == instance_name)
        ).first()
        if db_record:
            if db_record.created_by_user_id != user.id:
                raise HTTPException(status_code=403, detail="Forbidden: You do not own this compute instance")
            db_zone = db_record.zone

    zone = db_zone or request.query_params.get("zone")
    if not zone:
        raise HTTPException(status_code=400, detail="Missing zone")

    credential_id = request.query_params.get("credential_id")
    cred_id = _parse_cred_id(credential_id)
    try:
        sa_data, project_id = _get_sa_data(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        result = GCPInstanceFactory.stop_instance(sa_data, project_id, zone, instance_name)
    except GCPProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)

    logger.info(f"Stop operation for {instance_name}: {result.get('operation_id')}")
    return result
