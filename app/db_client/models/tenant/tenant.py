from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class Tenant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(default="Default Tenant")
    onboarding_completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def __repr__(self) -> str:
        return f"Tenant(id={self.id!r}, name={self.name!r}, onboarding_completed={self.onboarding_completed!r})"
