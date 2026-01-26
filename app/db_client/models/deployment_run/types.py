from pydantic import BaseModel
from typing import Optional, Dict

class DeploymentRunType(BaseModel):
    pr_url: Optional[str] = None
    jira: Optional[str] = None
    images: Optional[Dict[str, str]] = None
    deployment_config_id: int
    status: Optional[str] = "pending"