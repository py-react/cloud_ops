from sqlmodel import SQLModel, Field, Column, Relationship
from sqlalchemy.dialects.postgresql import JSONB, BOOLEAN, DATE, INTEGER
from typing import Optional, List, Dict, Any
from datetime import date
from enum import Enum

# Import enhanced profile models
from app.db_client.models.kubernetes_profiles.enhanced_profiles import (
    K8sContainerProfileEnhanced,
    K8sVolumeProfileEnhanced, 
    K8sSchedulingProfileEnhanced
)



class DeploymentConfigContainerEnhanced(SQLModel, table=True):
    """Enhanced mapping table supporting multiple containers with order"""
    __tablename__ = "deploymentconfigcontainerenhanced"
    
    deployment_config_id: Optional[int] = Field(default=None, foreign_key="deploymentconfigenhanced.id", primary_key=True)
    container_profile_id: Optional[int] = Field(default=None, foreign_key="k8scontainerprofileenhanced.id", primary_key=True)
    
    # NEW: Composition order and metadata
    composition_order: int = Field(default=0, description="Order for composition")
    is_enabled: bool = Field(default=True, description="Whether this container is enabled")
    merge_priority: int = Field(default=100, description="Priority for conflict resolution")

class DeploymentConfigVolumeEnhanced(SQLModel, table=True):
    """Enhanced mapping table supporting multiple volumes with order"""
    __tablename__ = "deploymentconfigvolumeenhanced"
    
    deployment_config_id: Optional[int] = Field(default=None, foreign_key="deploymentconfigenhanced.id", primary_key=True)
    volume_profile_id: Optional[int] = Field(default=None, foreign_key="k8svolumeprofileenhanced.id", primary_key=True)
    
    # NEW: Composition order and metadata
    composition_order: int = Field(default=0, description="Order for composition")
    is_enabled: bool = Field(default=True, description="Whether this volume is enabled")
    merge_priority: int = Field(default=100, description="Priority for conflict resolution")

class DeploymentConfigEnhanced(SQLModel, table=True):
    """Enhanced deployment configuration supporting composable modules"""
    __tablename__ = "deploymentconfigenhanced"
    
    # Core fields
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str = Field()
    namespace: str = Field()
    deployment_name: str = Field(unique=True)
    tag: str = Field()
    code_source_control_name: str = Field(foreign_key="codesourcecontrol.name")
    deployment_strategy_id: int = Field(foreign_key="deploymentstrategy.id")
    replicas: Optional[int] = Field(default=1, sa_column=Column(INTEGER))
    
    # Enhanced relationships (supporting multiple modules)
    scheduling_profile_ids: Optional[List[int]] = Field(default=None, sa_column=Column(JSONB))
    
    # Relationships to enhanced profiles
    containers: List[K8sContainerProfileEnhanced] = Relationship(link_model=DeploymentConfigContainerEnhanced)
    volumes: List[K8sVolumeProfileEnhanced] = Relationship(link_model=DeploymentConfigVolumeEnhanced)
    
    # Legacy compatibility fields (keeping these for backward compatibility)
    service_ports: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(JSONB))
    labels: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSONB))
    annotations: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSONB))
    
    # Soft delete support
    soft_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
    deleted_at: Optional[date] = Field(default=None, sa_column=Column(DATE))
    hard_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
    
    # NEW: Template and versioning support
    is_template: bool = Field(default=False, description="Whether this config is a template")
    template_version: Optional[str] = Field(default=None, description="Template version")
    parent_template_id: Optional[int] = Field(default=None, description="Parent template if derived")

