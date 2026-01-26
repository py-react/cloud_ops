from sqlmodel import Session, select
from typing import Optional, Sequence, List
from app.db_client.models.kubernetes_profiles.deployment import K8sDeployment

def create_deployment(session: Session, data: dict) -> K8sDeployment:
    obj = K8sDeployment(**data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_deployments(session: Session, namespace: Optional[str] = None) -> Sequence[K8sDeployment]:
    query = select(K8sDeployment)
    if namespace:
        query = query.where(K8sDeployment.namespace == namespace)
    return session.exec(query).all()

def get_deployment(session: Session, id: int) -> Optional[K8sDeployment]:
    return session.get(K8sDeployment, id)

def update_deployment(session: Session, id: int, data: dict) -> Optional[K8sDeployment]:
    obj = session.get(K8sDeployment, id)
    if not obj:
        return None
    for key, value in data.items():
        setattr(obj, key, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_deployment(session: Session, id: int) -> bool:
    obj = session.get(K8sDeployment, id)
    if not obj:
        return False
    session.delete(obj)
    session.commit()
    return True
