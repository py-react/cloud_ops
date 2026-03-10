from sqlmodel import Session, select
from typing import List, Optional, Dict
from app.db_client.models.kubernetes_profiles.httproute_metadata_profile import K8sHTTPRouteMetadataProfile

def create_httproute_metadata_profile(session: Session, profile: K8sHTTPRouteMetadataProfile) -> K8sHTTPRouteMetadataProfile:
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

def get_httproute_metadata_profile(session: Session, profile_id: int) -> Optional[K8sHTTPRouteMetadataProfile]:
    return session.get(K8sHTTPRouteMetadataProfile, profile_id)

def list_httproute_metadata_profiles(session: Session, namespace: str, ids: Optional[List[int]] = None) -> List[K8sHTTPRouteMetadataProfile]:
    statement = select(K8sHTTPRouteMetadataProfile).where(K8sHTTPRouteMetadataProfile.namespace == namespace)
    if ids:
        statement = statement.where(K8sHTTPRouteMetadataProfile.id.in_(ids))
    return session.exec(statement).all()

def update_httproute_metadata_profile(session: Session, profile_id: int, data: Dict) -> Optional[K8sHTTPRouteMetadataProfile]:
    profile = session.get(K8sHTTPRouteMetadataProfile, profile_id)
    if not profile:
        return None
    for key, value in data.items():
        setattr(profile, key, value)
    session.add(profile)
    session.commit()
    session.refresh(profile)
    return profile

def delete_httproute_metadata_profile(session: Session, profile_id: int) -> bool:
    profile = session.get(K8sHTTPRouteMetadataProfile, profile_id)
    if not profile:
        return False
    session.delete(profile)
    session.commit()
    return True
