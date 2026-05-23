from fastapi import Request
from app.db_client.db import get_session
from app.db_client.models.ssh_management import System, SSHAuditLog
from sqlmodel import select, delete
import logging

logger = logging.getLogger(__name__)


def archive_system_by_id(system_id: int) -> System | None:
    """Soft-delete a registered system by ID. Returns the system object or None."""
    from datetime import datetime
    try:
        with get_session() as db:
            system = db.get(System, system_id)
            if not system:
                logger.warning(f"System ID {system_id} not found for archival")
                return None

            system.status = "deleted"
            system.deleted_at = datetime.utcnow()
            db.add(system)
            db.commit()
            logger.info(f"Archived Bastion system '{system.name}' (ID: {system_id})")
            return system
    except Exception as e:
        logger.error(f"Failed to archive system {system_id}: {e}")
        return None


async def DELETE(request: Request, systemId: int):
    """Soft-delete a registered system (mark as deleted, preserve audit logs)"""
    system = archive_system_by_id(systemId)
    if not system:
        return {"error": True, "message": "System not found"}

    return {"error": False, "message": f"System '{system.name}' has been archived"}


async def PATCH(request: Request, systemId: int):
    """Update system status (active/inactive)"""
    body = await request.json()
    new_status = body.get("status")
    
    if new_status not in ["active", "inactive"]:
        return {"error": True, "message": "Invalid status. Must be 'active' or 'inactive'."}

    with get_session() as db:
        system = db.get(System, systemId)
        if not system:
            return {"error": True, "message": "System not found"}

        system.status = new_status
        db.add(system)
        db.commit()
        db.refresh(system)

    return {"error": False, "message": f"System '{system.name}' is now {new_status}", "system": system.dict()}
