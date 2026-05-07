from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB, BOOLEAN, DATE, INTEGER
from typing import Optional, Dict
from datetime import date

class DeploymentConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str = Field()
    namespace: Optional[str] = Field(default=None)
    deployment_name: str = Field(unique=True)
    status: str = Field(default="active")  # active or inactive
    category: str = Field(default="kubernetes")  # kubernetes or package
    
    # Source Control
    required_source_control: bool = Field(default=False, sa_column=Column(BOOLEAN))
    code_source_control_name: Optional[str] = Field(default=None, foreign_key="codesourcecontrol.name")
    source_control_branch: Optional[str] = Field(default=None)
    
    # Deployment References (Kubernetes Category)
    derived_deployment_id: Optional[int] = Field(default=None, sa_column=Column(INTEGER))
    service_id: Optional[int] = Field(default=None, sa_column=Column(INTEGER))
    deployment_strategy_id: Optional[int] = Field(default=None, sa_column=Column(INTEGER))
    http_route_id: Optional[int] = Field(default=None, sa_column=Column(INTEGER))
    chart_name: Optional[str] = Field(default=None)
    env_name: Optional[str] = Field(default=None)
    
    # Package Details (Package Category)
    package_type: Optional[str] = Field(default=None)  # npm, pypi, maven
    release_strategy: Optional[str] = Field(default=None)  # semantic, build-id, timestamp
    package_name: Optional[str] = Field(default=None)
    registry_credential_id: Optional[int] = Field(default=None, sa_column=Column(INTEGER))  # Link to specific credential for publish
    
    soft_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
    deleted_at: Optional[date] = Field(default=None, sa_column=Column(DATE))
    hard_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
    replicas: Optional[int] = Field(default=1, sa_column=Column(INTEGER))
