from fastapi import Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict
from app.db_client.db import get_session
from app.db_client.models.ssh_management import SSHKey, System, KeyDeployment
from app.bastion_helper import BastionManager
from sqlmodel import select
import logging

logger = logging.getLogger(__name__)

class DeployRequest(BaseModel):
    system_id: int
    linux_username: Optional[str] = None
    privilege_level: Optional[str] = "user"
    is_system_managed: Optional[bool] = False
    restrictions: Optional[Dict] = {}

async def POST(request: Request, keyId: int, body: DeployRequest, background_tasks: BackgroundTasks):
    """Deploy an SSH key with granular options using background tasks"""
    with get_session() as db:
        key = db.get(SSHKey, keyId)
        if not key:
            return {"error": True, "message": "Key not found"}
        if not key.is_active:
            return {"error": True, "message": "Cannot deploy a revoked key"}

        system = db.get(System, body.system_id)
        if not system:
            return {"error": True, "message": "System not found"}

        # Capture names before session close to avoid DetachedInstanceError
        key_name = key.name
        system_name = system.name

        # Use key name as default username if not provided
        linux_username = body.linux_username or key.name.lower().replace(" ", "_")

        # Create deployment record
        deployment = KeyDeployment(
            key_id=keyId,
            system_id=body.system_id,
            linux_username=linux_username,
            privilege_level=body.privilege_level,
            is_system_managed=body.is_system_managed,
            restrictions=body.restrictions,
            status="pending"
        )
        db.add(deployment)
        db.commit()
        db.refresh(deployment)

    # Start background task
    background_tasks.add_task(BastionManager.background_deploy_task, deployment.id)

    return {
        "error": False, 
        "message": f"Deployment of '{key_name}' to '{system_name}' started in background.",
        "deployment_id": deployment.id
    }
