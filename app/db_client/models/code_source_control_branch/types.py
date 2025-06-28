from pydantic import BaseModel

class CodeSourceControlBranchType(BaseModel):
    code_source_control_id: int
    branch: str 