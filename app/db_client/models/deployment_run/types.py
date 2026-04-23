from pydantic import BaseModel
from typing import Optional, Dict

class DeploymentRunType(BaseModel):
    pr_url: Optional[str] = None
    jira: Optional[str] = None
    images: Optional[Dict[str, str]] = None
    deployment_config_id: int
    status: Optional[str] = "pending"
    apply_derived_service: Optional[bool] = False
    deployment_strategy_id: Optional[int] = None
    http_route_id: Optional[int] = None
    apply_derived_httproute: Optional[bool] = False
    version: Optional[str] = None
    release_notes: Optional[str] = None
    is_public: Optional[bool] = True