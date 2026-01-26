from sqlmodel import Session, select
from typing import Optional, Sequence
from app.db_client.models.kubernetes_profiles.pod_profile import K8sPodProfile

def create_profile(session: Session, data: dict) -> K8sPodProfile:
    obj = K8sPodProfile(**data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_profiles(session: Session, namespace: Optional[str] = None) -> Sequence[K8sPodProfile]:
    query = select(K8sPodProfile)
    if namespace:
        query = query.where(K8sPodProfile.namespace == namespace)
    return session.exec(query).all()

def get_profile(session: Session, id: int) -> Optional[K8sPodProfile]:
    return session.get(K8sPodProfile, id)

def update_profile(session: Session, id: int, data: dict) -> Optional[K8sPodProfile]:
    obj = session.get(K8sPodProfile, id)
    if not obj:
        return None
    for key, value in data.items():
        setattr(obj, key, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_profile(session: Session, id: int) -> bool:
    obj = session.get(K8sPodProfile, id)
    if not obj:
        return False
    session.delete(obj)
    session.commit()
    return True
