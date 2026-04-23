from fastapi import Request
from app.db_client.db import get_session
from app.db_client.models.ssh_management import KeyDeployment, System
from sqlmodel import select
import logging

logger = logging.getLogger(__name__)

async def GET(request: Request, keyId: int):
    """List all system deployments for a specific SSH key"""
    with get_session() as db:
        statement = select(KeyDeployment, System).join(System).where(KeyDeployment.key_id == keyId)
        results = db.exec(statement).all()
        
        deployments = []
        for deployment, system in results:
            deployments.append({
                "id": deployment.id,
                "system_id": system.id,
                "system_name": system.name,
                "system_ip": system.ip_address,
                "linux_username": deployment.linux_username,
                "privilege_level": deployment.privilege_level,
                "status": deployment.status,
                "last_error": deployment.last_error,
                "restrictions": deployment.restrictions,
                "is_system_managed": deployment.is_system_managed,
                "created_at": deployment.created_at.isoformat() if deployment.created_at else None,
                "updated_at": deployment.updated_at.isoformat() if deployment.updated_at else None,
            })
            
    return {"error": False, "deployments": deployments}
