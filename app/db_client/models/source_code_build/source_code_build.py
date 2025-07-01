from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class SourceCodeBuild(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    image_name: str
    repo_name_full_name: str
    repo_name: str
    pull_request_number: str
    user_login: str
    status: str
    branch_name: str

class SourceCodeBuildLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    build_id: int  # ForeignKey to SourceCodeBuild if needed
    logs: str
