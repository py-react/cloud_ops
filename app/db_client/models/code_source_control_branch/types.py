from pydantic import BaseModel
from typing import Optional

class CodeSourceControlBranchType(BaseModel):
    code_source_control_id: int
    branch: str
    registry_id: Optional[int] = None
    docker_config_id: Optional[int] = None