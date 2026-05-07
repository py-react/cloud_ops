from fastapi import Request
from app.db_client.db import get_session
from app.db_client.models.ssh_management import System, SSHAuditLog
from sqlmodel import select, delete


async def DELETE(request: Request, systemId: int):
    """Soft-delete a registered system (mark as deleted, preserve audit logs)"""
    from datetime import datetime
    with get_session() as db:
        system = db.get(System, systemId)
        if not system:
            return {"error": True, "message": "System not found"}

        system_name = system.name

        # Perform soft delete
        system.status = "deleted"
        system.deleted_at = datetime.utcnow()
        db.add(system)
        db.commit()

    return {"error": False, "message": f"System '{system_name}' has been archived"}


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
