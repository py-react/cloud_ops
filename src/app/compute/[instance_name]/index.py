import logging
from fastapi import Request, HTTPException
from google.cloud import compute_v1
from app.gcp_client import get_gcp_credentials
from app.gcp_client.gcp_auth import GCPAuthError
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

async def index(request: Request, instance_name: str):
    """Server-side props loader for the VM Details page."""
    try:
        user = get_current_user(request)
    except HTTPException:
        # If user is not authenticated, let's raise 401
        raise HTTPException(status_code=401, detail="Authentication required")

    # Step A: Query local database using instance_name to verify ownership and load configuration constants
    db_id = None
    db_zone = None
    db_machine_type = None
    db_boot_disk_size_gb = None
    db_gcp_resource_id = None

    with get_session() as db_session:
        db_record = db_session.exec(
            select(ComputeInstance).where(ComputeInstance.instance_name == instance_name)
        ).first()
        if db_record:
            if db_record.created_by_user_id != user.id:
                raise HTTPException(status_code=403, detail="Forbidden: You do not own this compute instance")
            db_id = db_record.id
            db_zone = db_record.zone
            db_machine_type = db_record.machine_type
            db_boot_disk_size_gb = db_record.boot_disk_size_gb
            db_gcp_resource_id = db_record.gcp_resource_id

    # Fallback to query params if not found in database (for legacy compat)
    zone = db_zone or request.query_params.get("zone")
    if not zone:
        # Try to find any active GCP credential to fetch zones
        credential_id = request.query_params.get("credential_id")
        cred_id = _parse_cred_id(credential_id)
        try:
            _, project_id = get_gcp_credentials(cred_id)
        except GCPAuthError:
            raise HTTPException(status_code=400, detail="Missing zone configuration and GCP credentials")
        # Default zone if not present
        zone = "us-central1-a"

    credential_id = request.query_params.get("credential_id")
    cred_id = _parse_cred_id(credential_id)
    try:
        creds, project_id = get_gcp_credentials(cred_id)
    except GCPAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    # Step B: Build precise GCP SDK fetch request targeting the live machine instance
    instance_client = compute_v1.InstancesClient(credentials=creds)
    try:
        live_gcp_state = instance_client.get(
            project=project_id, 
            zone=zone, 
            instance=instance_name
        )
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Instance not found on live GCP API: {str(e)}")

    # Step C: Extract dynamic elements and merge
    external_ip = "N/A"
    if live_gcp_state.network_interfaces and live_gcp_state.network_interfaces[0].access_configs:
        external_ip = live_gcp_state.network_interfaces[0].access_configs[0].nat_i_p or "N/A"

    return {
        "instance": {
            "id": db_id,
            "instance_name": instance_name,
            "zone": zone,
            "machine_type": db_machine_type or live_gcp_state.machine_type.split("/")[-1],
            "boot_disk_size_gb": db_boot_disk_size_gb or 10,
            "gcp_resource_id": db_gcp_resource_id or str(live_gcp_state.id),
            "status": live_gcp_state.status, # RUNNING, TERMINATED
            "external_ip": external_ip,
            "creation_timestamp": live_gcp_state.creation_timestamp,
            "description": live_gcp_state.description or "No description provided."
        }
    }

def meta_data():
    return {
        "title": "Compute Instance Details - CloudOps",
        "description": "View real-time GCP Compute Engine operational states.",
        "icon": "/static/images/favicon.ico"
    }
