from fastapi import Request, BackgroundTasks
from pydantic import BaseModel
from app.db_client.db import get_session
from app.db_client.models.ssh_management import KeyDeployment
from app.bastion_helper import BastionManager
import logging

logger = logging.getLogger(__name__)

class RetryRequest(BaseModel):
    deployment_id: int

async def POST(request: Request, keyId: int, body: RetryRequest, background_tasks: BackgroundTasks):
    """Retry a failed deployment by resetting its status and re-running the background task"""
    with get_session() as db:
        deployment = db.get(KeyDeployment, body.deployment_id)
        if not deployment:
            return {"error": True, "message": "Deployment record not found"}
        if deployment.key_id != keyId:
            return {"error": True, "message": "Deployment does not belong to this key"}
        if deployment.status not in ("failed", "revoke_failed"):
            return {"error": True, "message": f"Can only retry failed deployments. Current status: {deployment.status}"}

        # Reset to pending and clear last error
        deployment.status = "pending"
        deployment.last_error = None
        db.add(deployment)
        db.commit()
        db.refresh(deployment)
        deployment_id = deployment.id

    background_tasks.add_task(BastionManager.background_deploy_task, deployment_id)

    return {
        "error": False,
        "message": "Deployment retry started in background.",
        "deployment_id": deployment_id
    }
