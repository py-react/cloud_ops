from sqlmodel import Session, select
from typing import List, Optional, Dict
from typing import List, Optional, Dict
from app.db_client.models.kubernetes_profiles.service import K8sService
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from fastapi import HTTPException, status

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

    # Check for dependents in Release Configs
    statement = select(DeploymentConfig).where(
        DeploymentConfig.service_id == spec_id,
        DeploymentConfig.soft_delete == False
    )
    dependents = session.exec(statement).all()
    
    if dependents:
        dependent_list = [
            {"id": d.id, "name": d.deployment_name, "type": "release_config"} 
            for d in dependents
        ]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"message": "Service is in use", "dependents": dependent_list}
        )
    
    session.delete(spec)
    session.commit()
    return True
