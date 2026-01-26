from sqlmodel import Session, select
from typing import TypeVar, Optional, Sequence
from app.db_client.models.kubernetes_profiles.profile import K8sEntityProfile

def create_profile(session: Session, data: dict) -> K8sEntityProfile:
    obj = K8sEntityProfile(**data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_profiles(session: Session, namespace: Optional[str] = None) -> Sequence[K8sEntityProfile]:
    query = select(K8sEntityProfile)
    if namespace and hasattr(K8sEntityProfile, "namespace"):
        query = query.where(K8sEntityProfile.namespace == namespace )
    return session.exec(query).all()

def get_profile(session: Session, id: int) -> Optional[K8sEntityProfile]:
    return session.get(K8sEntityProfile, id)

def update_profile(session: Session, id: int, data: dict) -> Optional[K8sEntityProfile]:
    obj = session.get(K8sEntityProfile, id)
    if not obj:
        return None
    for key, value in data.items():
        setattr(obj, key, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_profile(session: Session, id: int) -> bool:
    obj = session.get(K8sEntityProfile, id)
    if not obj:
        return False
    session.delete(obj)
    session.commit()
    return True
