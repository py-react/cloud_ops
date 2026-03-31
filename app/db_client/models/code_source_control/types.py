from pydantic import BaseModel
from typing import Optional

class CodeSourceControlType(BaseModel):
    name: str
    pat_id: Optional[int] = None
    registry_id: Optional[int] = None
    docker_config_id: Optional[int] = None
    status: Optional[str] = "active"