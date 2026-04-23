from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class KubeconfigAudit(SQLModel, table=True):
    __tablename__ = "kubeconfig_audit"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    service_account_name: str
    namespace: str
    role_template: str = Field(default="developer")
    description: Optional[str] = None
    created_by: str = Field(default="admin")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=True)
    expires_at: datetime
    revoked_at: Optional[datetime] = None
    is_active: bool = Field(default=True)
    kubeconfig_cluster: str = Field(default="default")
    status: str = Field(default="pending")
    kubeconfig_encrypted: Optional[str] = None
    retry_count: int = Field(default=0)
    error_message: Optional[str] = None
    custom_rules: Optional[str] = None  # JSON-encoded list of PolicyRule dicts (used when role_template="custom")
    
    def __repr__(self) -> str:
        return f"KubeconfigAudit(id={self.id!r}, name={self.service_account_name!r}, namespace={self.namespace!r}, role={self.role_template!r}, active={self.is_active!r})"