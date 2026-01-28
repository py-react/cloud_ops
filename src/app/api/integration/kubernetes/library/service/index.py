from fastapi import Request
from fastapi.responses import JSONResponse
from app.db_client.db import get_session
from app.db_client.models.kubernetes_profiles.service import K8sService
from app.db_client.controllers.kubernetes_profiles.service import (
    list_services,
    create_service,
    update_service,
    delete_service
)
from app.utils.json_utils import clean_service

async def GET(request: Request, namespace: str):
    with get_session() as session:
        specs = list_services(session, namespace)
        return [clean_service(s.dict()) for s in specs]

async def POST(request: Request, body: K8sService):
    with get_session() as session:
        spec = create_service(session, body)
        return spec.dict()

async def PUT(request: Request, id: int, body: K8sService):
    with get_session() as session:
        data = body.dict(exclude_unset=True)
        spec = update_service(session, id, data)
        if not spec:
            return JSONResponse(status_code=404, content={"detail": "Service not found"})
        return spec.dict()

from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from sqlmodel import select

async def DELETE(request: Request, id: int):
    with get_session() as session:
        # Dependency check - check if any release config uses this derived service
        stmt = select(DeploymentConfig).where(
            DeploymentConfig.service_id == id,
            DeploymentConfig.hard_delete == False
        )
        dependents = session.exec(stmt).all()
        
        if dependents:
            dependent_data = [{"id": d.id, "name": d.deployment_name, "type": "release_config"} for d in dependents]
            return JSONResponse(status_code=409, content={"detail": {"dependents": dependent_data}})

        success = delete_service(session, id)
        if not success:
             return JSONResponse(status_code=404, content={"detail": "Service not found"})
        return {"status": "success"}
