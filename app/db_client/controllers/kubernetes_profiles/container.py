from sqlmodel import Session, select
from typing import TypeVar, Optional, Sequence, List
from app.db_client.models.kubernetes_profiles.container import K8sContainerProfile

def create_profile(session: Session, data: dict) -> K8sContainerProfile:
    obj = K8sContainerProfile(**data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_profiles(session: Session, namespace: Optional[str] = None, ids: Optional[List[int]] = None) -> Sequence[K8sContainerProfile]:
    query = select(K8sContainerProfile)
    if ids:
        query = query.where(K8sContainerProfile.id.in_(ids))
    elif namespace and hasattr(K8sContainerProfile, "namespace"):
        query = query.where(K8sContainerProfile.namespace == namespace )
    return session.exec(query).all()

def get_profile(session: Session, id: int) -> Optional[K8sContainerProfile]:
    return session.get(K8sContainerProfile, id)

def update_profile(session: Session, id: int, data: dict) -> Optional[K8sContainerProfile]:
    obj = session.get(K8sContainerProfile, id)
    if not obj:
        return None
    for key, value in data.items():
        setattr(obj, key, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_profile(session: Session, id: int) -> bool:
    obj = session.get(K8sContainerProfile, id)
    if not obj:
        return False
    session.delete(obj)
    session.commit()
    return True
