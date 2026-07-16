import logging
from fastapi import Request
from app.db_client.db import get_session
from app.db_client.controllers.compute_instance import list_compute_instances

logger = logging.getLogger(__name__)


async def GET(request: Request):
    """List all GCP instances from the DB cache (no cloud API calls)."""
    with get_session() as db_session:
        records = list_compute_instances(db_session, provider="gcp")
        instances = []
        for record in records:
            instances.append({
                "name": record.instance_name,
                "status": record.status,
                "zone": record.zone,
                "machine_type": record.machine_type,
                "internal_ip": record.internal_ip or "N/A",
                "external_ip": record.external_ip or "N/A",
                "creation_timestamp": record.cloud_created_at,
                "ssh_username": record.ssh_username or "admin",
                "error_message": record.error_message,
                "state": record.state,
                "cloud_resource_id": record.gcp_resource_id,
            })
    return {"instances": instances}
