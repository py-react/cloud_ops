from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class LibrarySetting(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    github_credential_id: Optional[int] = Field(default=None, foreign_key="integrationcredential.id")
    repo_name: Optional[str] = None
    repo_owner: Optional[str] = None
    branch: str = Field(default="main")
    auto_push: bool = Field(default=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
