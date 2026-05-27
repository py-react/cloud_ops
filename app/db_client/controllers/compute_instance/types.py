from pydantic import BaseModel
from typing import Optional


class ComputeInstanceCreateType(BaseModel):
    instance_name: str
    zone: str
    machine_type: str
    boot_disk_size_gb: int
    created_by_user_id: Optional[int] = None
    gcp_resource_id: Optional[str] = None
    provider: str = "gcp"
    ssh_username: Optional[str] = None
    status: str = "PROVISIONING"
    temporary_admin_password: Optional[str] = None
    bastion_system_id: Optional[int] = None


class ComputeInstanceUpdateType(BaseModel):
    zone: Optional[str] = None
    machine_type: Optional[str] = None
    boot_disk_size_gb: Optional[int] = None
    gcp_resource_id: Optional[str] = None
    provider: Optional[str] = None
    ssh_username: Optional[str] = None
    status: Optional[str] = None
    temporary_admin_password: Optional[str] = None
    bastion_system_id: Optional[int] = None
