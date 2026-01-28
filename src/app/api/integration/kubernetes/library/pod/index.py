from app.db_client.db import engine, get_session
from sqlmodel import Session
from fastapi import Request
from app.db_client.controllers.kubernetes_profiles.pod import list_pods, create_pod, delete_pod, update_pod
from app.db_client.models.kubernetes_profiles.pod import K8sPod
from app.utils.json_utils import clean_pod_profile

async def GET(request: Request, namespace: str):
    with get_session() as session:
        pods = list_pods(session, namespace)
        return [clean_pod_profile(p.dict()) for p in pods]

async def POST(request: Request, body: K8sPod):
    with get_session() as session:
        pod = create_pod(session, body.dict())
        return pod.dict()

async def PUT(request: Request, id: int, body: K8sPod):
    with get_session() as session:
        data = body.dict(exclude_unset=True)
        pod = update_pod(session, id, data)
        if not pod:
            return JSONResponse(status_code=404, content={"detail": "Pod not found"})
        return pod.dict()

from app.db_client.models.kubernetes_profiles.deployment import K8sDeployment
from sqlmodel import select
from fastapi.responses import JSONResponse

async def DELETE(request: Request, id: int):
    with get_session() as session:
        # Dependency check - check if any derived deployment uses this pod template
        stmt = select(K8sDeployment).where(K8sDeployment.pod_id == id)
        dependents = session.exec(stmt).all()
        
        if dependents:
            dependent_data = [{"id": d.id, "name": d.name, "type": "derived_deployment"} for d in dependents]
            return JSONResponse(status_code=409, content={"detail": {"dependents": dependent_data}})

        return delete_pod(session, id)
