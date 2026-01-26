from sqlmodel import Session, select, delete
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from app.db_client.models.deployment_config.types import DeploymentConfigType
from typing import List, Optional
from datetime import datetime
from sqlalchemy import or_

def create_deployment_config(session: Session, data: DeploymentConfigType) -> DeploymentConfigType:
    # Exclude non-DB fields and relationships
    return data
    # exclude_fields = {
    #     "containers", "volumes", "node_selector", "tolerations", "affinity",
    #     "container_profile_ids", "volume_profile_ids", "scheduling_profile_id"
    # }
    
    # # Base dict
    # db_data = data.dict(exclude=exclude_fields)
    
    # # Add scalar relationships if present
    # if data.scheduling_profile_id:
    #     db_data["scheduling_profile_id"] = data.scheduling_profile_id
        
    # obj = DeploymentConfig(**db_data)
    # session.add(obj)
    # session.commit()
    # session.refresh(obj) # Get ID
    
    # # Handle Many-to-Many Containers
    # if data.container_profile_ids:
    #     for cid in data.container_profile_ids:
    #         link = DeploymentConfigContainer(deployment_config_id=obj.id, container_profile_id=cid)
    #         session.add(link)
            
    # # Handle Many-to-Many Volumes
    # if data.volume_profile_ids:
    #     for vid in data.volume_profile_ids:
    #         link = DeploymentConfigVolume(deployment_config_id=obj.id, volume_profile_id=vid)
    #         session.add(link)
            
    # session.commit()
    # session.refresh(obj)
    # return obj

def list_deployment_configs(
    session: Session,
    namespace: str = "default",
    include_hard_deleted: bool = False
) -> List[DeploymentConfig]:
    query = select(DeploymentConfig).where(DeploymentConfig.namespace == namespace)
    return session.exec(query).all()

def get_deployment_config(session: Session, id: int) -> Optional[DeploymentConfig]:
    return session.get(DeploymentConfig, id)

def update_deployment_config(session: Session, id: int, data: DeploymentConfigType) -> Optional[DeploymentConfigType]:
    return data
    # obj = session.get(DeploymentConfig, id)
    # if not obj:
    #     return None
        
    # # Exclude legacy jsonb fields and new profile id lists
    # exclude_fields = {
    #     "containers", "volumes", "node_selector", "tolerations", "affinity",
    #     "container_profile_ids", "volume_profile_ids", "scheduling_profile_id"
    # }
    # update_data = data.dict(exclude=exclude_fields, exclude_unset=True)
    
    # for key, value in update_data.items():
    #     setattr(obj, key, value)
        
    # # Update Scheduling Profile
    # if data.scheduling_profile_id is not None:
    #     obj.scheduling_profile_id = data.scheduling_profile_id

    # session.add(obj)
    
    # # Update Containers (Full replacement strategy)
    # if data.container_profile_ids is not None:
    #     # Clear existing
    #     session.exec(delete(DeploymentConfigContainer).where(DeploymentConfigContainer.deployment_config_id == id))
    #     # Add new
    #     for cid in data.container_profile_ids:
    #         link = DeploymentConfigContainer(deployment_config_id=id, container_profile_id=cid)
    #         session.add(link)

    # # Update Volumes (Full replacement strategy)
    # if data.volume_profile_ids is not None:
    #     # Clear existing
    #     session.exec(delete(DeploymentConfigVolume).where(DeploymentConfigVolume.deployment_config_id == id))
    #     # Add new
    #     for vid in data.volume_profile_ids:
    #         link = DeploymentConfigVolume(deployment_config_id=id, volume_profile_id=vid)
    #         session.add(link)
            
    # session.commit()
    # session.refresh(obj)
    # return obj

def delete_deployment_config(session: Session, id: int) -> bool:
    obj = session.get(DeploymentConfig, id)
    if not obj:
        return False
    obj.hard_delete = True
    obj.deleted_at = datetime.utcnow()
    session.add(obj)
    session.commit()
    return True
