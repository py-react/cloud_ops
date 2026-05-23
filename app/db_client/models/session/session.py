from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class UserSession(SQLModel, table=True):
    __tablename__ = "user_session"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    tenant_id: Optional[int] = Field(default=None, foreign_key="tenant.id")
    token_hash: str = Field(unique=True, index=True)
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed_at: datetime = Field(default_factory=datetime.utcnow)
