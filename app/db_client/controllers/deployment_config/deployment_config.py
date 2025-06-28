from sqlmodel import Session, select
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from app.db_client.models.deployment_config.types import DeploymentConfigType
from typing import List, Optional
from datetime import datetime
from sqlalchemy import or_

def create_deployment_config(session: Session, data: DeploymentConfigType) -> DeploymentConfig:
    obj = DeploymentConfig(**data.dict())
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_deployment_configs(
    session: Session,
    namespace: str = "default",
    include_hard_deleted: bool = False
) -> List[DeploymentConfig]:
    query = select(DeploymentConfig).where(DeploymentConfig.namespace == namespace)

    # if  not include_hard_deleted:
    #     # Only configs that are NOT soft deleted and NOT hard deleted
    #     query = query.where(
    #         DeploymentConfig.hard_delete == False
    #     )
    # else:
    #     conditions = []
    #     if include_hard_deleted:
    #         conditions.append(DeploymentConfig.hard_delete == True)
    #     if conditions:
    #         query = query.where(or_(*conditions))
    return session.exec(query).all()

def get_deployment_config(session: Session, id: int) -> Optional[DeploymentConfig]:
    return session.get(DeploymentConfig, id)

def update_deployment_config(session: Session, id: int, data: DeploymentConfigType) -> Optional[DeploymentConfig]:
    obj = session.get(DeploymentConfig, id)
    if not obj:
        return None
    for key, value in data.dict().items():
        setattr(obj, key, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_deployment_config(session: Session, id: int) -> bool:
    obj = session.get(DeploymentConfig, id)
    if not obj:
        return False
    obj.hard_delete = True
    obj.deleted_at = datetime.utcnow()
    session.add(obj)
    session.commit()
    return True
