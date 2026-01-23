from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class GitHubPAT(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    # Store encrypted token but avoid exposing it in repr/serialization accidentally
    token_encrypted: str = Field(..., repr=False)
    active: bool = Field(default=False)
    scopes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=True)
    last_used_at: Optional[datetime] = None

    def __repr__(self) -> str:
        return f"GitHubPAT(id={self.id!r}, name={self.name!r}, active={self.active!r}, created_at={self.created_at!r}, last_used_at={self.last_used_at!r})"
