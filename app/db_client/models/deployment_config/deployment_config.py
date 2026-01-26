from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB, BOOLEAN, DATE, INTEGER
from typing import Optional, Dict
from datetime import date

class DeploymentConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str = Field()
    namespace: str = Field()
    deployment_name: str = Field(unique=True)
    tag: str = Field()
    code_source_control_name: str = Field(foreign_key="codesourcecontrol.name")
    replicas: Optional[int] = Field(default=1, sa_column=Column(INTEGER))
    labels: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSONB))
    annotations: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSONB))
    profiles: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSONB))
    
    soft_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
    deleted_at: Optional[date] = Field(default=None, sa_column=Column(DATE))
    hard_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
