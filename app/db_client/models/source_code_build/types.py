from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SourceCodeBuildType(BaseModel):
    image_name: str
    repo_name_full_name: str
    repo_name: str
    pull_request_number: str
    pr_head_sha: Optional[str]
    user_login: str
    status: str
    branch_name : str
    base_branch_name : str
    time_taken:Optional[float]
    created_at: Optional[datetime]

class SourceCodeBuildLogType(BaseModel):
    id: Optional[int] = None
    build_id: int
    logs: str
    created_at: Optional[datetime] = None


class SourceCodeBuildWithLogsType(SourceCodeBuildType):
    logs: list[SourceCodeBuildLogType]