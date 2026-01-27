from sqlmodel import Session, select
from typing import List, Optional, Dict
from app.db_client.models.kubernetes_profiles.service_profile import K8sServiceProfile

def create_service_profile(session: Session, spec: K8sServiceProfile) -> K8sServiceProfile:
    session.add(spec)
    session.commit()
    session.refresh(spec)
    return spec

def get_service_profile(session: Session, spec_id: int) -> Optional[K8sServiceProfile]:
    return session.get(K8sServiceProfile, spec_id)

def list_service_profiles(session: Session, namespace: str, ids: Optional[List[int]] = None) -> List[K8sServiceProfile]:
    statement = select(K8sServiceProfile).where(K8sServiceProfile.namespace == namespace)
    if ids:
        statement = statement.where(K8sServiceProfile.id.in_(ids))
    return session.exec(statement).all()

def update_service_profile(session: Session, spec_id: int, data: Dict) -> Optional[K8sServiceProfile]:
    spec = session.get(K8sServiceProfile, spec_id)
    if not spec:
        return None
    
    for key, value in data.items():
        setattr(spec, key, value)
        
    session.add(spec)
    session.commit()
    session.refresh(spec)
    return spec

def delete_service_profile(session: Session, spec_id: int) -> bool:
    spec = session.get(K8sServiceProfile, spec_id)
    if not spec:
        return False
    
    session.delete(spec)
    session.commit()
    return True
