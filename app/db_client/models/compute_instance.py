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
    gcp_resource_id: str
    ssh_username: Optional[str] = Field(default=None)
    status: str = Field(default="PROVISIONING")
    temporary_admin_password: Optional[str] = Field(default=None)
    bastion_system_id: Optional[int] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
