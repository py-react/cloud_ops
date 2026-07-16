import logging
from fastapi import Request
from app.db_client.db import get_session
from app.db_client.controllers.compute_instance import list_compute_instances

logger = logging.getLogger(__name__)


async def GET(request: Request):
    """List all AWS instances from the DB cache (no cloud API calls)."""
    with get_session() as db_session:
        records = list_compute_instances(db_session, provider="aws")
        instances = []
        for record in records:
            az = record.zone or ""
            instances.append({
                "name": record.instance_name,
                "instance_id": record.gcp_resource_id or record.instance_name,
                "state": record.state or record.status.lower() or "unknown",
                "instance_type": record.machine_type,
                "availability_zone": az,
                "region": az[:-1] if az and len(az) > 1 else az,
                "private_ip": record.internal_ip or "N/A",
                "public_ip": record.external_ip or "N/A",
                "launch_time": record.cloud_created_at,
                "ssh_username": record.ssh_username or "admin",
                "status": record.status,
                "error_message": record.error_message,
            })
    return {"instances": instances}
