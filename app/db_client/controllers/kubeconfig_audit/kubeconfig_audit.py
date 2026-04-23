from sqlmodel import Session, select, desc
from typing import List, Optional
from app.db_client.models.kubeconfig_audit.kubeconfig_audit import KubeconfigAudit
from datetime import datetime


def create_access(
    session: Session,
    service_account_name: str,
    namespace: str,
    role_template: str,
    description: Optional[str] = None,
    created_by: str = "admin",
    expires_at: datetime = None,
    kubeconfig_cluster: str = "default",
    status: str = "pending",
    kubeconfig_encrypted: Optional[str] = None,
    retry_count: int = 0,
    error_message: Optional[str] = None,
    custom_rules: Optional[str] = None
) -> KubeconfigAudit:
    """Create a new user access record"""
    if expires_at is None:
        expires_at = datetime.utcnow()
    
    access = KubeconfigAudit(
        service_account_name=service_account_name,
        namespace=namespace,
        role_template=role_template,
        description=description,
        created_by=created_by,
        expires_at=expires_at,
        kubeconfig_cluster=kubeconfig_cluster,
        status=status,
        kubeconfig_encrypted=kubeconfig_encrypted,
        retry_count=retry_count,
        error_message=error_message,
        custom_rules=custom_rules
    )
    session.add(access)
    session.commit()
    session.refresh(access)
    return access


def list_access(session: Session, namespace: Optional[str] = None, include_inactive: bool = False) -> List[KubeconfigAudit]:
    """List all access records, optionally filtered by namespace"""
    query = select(KubeconfigAudit)
    
    if namespace:
        query = query.where(KubeconfigAudit.namespace == namespace)
    
    if not include_inactive:
        query = query.where(KubeconfigAudit.is_active == True)
    
    query = query.order_by(desc(KubeconfigAudit.created_at))
    return list(session.exec(query).all())


def get_access(session: Session, access_id: int) -> Optional[KubeconfigAudit]:
    """Get a specific access record by ID"""
    return session.get(KubeconfigAudit, access_id)


def get_access_by_sa(session: Session, service_account_name: str, namespace: str) -> Optional[KubeconfigAudit]:
    """Get access record by service account name and namespace"""
    return session.exec(
        select(KubeconfigAudit)
        .where(
            KubeconfigAudit.service_account_name == service_account_name,
            KubeconfigAudit.namespace == namespace
        )
    ).first()


def revoke_access(session: Session, access_id: int) -> Optional[KubeconfigAudit]:
    """Mark an access record as revoked"""
    access = session.get(KubeconfigAudit, access_id)
    if not access:
        return None
    
    access.is_active = False
    access.revoked_at = datetime.utcnow()
    session.add(access)
    session.commit()
    session.refresh(access)
    return access


def revoke_access_by_sa(session: Session, service_account_name: str, namespace: str) -> Optional[KubeconfigAudit]:
    """Revoke access by service account name and namespace"""
    access = get_access_by_sa(session, service_account_name, namespace)
    if not access:
        return None
    
    access.is_active = False
    access.revoked_at = datetime.utcnow()
    session.add(access)
    session.commit()
    session.refresh(access)
    return access


def update_access(session: Session, access_id: int, **kwargs) -> Optional[KubeconfigAudit]:
    """Update an access record"""
    access = session.get(KubeconfigAudit, access_id)
    if not access:
        return None
    
    for key, value in kwargs.items():
        if hasattr(access, key):
            setattr(access, key, value)
    
    session.add(access)
    session.commit()
    session.refresh(access)
    return access


def is_expired(session: Session, access_id: int) -> bool:
    """Check if an access has expired"""
    access = session.get(KubeconfigAudit, access_id)
    if not access:
        return True
    return access.expires_at < datetime.utcnow()


def delete_access(session: Session, access_id: int) -> bool:
    """Hard delete an access record"""
    access = session.get(KubeconfigAudit, access_id)
    if not access:
        return False
    session.delete(access)
    session.commit()
    return True
