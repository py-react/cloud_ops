from fastapi import Request
from app.db_client.db import engine, get_session
from sqlmodel import Session
from app.db_client.controllers.kubernetes_profiles.deployment import list_deployments, create_deployment, delete_deployment, update_deployment
from app.db_client.models.kubernetes_profiles.deployment import K8sDeployment
from typing import Optional, List
from app.utils.json_utils import clean_deployment_profile
from fastapi.responses import JSONResponse
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from sqlmodel import select

async def GET(request: Request, namespace: str):
    with get_session() as session:
        deployments = list_deployments(session, namespace)
        return [clean_deployment_profile(p.dict()) for p in deployments]

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
        # Dependency check - check if any release config uses this derived deployment
        stmt = select(DeploymentConfig).where(DeploymentConfig.derived_deployment_id == id)
        dependents = session.exec(stmt).all()
        
        if dependents:
            dependent_data = [{"id": d.id, "name": d.deployment_name, "type": "release_config"} for d in dependents]
            return JSONResponse(status_code=409, content={"detail": {"dependents": dependent_data}})

        return delete_deployment(session, id)
