from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class KubeConfigFile(SQLModel, table=True):
    __tablename__ = "kubeconfigfile"
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    # Store encrypted YAML content for uploaded files
    content_encrypted: Optional[str] = Field(default=None, repr=False)
    # Fields for system-resident configs
    is_system_config: bool = Field(default=False)
    system_path: Optional[str] = Field(default=None)
    
    is_active: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def __repr__(self) -> str:
        return f"KubeConfigFile(id={self.id!r}, name={self.name!r}, is_active={self.is_active!r})"
