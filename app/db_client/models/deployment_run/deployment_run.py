from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB, BOOLEAN
from typing import Optional, Dict
from datetime import datetime

class DeploymentRun(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pr_url: Optional[str] = None
    jira: Optional[str] = None
    images: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSONB))
    deployment_config_id: int = Field(foreign_key="deploymentconfig.id")
    status: str = Field(default="pending")
    apply_derived_service: bool = Field(default=False, sa_column=Column(BOOLEAN))
    deployment_strategy_id: Optional[int] = Field(default=None)
    http_route_id: Optional[int] = Field(default=None)
    apply_derived_httproute: bool = Field(default=False, sa_column=Column(BOOLEAN))
    version: Optional[str] = None
    release_notes: Optional[str] = None
    is_public: bool = Field(default=True, sa_column=Column(BOOLEAN))
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=True)