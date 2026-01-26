from app.db_client.db import engine, get_session
from sqlmodel import Session
from fastapi import Request
from app.db_client.controllers.kubernetes_profiles.pod import list_pods, create_pod, delete_pod, update_pod
from app.db_client.models.kubernetes_profiles.pod import K8sPod

async def GET(request: Request, namespace: str):
    with get_session() as session:
        pods = list_pods(session, namespace)
        return [p.dict() for p in pods]

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

async def DELETE(request: Request, id: int):
    with get_session() as session:
        return delete_pod(session, id)
