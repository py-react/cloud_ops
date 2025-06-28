from sqlmodel import Session, select
from app.db_client.models.deployment_strategy.deployment_strategy import DeploymentStrategy
from app.db_client.models.deployment_strategy.types import DeploymentStrategyType
from typing import List

def create_deployment_strategy(session: Session, data: DeploymentStrategyType) -> DeploymentStrategy:
    obj = DeploymentStrategy(**data.dict())
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_deployment_strategies(session: Session) -> List[DeploymentStrategy]:
    return session.exec(select(DeploymentStrategy)).all()

def get_deployment_strategy(session: Session, id: int) -> DeploymentStrategy:
    return session.get(DeploymentStrategy, id) 