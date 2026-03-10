from sqlmodel import Session, select
from typing import List, Optional, Dict
from app.db_client.models.kubernetes_profiles.httproute import K8sHTTPRoute

def create_httproute(session: Session, httproute: K8sHTTPRoute) -> K8sHTTPRoute:
    session.add(httproute)
    session.commit()
    session.refresh(httproute)
    return httproute

def get_httproute(session: Session, httproute_id: int) -> Optional[K8sHTTPRoute]:
    return session.get(K8sHTTPRoute, httproute_id)

def list_httproutes(session: Session, namespace: str) -> List[K8sHTTPRoute]:
    statement = select(K8sHTTPRoute).where(K8sHTTPRoute.namespace == namespace)
    return session.exec(statement).all()

def update_httproute(session: Session, httproute_id: int, data: Dict) -> Optional[K8sHTTPRoute]:
    httproute = session.get(K8sHTTPRoute, httproute_id)
    if not httproute:
        return None
    for key, value in data.items():
        setattr(httproute, key, value)
    session.add(httproute)
    session.commit()
    session.refresh(httproute)
    return httproute

def delete_httproute(session: Session, httproute_id: int) -> bool:
    httproute = session.get(K8sHTTPRoute, httproute_id)
    if not httproute:
        return False
    session.delete(httproute)
    session.commit()
    return True
