import logging
from fastapi import Request, HTTPException
from google.cloud import compute_v1
from app.gcp_client import get_gcp_credentials
from app.gcp_client.gcp_auth import GCPAuthError
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

@gcp_error_interceptor
@gcp_preflight_guard("compute.googleapis.com")
async def POST(request: Request, instance_name: str):
    """Start a stopped or terminated VM instance."""
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
        creds, project_id = get_gcp_credentials(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    instance_client = compute_v1.InstancesClient(credentials=creds)
    operation = instance_client.start(project=project_id, zone=zone, instance=instance_name)

    logger.info(f"Start operation for {instance_name}: {operation.name}")

    return {
        "message": f"VM '{instance_name}' is starting",
        "operation_id": operation.name,
        "status": "STARTING"
    }
