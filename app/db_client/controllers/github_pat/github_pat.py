from sqlmodel import Session, select, desc
from typing import List, Optional
from app.db_client.models.github_pat.github_pat import IntegrationCredential
from datetime import datetime


def create_credential(session: Session, name: str, token_encrypted: str, provider: str = "github", active: bool = False, scopes: Optional[str] = None) -> IntegrationCredential:
    credential = IntegrationCredential(name=name, token_encrypted=token_encrypted, provider=provider, active=active, scopes=scopes)
    session.add(credential)
    session.commit()
    session.refresh(credential)
    return credential


def list_credentials(session: Session) -> List[IntegrationCredential]:
    return list(session.exec(select(IntegrationCredential)).all())


def get_credential(session: Session, credential_id: int) -> Optional[IntegrationCredential]:
    return session.get(IntegrationCredential, credential_id)


def delete_credential(session: Session, credential_id: int) -> bool:
    credential = session.get(IntegrationCredential, credential_id)
    if not credential:
        return False
    session.delete(credential)
    session.commit()
    return True


def set_active_credential(session: Session, credential_id: int) -> Optional[IntegrationCredential]:
    credential = session.get(IntegrationCredential, credential_id)
    if not credential:
        session.commit()
        return None
    
    credential.active = True
    session.add(credential)
    session.commit()
    session.refresh(credential)
    return credential


def get_active_credential(session: Session) -> Optional[IntegrationCredential]:
    res = session.exec(select(IntegrationCredential).where(IntegrationCredential.active == True).order_by(desc(IntegrationCredential.id))).first()
    return res


def update_credential(session: Session, credential_id: int, active: Optional[bool] = None) -> Optional[IntegrationCredential]:
    credential = session.get(IntegrationCredential, credential_id)
    if not credential:
        return None
    
    if active is not None:
        credential.active = active
    
    session.add(credential)
    session.commit()
    session.refresh(credential)
    return credential

def mark_last_used(session: Session, credential_id: int):
    credential = session.get(IntegrationCredential, credential_id)
    if not credential:
        return None
    credential.last_used_at = datetime.utcnow()
    session.add(credential)
    session.commit()
    session.refresh(credential)
    return credential

def get_active_credential_by_provider(session: Session, provider: str) -> Optional[IntegrationCredential]:
    """Retrieve the most recently active credential for a specific provider (npm, pypi, github)."""
    return session.exec(
        select(IntegrationCredential)
        .where(IntegrationCredential.provider == provider, IntegrationCredential.active == True)
        .order_by(desc(IntegrationCredential.id))
    ).first()
