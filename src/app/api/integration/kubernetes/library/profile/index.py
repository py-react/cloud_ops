from fastapi import Request
from app.db_client.db import engine, get_session
from sqlmodel import Session
from app.db_client.controllers.kubernetes_profiles.profiles import list_profiles, create_profile, delete_profile
from typing import Optional, List

async def GET(request: Request, namespace: Optional[str] = None, ids: Optional[str] = None):
    ids_list = [int(i) for i in ids.split(",")] if ids else None
    with get_session() as session:
        profiles = list_profiles(session, namespace, ids=ids_list)
        return [p.dict() for p in profiles]

async def POST(request: Request):
    with get_session() as session:
        data = await request.json()
        profile = create_profile(session, data)
        return profile.dict()


from sqlmodel import select
from app.db_client.models.kubernetes_profiles.container import K8sContainerProfile
from fastapi import Request
from fastapi.responses import JSONResponse

async def DELETE(request: Request, id: int):
    with get_session() as session:
        # Check for dependencies in K8sContainerProfile
        # Container Specs are used in Derived Containers. 
        # But wait, looking at pod.py earlier, containers were IDs of K8sContainerProfile.
        # So we check if anyone uses this entity profile.
        
        # Check against K8sContainerProfile.dynamic_attr (JSONB)
        # and K8sContainerProfile itself if linked.
        # Actually, ContainerSpecs are the "Profiles" used by Derived Containers.
        
        all_derived = session.exec(select(K8sContainerProfile)).all()
        dependents = [c for c in all_derived if any(val == id for val in (c.dynamic_attr or {}).values())]
        
        if dependents:
            dependent_data = [{"id": c.id, "name": c.name, "type": "container"} for c in dependents]
            return JSONResponse(status_code=409, content={"detail": {"dependents": dependent_data}})
            
        return delete_profile(session, id)
