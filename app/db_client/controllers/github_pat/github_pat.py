from sqlmodel import Session, select, desc
from typing import List, Optional
from app.db_client.models.github_pat.github_pat import GitHubPAT
from datetime import datetime


def create_pat(session: Session, name: str, token_encrypted: str, active: bool = False, scopes: Optional[str] = None) -> GitHubPAT:
    pat = GitHubPAT(name=name, token_encrypted=token_encrypted, active=active, scopes=scopes)
    session.add(pat)
    session.commit()
    session.refresh(pat)
    return pat


def list_pats(session: Session) -> List[GitHubPAT]:
    return list(session.exec(select(GitHubPAT)).all())


def get_pat(session: Session, pat_id: int) -> Optional[GitHubPAT]:
    return session.get(GitHubPAT, pat_id)


def delete_pat(session: Session, pat_id: int) -> bool:
    pat = session.get(GitHubPAT, pat_id)
    if not pat:
        return False
    session.delete(pat)
    session.commit()
    return True


def set_active_pat(session: Session, pat_id: int) -> Optional[GitHubPAT]:
    # Activate chosen (allow multiple active)
    pat = session.get(GitHubPAT, pat_id)
    if not pat:
        session.commit()
        return None
    
    # Toggle active state? Or just set to True? 
    # User says "multiple PATs can have active state".
    # Usually a "Use Token" button implies "Activate".
    # Let's make it a toggle if it's already active? 
    # The UI currently has "Use Token" which calls PUT.
    # If I make it just "Activate", I need a "Deactivate" too.
    # Let's assume PUT toggles it? Or enables it.
    # Existing code:
    # if body.active: set_active_pat(...)
    # Let's make it enable. 
    
    pat.active = True
    session.add(pat)
    session.commit()
    session.refresh(pat)
    return pat


def get_active_pat(session: Session) -> Optional[GitHubPAT]:
    res = session.exec(select(GitHubPAT).where(GitHubPAT.active == True).order_by(desc(GitHubPAT.id))).first()
    return res


def update_pat(session: Session, pat_id: int, active: Optional[bool] = None) -> Optional[GitHubPAT]:
    pat = session.get(GitHubPAT, pat_id)
    if not pat:
        return None
    
    if active is not None:
        pat.active = active
    
    session.add(pat)
    session.commit()
    session.refresh(pat)
    return pat

def mark_last_used(session: Session, pat_id: int):
    pat = session.get(GitHubPAT, pat_id)
    if not pat:
        return None
    pat.last_used_at = datetime.utcnow()
    session.add(pat)
    session.commit()
    session.refresh(pat)
    return pat
