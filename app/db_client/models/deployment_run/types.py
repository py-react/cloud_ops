from pydantic import BaseModel
from typing import Optional

class DeploymentRunType(BaseModel):
    pr_url: Optional[str] = None
    jira: Optional[str] = None
    image_name: str
    deployment_config_id: int
    status: Optional[str] = "pending"