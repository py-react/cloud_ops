from pydantic import BaseModel
from typing import Sequence
from datetime import datetime

class SourceCodeBuildType(BaseModel):
    image_name: str
    repo_name_full_name: str
    repo_name: str
    pull_request_number: str
    user_login: str
    status: str
    branch_name : str

class SourceCodeBuildLogType(BaseModel):
    build_id: int
    logs: str

class SourceCodeBuildWithLogsType(SourceCodeBuildType):
    logs: Sequence[SourceCodeBuildLogType]