from sqlmodel import Session, select
from typing import List, Optional, Dict
from app.db_client.models.kubernetes_profiles.httproute_hostnames_profile import K8sHTTPRouteHostnamesProfile

def create_httproute_hostnames_profile(session: Session, profile: K8sHTTPRouteHostnamesProfile) -> K8sHTTPRouteHostnamesProfile:
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

def get_httproute_hostnames_profile(session: Session, profile_id: int) -> Optional[K8sHTTPRouteHostnamesProfile]:
    return session.get(K8sHTTPRouteHostnamesProfile, profile_id)

def list_httproute_hostnames_profiles(session: Session, namespace: str, ids: Optional[List[int]] = None) -> List[K8sHTTPRouteHostnamesProfile]:
    statement = select(K8sHTTPRouteHostnamesProfile).where(K8sHTTPRouteHostnamesProfile.namespace == namespace)
    if ids:
        statement = statement.where(K8sHTTPRouteHostnamesProfile.id.in_(ids))
    return session.exec(statement).all()

def update_httproute_hostnames_profile(session: Session, profile_id: int, data: Dict) -> Optional[K8sHTTPRouteHostnamesProfile]:
    profile = session.get(K8sHTTPRouteHostnamesProfile, profile_id)
    if not profile:
        return None
    for key, value in data.items():
        setattr(profile, key, value)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

def delete_httproute_hostnames_profile(session: Session, profile_id: int) -> bool:
    profile = session.get(K8sHTTPRouteHostnamesProfile, profile_id)
    if not profile:
        return False
    session.delete(profile)
    session.commit()
    return True
