from sqlmodel import Session, select
from typing import List, Optional, Dict
from app.db_client.models.kubernetes_profiles.service import K8sService

def create_service(session: Session, spec: K8sService) -> K8sService:
    """Creates a new service."""
    session.add(spec)
    session.commit()
    session.refresh(spec)
    return spec

def get_service(session: Session, spec_id: int) -> Optional[K8sService]:
    """Retrieves a service by ID."""
    return session.get(K8sService, spec_id)

def list_services(session: Session, namespace: str) -> List[K8sService]:
    """Lists all services for a given namespace."""
    statement = select(K8sService).where(K8sService.namespace == namespace)
    return session.exec(statement).all()

def update_service(session: Session, spec_id: int, data: Dict) -> Optional[K8sService]:
    """Updates an existing service."""
    spec = session.get(K8sService, spec_id)
    if not spec:
        return None
    
    for key, value in data.items():
        setattr(spec, key, value)
        
    session.add(spec)
    session.commit()
    session.refresh(spec)
    return spec

def delete_service(session: Session, spec_id: int) -> bool:
    """Deletes a service."""
    spec = session.get(K8sService, spec_id)
    if not spec:
        return False
    
    session.delete(spec)
    session.commit()
    return True
