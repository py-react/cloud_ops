from typing import Optional
from sqlmodel import Field, SQLModel
from datetime import datetime

class ComputeInstance(SQLModel, table=True):
    __tablename__ = "compute_instances"

    id: Optional[int] = Field(default=None, primary_key=True)
    instance_name: str = Field(index=True, unique=True)
    zone: str
    machine_type: str
    boot_disk_size_gb: int
    created_by_user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    gcp_resource_id: Optional[str] = Field(default=None, nullable=True)
    provider: str = Field(default="gcp", index=True)
    ssh_username: Optional[str] = Field(default=None)
    status: str = Field(default="PROVISIONING")
    temporary_admin_password: Optional[str] = Field(default=None)
    bastion_system_id: Optional[int] = Field(default=None)
    error_message: Optional[str] = Field(default=None, nullable=True)
    internal_ip: Optional[str] = Field(default=None, nullable=True)
    external_ip: Optional[str] = Field(default=None, nullable=True)
    state: Optional[str] = Field(default=None, nullable=True)
    cloud_created_at: Optional[str] = Field(default=None, nullable=True)
    last_synced_at: Optional[datetime] = Field(default=None, nullable=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
