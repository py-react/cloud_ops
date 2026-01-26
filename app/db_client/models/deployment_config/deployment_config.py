from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB, BOOLEAN, DATE, INTEGER
from typing import Optional, Dict
from datetime import date

class DeploymentConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str = Field()
    namespace: str = Field()
    deployment_name: str = Field(unique=True)
    status: str = Field(default="active")  # active or inactive
    required_source_control: bool = Field(default=False, sa_column=Column(BOOLEAN))
    code_source_control_name: Optional[str] = Field(default=None, foreign_key="codesourcecontrol.name")
    source_control_branch: Optional[str] = Field(default=None)
    derived_deployment_id: Optional[int] = Field(default=None, sa_column=Column(INTEGER))
    
    soft_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
    deleted_at: Optional[date] = Field(default=None, sa_column=Column(DATE))
    hard_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
    replicas: Optional[int] = Field(default=1, sa_column=Column(INTEGER))
