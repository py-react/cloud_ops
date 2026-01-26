from fastapi import Request
from app.db_client.db import engine, get_session
from sqlmodel import Session
from app.db_client.controllers.kubernetes_profiles.container import list_profiles, create_profile, delete_profile
from app.db_client.models.kubernetes_profiles.container import K8sContainerProfile
from typing import Optional, List

async def GET(request: Request, namespace: Optional[str] = None, ids: Optional[str] = None):
    ids_list = [int(i) for i in ids.split(",")] if ids else None
    with get_session() as session:
        profiles = list_profiles(session, namespace, ids=ids_list)
        return [p.dict() for p in profiles]

async def POST(request: Request, body: K8sContainerProfile):
    with get_session() as session:
        profile = create_profile(session, body.dict())
        return profile.dict()


from sqlmodel import select
from app.db_client.models.kubernetes_profiles.pod import K8sPod
from fastapi import Request
from fastapi.responses import JSONResponse

async def DELETE(request: Request, id: int):
    with get_session() as session:
        # Check for dependencies in K8sPod.containers (JSONB list)
        all_pods = session.exec(select(K8sPod)).all()
        dependents = [p for p in all_pods if id in (p.containers or [])]
        
        if dependents:
            dependent_data = [{"id": p.id, "name": p.name, "type": "pod"} for p in dependents]
            return JSONResponse(status_code=409, content={"detail": {"dependents": dependent_data}})
            
        return delete_profile(session, id)

