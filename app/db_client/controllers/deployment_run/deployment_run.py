from sqlmodel import Session, select
from app.db_client.models.deployment_run.deployment_run import DeploymentRun
from app.db_client.models.deployment_run.types import DeploymentRunType
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from typing import List, Optional

def create_deployment_run(session: Session, data: DeploymentRunType) -> DeploymentRun:
    # Check if the deployment config exists and is not soft/hard deleted
    deployment_config_id = getattr(data, "deployment_config_id", None)
    if deployment_config_id is None:
        raise ValueError("deployment_config_id is required to create a deployment run.")
    config_obj = session.get(DeploymentConfig, deployment_config_id)
    if not config_obj:
        raise ValueError(f"DeploymentConfig with id={deployment_config_id} does not exist.")
    if getattr(config_obj, "soft_delete", False):
        raise ValueError("Cannot create deployment run: DeploymentConfig is deleted.")
    if getattr(config_obj, "hard_delete", False):
        raise ValueError("Cannot create deployment run: DeploymentConfig is deleted.")
    obj = DeploymentRun(**data.dict())
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def get_deployment_run(session: Session, id: int) -> Optional[DeploymentRun]:
    return session.get(DeploymentRun, id)

def list_deployment_runs(session: Session, deployment_config_id: Optional[int] = None) -> List[DeploymentRun]:
    if deployment_config_id is not None:
        return session.exec(select(DeploymentRun).where(DeploymentRun.deployment_config_id == deployment_config_id)).all()
    return session.exec(select(DeploymentRun)).all()

def update_deployment_run(session: Session, id: int, data: DeploymentRunType) -> Optional[DeploymentRun]:
    obj = session.get(DeploymentRun, id)
    if not obj:
        return None
    for key, value in data.dict().items():
        setattr(obj, key, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def update_deployment_run_status(session: Session, id: int, status: str) -> Optional[DeploymentRun]:
    obj = session.get(DeploymentRun, id)
    if not obj:
        return None
    obj.status = status
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_deployment_run(session: Session, id: int) -> bool:
    obj = session.get(DeploymentRun, id)
    if not obj:
        return False
    session.delete(obj)
    session.commit()
    return True 