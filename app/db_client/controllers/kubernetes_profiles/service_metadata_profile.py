from sqlmodel import Session, select
from typing import List, Optional, Dict
from app.db_client.models.kubernetes_profiles.service_metadata_profile import K8sServiceMetadataProfile

def create_service_metadata_profile(session: Session, spec: K8sServiceMetadataProfile) -> K8sServiceMetadataProfile:
    session.add(spec)
    session.commit()
    session.refresh(spec)
    return spec

def get_service_metadata_profile(session: Session, spec_id: int) -> Optional[K8sServiceMetadataProfile]:
    return session.get(K8sServiceMetadataProfile, spec_id)

def list_service_metadata_profiles(session: Session, namespace: str, ids: Optional[List[int]] = None) -> List[K8sServiceMetadataProfile]:
    statement = select(K8sServiceMetadataProfile).where(K8sServiceMetadataProfile.namespace == namespace)
    if ids:
        statement = statement.where(K8sServiceMetadataProfile.id.in_(ids))
    return session.exec(statement).all()

def update_service_metadata_profile(session: Session, spec_id: int, data: Dict) -> Optional[K8sServiceMetadataProfile]:
    spec = session.get(K8sServiceMetadataProfile, spec_id)
    if not spec:
        return None
    
    for key, value in data.items():
        setattr(spec, key, value)
        
    session.add(spec)
    session.commit()
    session.refresh(spec)
    return spec

def delete_service_metadata_profile(session: Session, spec_id: int) -> bool:
    spec = session.get(K8sServiceMetadataProfile, spec_id)
    if not spec:
        return False
    
    session.delete(spec)
    session.commit()
    return True
