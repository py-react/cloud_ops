from sqlmodel import Session, select
from typing import Optional, Sequence, List
from app.db_client.models.kubernetes_profiles.deployment_selector import K8sDeploymentSelectorProfile

def create_profile(session: Session, data: dict) -> K8sDeploymentSelectorProfile:
    obj = K8sDeploymentSelectorProfile(**data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_profiles(session: Session, namespace: Optional[str] = None, ids: Optional[List[int]] = None) -> Sequence[K8sDeploymentSelectorProfile]:
    query = select(K8sDeploymentSelectorProfile)
    if ids:
        query = query.where(K8sDeploymentSelectorProfile.id.in_(ids))
    elif namespace:
        query = query.where(K8sDeploymentSelectorProfile.namespace == namespace)
    return session.exec(query).all()

def get_profile(session: Session, id: int) -> Optional[K8sDeploymentSelectorProfile]:
    return session.get(K8sDeploymentSelectorProfile, id)

def update_profile(session: Session, id: int, data: dict) -> Optional[K8sDeploymentSelectorProfile]:
    obj = session.get(K8sDeploymentSelectorProfile, id)
    if not obj:
        return None
    for key, value in data.items():
        setattr(obj, key, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_profile(session: Session, id: int) -> bool:
    obj = session.get(K8sDeploymentSelectorProfile, id)
    if not obj:
        return False
    session.delete(obj)
    session.commit()
    return True
