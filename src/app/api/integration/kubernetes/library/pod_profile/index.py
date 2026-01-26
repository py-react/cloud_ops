from fastapi import Request
from app.db_client.db import engine, get_session
from app.db_client.controllers.kubernetes_profiles.pod_profile import list_profiles, create_profile, delete_profile
from app.db_client.models.kubernetes_profiles.pod_profile import K8sPodProfile
from typing import Optional, List

async def GET(request: Request, namespace: Optional[str] = None, ids: Optional[str] = None):
    ids_list = [int(i) for i in ids.split(",")] if ids else None
    with get_session() as session:
        profiles = list_profiles(session, namespace, ids=ids_list)
        return [p.dict() for p in profiles]

async def POST(request: Request, body: K8sPodProfile):
    with get_session() as session:
        profile = create_profile(session, body.dict())
        return profile.dict()

async def DELETE(request: Request, id: int):
    with get_session() as session:
        return delete_profile(session, id)
