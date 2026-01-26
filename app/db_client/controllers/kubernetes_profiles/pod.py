from sqlmodel import Session, select
from typing import Optional, Sequence
from app.db_client.models.kubernetes_profiles.pod import K8sPod

def create_pod(session: Session, data: dict) -> K8sPod:
    obj = K8sPod(**data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_pods(session: Session, namespace: Optional[str] = None) -> Sequence[K8sPod]:
    query = select(K8sPod)
    if namespace:
        query = query.where(K8sPod.namespace == namespace)
    return session.exec(query).all()

def get_pod(session: Session, id: int) -> Optional[K8sPod]:
    return session.get(K8sPod, id)

def update_pod(session: Session, id: int, data: dict) -> Optional[K8sPod]:
    obj = session.get(K8sPod, id)
    if not obj:
        return None
    for key, value in data.items():
        setattr(obj, key, value)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_pod(session: Session, id: int) -> bool:
    obj = session.get(K8sPod, id)
    if not obj:
        return False
    session.delete(obj)
    session.commit()
    return True
