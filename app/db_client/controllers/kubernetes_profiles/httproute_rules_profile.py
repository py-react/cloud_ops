from sqlmodel import Session, select
from typing import List, Optional, Dict
from app.db_client.models.kubernetes_profiles.httproute_rules_profile import K8sHTTPRouteRulesProfile

def create_httproute_rules_profile(session: Session, profile: K8sHTTPRouteRulesProfile) -> K8sHTTPRouteRulesProfile:
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

def get_httproute_rules_profile(session: Session, profile_id: int) -> Optional[K8sHTTPRouteRulesProfile]:
    return session.get(K8sHTTPRouteRulesProfile, profile_id)

def list_httproute_rules_profiles(session: Session, namespace: str, ids: Optional[List[int]] = None) -> List[K8sHTTPRouteRulesProfile]:
    statement = select(K8sHTTPRouteRulesProfile).where(K8sHTTPRouteRulesProfile.namespace == namespace)
    if ids:
        statement = statement.where(K8sHTTPRouteRulesProfile.id.in_(ids))
    return session.exec(statement).all()

def update_httproute_rules_profile(session: Session, profile_id: int, data: Dict) -> Optional[K8sHTTPRouteRulesProfile]:
    profile = session.get(K8sHTTPRouteRulesProfile, profile_id)
    if not profile:
        return None
    for key, value in data.items():
        setattr(profile, key, value)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

def delete_httproute_rules_profile(session: Session, profile_id: int) -> bool:
    profile = session.get(K8sHTTPRouteRulesProfile, profile_id)
    if not profile:
        return False
    session.delete(profile)
    session.commit()
    return True
