from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB, BOOLEAN, DATE, INTEGER
from typing import Optional, List, Dict, Any
from datetime import datetime

class DeploymentConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str = Field()
    namespace: str = Field()
    deployment_name: str = Field(unique=True)
    tag: str = Field()
    code_source_control_name: str = Field(foreign_key="codesourcecontrol.name")
    deployment_strategy_id: int = Field(foreign_key="deploymentstrategy.id")
    replicas: Optional[int] = Field(default=1, sa_column=Column(INTEGER))
    containers: List[Dict[str, Any]] = Field(sa_column=Column(JSONB))
    service_ports: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(JSONB))
    labels: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSONB))
    annotations: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSONB))
    soft_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
    deleted_at: Optional[datetime] = Field(default=None, sa_column=Column(DATE))
    hard_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
