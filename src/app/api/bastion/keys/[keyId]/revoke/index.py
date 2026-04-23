from fastapi import Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.db_client.db import get_session
from app.db_client.models.ssh_management import SSHKey, KeyDeployment, System
from app.bastion_helper import BastionManager
import logging

logger = logging.getLogger(__name__)

class RevokeRequest(BaseModel):
    deployment_id: Optional[int] = None # If provided, only revoke this specific deployment
    system_id: Optional[int] = None     # Legacy support or bulk revoke

async def POST(request: Request, keyId: int, body: RevokeRequest, background_tasks: BackgroundTasks):
    """Revoke system access for an SSH key using background tasks"""
    with get_session() as db:
        key = db.get(SSHKey, keyId)
        if not key:
            return {"error": True, "message": "Key not found"}

        deployment = None
        if body.deployment_id:
            deployment = db.get(KeyDeployment, body.deployment_id)
        elif body.system_id:
            from sqlmodel import select
            statement = select(KeyDeployment).where(
                KeyDeployment.key_id == keyId,
                KeyDeployment.system_id == body.system_id
            )
            deployment = db.exec(statement).first()

        if not deployment:
             # If no deployment record found, we check if they are trying to revoke but the record doesn't exist
             return {"error": True, "message": "Deployment record not found."}

        # Set status to revoking
        deployment.status = "revoking"
        db.add(deployment)
        db.commit()
        db.refresh(deployment)

    # Start background task
    background_tasks.add_task(BastionManager.background_revoke_task, deployment.id)

    return {
        "error": False, 
        "message": "Revocation task started in background.",
        "deployment_id": deployment.id
    }
