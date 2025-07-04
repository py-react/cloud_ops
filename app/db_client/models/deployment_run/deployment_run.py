from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class DeploymentRun(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    pr_url: Optional[str] = None
    jira: Optional[str] = None
    image_name: str
    deployment_config_id: int = Field(foreign_key="deploymentconfig.id")
    status: str = Field(default="pending")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=True)