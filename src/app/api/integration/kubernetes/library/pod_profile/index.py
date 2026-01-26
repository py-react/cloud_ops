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

from sqlmodel import select
from app.db_client.models.kubernetes_profiles.pod import K8sPod
from fastapi import Request
from fastapi.responses import JSONResponse

async def DELETE(request: Request, id: int):
    with get_session() as session:
        # Check for dependencies in K8sPod.dynamic_attr (JSONB dict)
        # We check if the ID exists as a value in the dynamic_attr dictionary
        all_pods = session.exec(select(K8sPod)).all()
        dependents = [p for p in all_pods if any(val == id for val in (p.dynamic_attr or {}).values())]
        
        if dependents:
            dependent_data = [{"id": p.id, "name": p.name, "type": "pod"} for p in dependents]
            return JSONResponse(status_code=409, content={"detail": {"dependents": dependent_data}})
            
        return delete_profile(session, id)
