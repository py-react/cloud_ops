from sqlmodel import Session, select, delete
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from app.db_client.models.deployment_config.types import DeploymentConfigType
from typing import List, Optional, Any, Dict
from app.db_client.models.kubernetes_profiles.service import K8sService
from datetime import datetime
from sqlalchemy import or_

def create_deployment_config(session: Session, data: DeploymentConfigType) -> DeploymentConfig:
    """
    Create a new release configuration in the database.
    Release configs now store metadata only (name, type, source control, deployment reference).
    """
    # Create the deployment config object with all fields from the type
    obj = DeploymentConfig(
        type=data.type,
        namespace=data.namespace,
        deployment_name=data.deployment_name,
        status=data.status or "active",
        tag=data.tag,  # Optional now
        required_source_control=data.required_source_control,
        code_source_control_name=data.code_source_control_name,
        source_control_branch=data.source_control_branch,
        derived_deployment_id=data.derived_deployment_id,
        service_id=data.service_id,
        replicas=data.replicas or 1,
        soft_delete=False,
        hard_delete=False
    )
    
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_deployment_configs(
    session: Session,
    namespace: str = "default"
) -> List[DeploymentConfig]:
    """
    List all deployment configs, excluding hard-deleted items.
    Filtering by status/soft_delete is handled on frontend.
    """
    query = select(DeploymentConfig, K8sService.name.label("service_name")).outerjoin(
        K8sService, DeploymentConfig.service_id == K8sService.id
    ).where(
        DeploymentConfig.namespace == namespace,
        DeploymentConfig.hard_delete == False
    )
    
    results = session.exec(query).all()
    
    # Convert to list of dicts with service_name included
    response = []
    for config, service_name in results:
        config_dict = config.model_dump()
        config_dict["service_name"] = service_name
        response.append(config_dict)
        
    return response

def get_deployment_config(session: Session, id: int) -> Optional[DeploymentConfig]:
    return session.get(DeploymentConfig, id)

def update_deployment_config(session: Session, id: int, data: DeploymentConfigType) -> Optional[DeploymentConfig]:
    """
    Update an existing release configuration.
    Only updates the fields that exist in the model.
    """
    obj = session.get(DeploymentConfig, id)
    if not obj:
        return None
    
    # Update core fields
    if data.type is not None:
        obj.type = data.type
    if data.namespace is not None:
        obj.namespace = data.namespace
    if data.deployment_name is not None:
        obj.deployment_name = data.deployment_name
    if data.status is not None:
        obj.status = data.status
    
    # Update release config specific fields
    obj.required_source_control = data.required_source_control
    obj.code_source_control_name = data.code_source_control_name
    obj.source_control_branch = data.source_control_branch
    obj.derived_deployment_id = data.derived_deployment_id
    obj.service_id = data.service_id
    
    # Update optional fields (no deployment_strategy_id anymore)
    
    # Handle delete flags if provided (for hard delete via update)
    if hasattr(data, 'hard_delete') and data.hard_delete is not None:
        obj.hard_delete = data.hard_delete
        if data.hard_delete:
            obj.deleted_at = datetime.utcnow()
    if hasattr(data, 'soft_delete') and data.soft_delete is not None:
        obj.soft_delete = data.soft_delete
        if not data.soft_delete:
            obj.deleted_at = None  # Reset deleted_at when restoring
    
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_deployment_config(session: Session, id: int) -> bool:
    """Soft delete a deployment config by setting soft_delete flag."""
    obj = session.get(DeploymentConfig, id)
    if not obj:
        return False
    obj.soft_delete = True  # Soft delete instead of hard delete
    obj.deleted_at = datetime.utcnow()
    session.add(obj)
    session.commit()
    return True
