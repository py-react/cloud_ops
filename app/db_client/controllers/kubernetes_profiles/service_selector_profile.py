from sqlmodel import Session, select
from typing import List, Optional, Dict
from app.db_client.models.kubernetes_profiles.service_selector_profile import K8sServiceSelectorProfile

def create_service_selector_profile(session: Session, spec: K8sServiceSelectorProfile) -> K8sServiceSelectorProfile:
    session.add(spec)
    session.commit()
    session.refresh(spec)
    return spec

def get_service_selector_profile(session: Session, spec_id: int) -> Optional[K8sServiceSelectorProfile]:
    return session.get(K8sServiceSelectorProfile, spec_id)

def list_service_selector_profiles(session: Session, namespace: str, ids: Optional[List[int]] = None) -> List[K8sServiceSelectorProfile]:
    statement = select(K8sServiceSelectorProfile).where(K8sServiceSelectorProfile.namespace == namespace)
    if ids:
        statement = statement.where(K8sServiceSelectorProfile.id.in_(ids))
    return session.exec(statement).all()

def update_service_selector_profile(session: Session, spec_id: int, data: Dict) -> Optional[K8sServiceSelectorProfile]:
    spec = session.get(K8sServiceSelectorProfile, spec_id)
    if not spec:
        return None
    
    for key, value in data.items():
        setattr(spec, key, value)
        
    session.add(spec)
    session.commit()
    session.refresh(spec)
    return spec

def delete_service_selector_profile(session: Session, spec_id: int) -> bool:
    spec = session.get(K8sServiceSelectorProfile, spec_id)
    if not spec:
        return False
    
    session.delete(spec)
    session.commit()
    return True
