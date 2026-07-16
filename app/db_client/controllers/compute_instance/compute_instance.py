from sqlmodel import Session, select
from app.db_client.models.compute_instance import ComputeInstance
from app.db_client.controllers.compute_instance.types import (
    ComputeInstanceCreateType,
    ComputeInstanceUpdateType,
)
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func


def create_compute_instance(
    session: Session,
    data: ComputeInstanceCreateType,
) -> ComputeInstance:
    """Create a new compute instance record in the database."""
    obj = ComputeInstance(
        instance_name=data.instance_name,
        zone=data.zone,
        machine_type=data.machine_type,
        boot_disk_size_gb=data.boot_disk_size_gb,
        created_by_user_id=data.created_by_user_id,
        gcp_resource_id=data.gcp_resource_id,
        provider=data.provider,
        ssh_username=data.ssh_username,
        status=data.status,
        temporary_admin_password=data.temporary_admin_password,
        bastion_system_id=data.bastion_system_id,
        error_message=data.error_message,
        internal_ip=data.internal_ip,
        external_ip=data.external_ip,
        state=data.state,
        cloud_created_at=data.cloud_created_at,
    )
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def upsert_compute_instance(
    session: Session,
    instance_name: str,
    data: ComputeInstanceUpdateType,
) -> ComputeInstance:
    """Update an existing instance or create a new one from cloud sync data."""
    obj = get_compute_instance_by_name(session, instance_name)
    if obj:
        return update_compute_instance(session, instance_name, data)
    create_data = ComputeInstanceCreateType(
        instance_name=instance_name,
        zone=data.zone or "",
        machine_type=data.machine_type or "",
        boot_disk_size_gb=10,
        provider=data.provider or "",
        ssh_username=data.ssh_username,
        status=data.status or "RUNNING",
        gcp_resource_id=data.gcp_resource_id,
        error_message=data.error_message,
        internal_ip=data.internal_ip,
        external_ip=data.external_ip,
        state=data.state,
        cloud_created_at=data.cloud_created_at,
    )
    return create_compute_instance(session, create_data)


def list_compute_instances(
    session: Session,
    user_id: Optional[int] = None,
    provider: Optional[str] = None,
) -> List[ComputeInstance]:
    """List all compute instances, optionally filtered by user ownership and provider."""
    query = select(ComputeInstance)
    if user_id is not None:
        query = query.where(ComputeInstance.created_by_user_id == user_id)
    if provider is not None:
        query = query.where(ComputeInstance.provider == provider)
    return session.exec(query).all()


def get_compute_instance_by_name(
    session: Session,
    instance_name: str,
) -> Optional[ComputeInstance]:
    """Fetch a compute instance record by its instance name."""
    return session.exec(
        select(ComputeInstance).where(ComputeInstance.instance_name == instance_name)
    ).first()


def get_compute_instance_by_id(
    session: Session,
    instance_id: int,
) -> Optional[ComputeInstance]:
    """Fetch a compute instance record by its primary key ID."""
    return session.get(ComputeInstance, instance_id)


def update_compute_instance(
    session: Session,
    instance_name: str,
    data: ComputeInstanceUpdateType,
) -> Optional[ComputeInstance]:
    """Update an existing compute instance record."""
    obj = get_compute_instance_by_name(session, instance_name)
    if not obj:
        return None

    if data.zone is not None:
        obj.zone = data.zone
    if data.machine_type is not None:
        obj.machine_type = data.machine_type
    if data.boot_disk_size_gb is not None:
        obj.boot_disk_size_gb = data.boot_disk_size_gb
    if data.gcp_resource_id is not None:
        obj.gcp_resource_id = data.gcp_resource_id
    if data.provider is not None:
        obj.provider = data.provider
    if data.ssh_username is not None:
        obj.ssh_username = data.ssh_username
    if data.status is not None:
        obj.status = data.status
    if data.temporary_admin_password is not None:
        obj.temporary_admin_password = data.temporary_admin_password
    if data.bastion_system_id is not None:
        obj.bastion_system_id = data.bastion_system_id
    if data.error_message is not None:
        obj.error_message = data.error_message
    if data.internal_ip is not None:
        obj.internal_ip = data.internal_ip
    if data.external_ip is not None:
        obj.external_ip = data.external_ip
    if data.state is not None:
        obj.state = data.state
    if data.cloud_created_at is not None:
        obj.cloud_created_at = data.cloud_created_at
    obj.last_synced_at = datetime.utcnow()

    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def purge_temporary_admin_password(
    session: Session,
    instance_name: str,
) -> bool:
    """Set the temporary_admin_password to None for a compute instance.

    Returns True if the record was found and updated, False otherwise.
    """
    obj = get_compute_instance_by_name(session, instance_name)
    if not obj:
        return False

    obj.temporary_admin_password = None
    session.add(obj)
    session.commit()
    return True


def delete_compute_instance(
    session: Session,
    instance_name: str,
) -> bool:
    """Delete a compute instance record from the database."""
    obj = get_compute_instance_by_name(session, instance_name)
    if not obj:
        return False
    session.delete(obj)
    session.commit()
    return True


def update_instance_status(
    session: Session,
    instance_name: str,
    status: str,
    error_message: Optional[str] = None,
) -> bool:
    """Update the status of a compute instance.

    Returns True if the record was found and updated, False otherwise.
    """
    obj = get_compute_instance_by_name(session, instance_name)
    if not obj:
        return False

    obj.status = status
    if status == "FAILED":
        obj.state = "failed"
    if error_message is not None:
        obj.error_message = error_message
    session.add(obj)
    session.commit()
    return True


def is_cache_fresh(
    session: Session,
    provider: str,
    max_age_minutes: int = 5,
) -> bool:
    """Check if the last sync for a given provider is within the max age."""
    newest = session.exec(
        select(func.max(ComputeInstance.last_synced_at)).where(
            ComputeInstance.provider == provider
        )
    ).first()
    if not newest:
        return False
    from datetime import timezone
    now = datetime.now(timezone.utc) if newest.tzinfo else datetime.utcnow()
    age = (now - newest).total_seconds() / 60
    return age < max_age_minutes
