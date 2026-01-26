from fastapi import Request
from app.db_client.db import get_session
from app.db_client.controllers.kubernetes_profiles.pod import list_pods, create_pod, delete_pod

async def GET(request: Request, namespace: str):
    session = next(get_session())
    pods = list_pods(session, namespace)
    return [p.dict() for p in pods]

async def POST(request: Request):
    session = next(get_session())
    data = await request.json()
    pod = create_pod(session, data)
    return pod.dict()

async def DELETE(request: Request, id: int):
    session = next(get_session())
    return delete_pod(session, id)
