from fastapi import Request
from app.db_client.db import get_session
from app.db_client.models.ssh_management import System, SSHAuditLog
from sqlmodel import select, delete


async def DELETE(request: Request, systemId: int):
    """Delete a registered system and all its associated audit logs"""
    with get_session() as db:
        system = db.get(System, systemId)
        if not system:
            return {"error": True, "message": "System not found"}

        system_name = system.name

        # Clean up audit logs for this system
        db.exec(delete(SSHAuditLog).where(SSHAuditLog.system_id == systemId))
        db.delete(system)
        db.commit()

    return {"error": False, "message": f"System '{system_name}' and its audit logs have been removed"}
