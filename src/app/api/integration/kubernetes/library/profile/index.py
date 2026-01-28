from fastapi import Request
from app.db_client.db import engine, get_session
from sqlmodel import Session
from app.db_client.controllers.kubernetes_profiles.profiles import list_profiles, create_profile, delete_profile, update_profile
from app.db_client.models.kubernetes_profiles.profile import K8sEntityProfile
from typing import Optional, List

async def GET(request: Request, namespace: Optional[str] = None, ids: Optional[str] = None):
    ids_list = [int(i) for i in ids.split(",")] if ids else None
    with get_session() as session:
        profiles = list_profiles(session, namespace, ids=ids_list)
        return [p.dict() for p in profiles]

async def POST(request: Request, body: K8sEntityProfile):
    with get_session() as session:
        profile = create_profile(session, body.dict())
        return profile.dict()

async def PUT(request: Request, id: int, body: K8sEntityProfile):
    with get_session() as session:
        data = body.dict(exclude_unset=True)
        profile = update_profile(session, id, data)
        if not profile:
            return JSONResponse(status_code=404, content={"detail": "Profile not found"})
        return profile.dict()


from sqlmodel import select
from app.db_client.models.kubernetes_profiles.container import K8sContainerProfile
from fastapi import Request
from fastapi.responses import JSONResponse

from app.db_client.models.kubernetes_profiles.deployment import K8sDeployment
from app.db_client.models.kubernetes_profiles.service import K8sService

async def DELETE(request: Request, id: int):
    with get_session() as session:
        all_dependents = []
        
        # 1. Check K8sContainerProfile dynamic_attr
        all_containers = session.exec(select(K8sContainerProfile)).all()
        container_deps = [c for c in all_containers if any(val == id for val in (c.dynamic_attr or {}).values())]
        all_dependents.extend([{"id": c.id, "name": c.name, "type": "container"} for c in container_deps])
        
        # 2. Check K8sDeployment dynamic_attr
        all_deployments = session.exec(select(K8sDeployment)).all()
        deployment_deps = [d for d in all_deployments if any(val == id for val in (d.dynamic_attr or {}).values())]
        all_dependents.extend([{"id": d.id, "name": d.name, "type": "deployment"} for d in deployment_deps])

        # 3. Check K8sService dynamic_attr
        all_services = session.exec(select(K8sService)).all()
        service_deps = [s for s in all_services if any(val == id for val in (s.dynamic_attr or {}).values())]
        all_dependents.extend([{"id": s.id, "name": s.name, "type": "service"} for s in service_deps])
        
        if all_dependents:
            return JSONResponse(status_code=409, content={"detail": {"dependents": all_dependents}})
            
        return delete_profile(session, id)
