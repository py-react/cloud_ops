from fastapi import Request
from app.db_client.db import engine, get_session
from sqlmodel import Session
from app.db_client.controllers.kubernetes_profiles.deployment import list_deployments, create_deployment, delete_deployment, update_deployment
from app.db_client.models.kubernetes_profiles.deployment import K8sDeployment
from typing import Optional, List
from fastapi.responses import JSONResponse

async def GET(request: Request, namespace: str):
    with get_session() as session:
        deployments = list_deployments(session, namespace)
        return [p.dict() for p in deployments]

async def POST(request: Request, body: K8sDeployment):
    with get_session() as session:
        deployment = create_deployment(session, body.dict())
        return deployment.dict()

async def PUT(request: Request, id: int, body: K8sDeployment):
    with get_session() as session:
        data = body.dict(exclude_unset=True)
        deployment = update_deployment(session, id, data)
        if not deployment:
            return JSONResponse(status_code=404, content={"detail": "Deployment not found"})
        return deployment.dict()

async def DELETE(request: Request, id: int):
    with get_session() as session:
        # Dependency checks can be added here later if needed
        return delete_deployment(session, id)
