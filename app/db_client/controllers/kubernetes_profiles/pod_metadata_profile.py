from sqlmodel import Session, select
from typing import Optional, Sequence, List
from app.db_client.models.kubernetes_profiles.pod_metadata_profile import K8sPodMetaDataProfile

def create_profile(session: Session, data: dict) -> K8sPodMetaDataProfile:
    obj = K8sPodMetaDataProfile(**data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_profiles(session: Session, namespace: Optional[str] = None, ids: Optional[List[int]] = None) -> Sequence[K8sPodMetaDataProfile]:
    query = select(K8sPodMetaDataProfile)
    if ids:
        query = query.where(K8sPodMetaDataProfile.id.in_(ids))
    elif namespace:
        query = query.where(K8sPodMetaDataProfile.namespace == namespace)
    return session.exec(query).all()

def get_profile(session: Session, id: int) -> Optional[K8sPodMetaDataProfile]:
    return session.get(K8sPodMetaDataProfile, id)

def update_profile(session: Session, id: int, data: dict) -> Optional[K8sPodMetaDataProfile]:
    obj = session.get(K8sPodMetaDataProfile, id)
    if not obj:
        return None
    for key, value in data.items():
        setattr(obj, key, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_profile(session: Session, id: int) -> bool:
    obj = session.get(K8sPodMetaDataProfile, id)
    if not obj:
        return False
    session.delete(obj)
    session.commit()
    return True
