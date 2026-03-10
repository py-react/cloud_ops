from sqlmodel import Session, select
from typing import List, Optional, Dict
from app.db_client.models.kubernetes_profiles.httproute_parent_refs_profile import K8sHTTPRouteParentRefsProfile

def create_httproute_parent_refs_profile(session: Session, profile: K8sHTTPRouteParentRefsProfile) -> K8sHTTPRouteParentRefsProfile:
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

def get_httproute_parent_refs_profile(session: Session, profile_id: int) -> Optional[K8sHTTPRouteParentRefsProfile]:
    return session.get(K8sHTTPRouteParentRefsProfile, profile_id)

def list_httproute_parent_refs_profiles(session: Session, namespace: str, ids: Optional[List[int]] = None) -> List[K8sHTTPRouteParentRefsProfile]:
    statement = select(K8sHTTPRouteParentRefsProfile).where(K8sHTTPRouteParentRefsProfile.namespace == namespace)
    if ids:
        statement = statement.where(K8sHTTPRouteParentRefsProfile.id.in_(ids))
    return session.exec(statement).all()

def update_httproute_parent_refs_profile(session: Session, profile_id: int, data: Dict) -> Optional[K8sHTTPRouteParentRefsProfile]:
    profile = session.get(K8sHTTPRouteParentRefsProfile, profile_id)
    if not profile:
        return None
    for key, value in data.items():
        setattr(profile, key, value)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

def delete_httproute_parent_refs_profile(session: Session, profile_id: int) -> bool:
    profile = session.get(K8sHTTPRouteParentRefsProfile, profile_id)
    if not profile:
        return False
    session.delete(profile)
    session.commit()
    return True
