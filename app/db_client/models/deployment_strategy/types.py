from pydantic import BaseModel
from typing import Optional

class DeploymentStrategyType(BaseModel):
    type: str
    namespace: str
    deployment_name: str
    strategy: str
    tag: str
    pr_url: str
    jira: Optional[str] = None 