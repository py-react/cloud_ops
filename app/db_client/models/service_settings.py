from sqlmodel import SQLModel, Field
from typing import Optional

class ServiceSetting(SQLModel, table=True):
    """Global key-value store for Bastion service configuration."""
    __tablename__ = "service_setting"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)
    value: str  # Stored as text; private keys, flags, etc.
