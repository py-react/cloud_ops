from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class IntegrationCredential(SQLModel, table=True):
    __tablename__ = "integrationcredential"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    provider: str = Field(default="github")  # github, npm, pypi
    # Store encrypted token but avoid exposing it in repr/serialization accidentally
    token_encrypted: str = Field(..., repr=False)
    active: bool = Field(default=False)
    scopes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=True)
    last_used_at: Optional[datetime] = None
    
    def __repr__(self) -> str:
        return f"IntegrationCredential(id={self.id!r}, name={self.name!r}, provider={self.provider!r}, active={self.active!r}, created_at={self.created_at!r})"
