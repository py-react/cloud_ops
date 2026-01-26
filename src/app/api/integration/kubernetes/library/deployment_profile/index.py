from fastapi import Request
from app.db_client.db import engine, get_session
from sqlmodel import Session, select
from app.db_client.controllers.kubernetes_profiles.deployment_profile import list_profiles, create_profile, delete_profile, update_profile
from app.db_client.models.kubernetes_profiles.deployment_profile import K8sDeploymentProfile
from app.db_client.models.kubernetes_profiles.deployment import K8sDeployment
from typing import Optional, List
from fastapi.responses import JSONResponse

async def GET(request: Request, namespace: Optional[str] = None, ids: Optional[str] = None):
    ids_list = [int(i) for i in ids.split(",")] if ids else None
    with get_session() as session:
        profiles = list_profiles(session, namespace, ids=ids_list)
        return [p.dict() for p in profiles]

async def POST(request: Request, body: K8sDeploymentProfile):
    with get_session() as session:
        profile = create_profile(session, body.dict())
        return profile.dict()

async def PUT(request: Request, id: int, body: K8sDeploymentProfile):
    with get_session() as session:
        data = body.dict(exclude_unset=True)
        profile = update_profile(session, id, data)
        if not profile:
            return JSONResponse(status_code=404, content={"detail": "Deployment profile not found"})
        return profile.dict()

async def DELETE(request: Request, id: int):
    with get_session() as session:
        # Check for dependencies in K8sDeployment.dynamic_attr (JSONB dict)
        all_deployments = session.exec(select(K8sDeployment)).all()
        dependents = [d for d in all_deployments if any(val == id for val in (d.dynamic_attr or {}).values())]
        
        if dependents:
            dependent_data = [{"id": d.id, "name": d.name, "type": "deployment"} for d in dependents]
            return JSONResponse(status_code=409, content={"detail": {"dependents": dependent_data}})
            
        return delete_profile(session, id)
