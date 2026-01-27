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

async def DELETE(request: Request, id: int):
    with get_session() as session:
        success = delete_service(session, id)
        if not success:
             return JSONResponse(status_code=404, content={"detail": "Service not found"})
        return {"status": "success"}
