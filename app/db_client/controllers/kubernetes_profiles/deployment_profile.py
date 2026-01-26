from sqlmodel import Session, select
from typing import Optional, Sequence, List
from app.db_client.models.kubernetes_profiles.deployment_profile import K8sDeploymentProfile

def create_profile(session: Session, data: dict) -> K8sDeploymentProfile:
    obj = K8sDeploymentProfile(**data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_profiles(session: Session, namespace: Optional[str] = None, ids: Optional[List[int]] = None) -> Sequence[K8sDeploymentProfile]:
    query = select(K8sDeploymentProfile)
    if ids:
        query = query.where(K8sDeploymentProfile.id.in_(ids))
    elif namespace:
        query = query.where(K8sDeploymentProfile.namespace == namespace)
    return session.exec(query).all()

def get_profile(session: Session, id: int) -> Optional[K8sDeploymentProfile]:
    return session.get(K8sDeploymentProfile, id)

def update_profile(session: Session, id: int, data: dict) -> Optional[K8sDeploymentProfile]:
    obj = session.get(K8sDeploymentProfile, id)
    if not obj:
        return None
    for key, value in data.items():
        setattr(obj, key, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_profile(session: Session, id: int) -> bool:
    obj = session.get(K8sDeploymentProfile, id)
    if not obj:
        return False
    session.delete(obj)
    session.commit()
    return True
