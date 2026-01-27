from fastapi import Request
from fastapi.responses import JSONResponse
from app.db_client.db import get_session
from app.db_client.models.kubernetes_profiles.service_metadata_profile import K8sServiceMetadataProfile
from app.db_client.controllers.kubernetes_profiles.service_metadata_profile import (
    list_service_metadata_profiles,
    create_service_metadata_profile,
    update_service_metadata_profile,
    delete_service_metadata_profile
)
from app.db_client.models.kubernetes_profiles.service import K8sService
from app.utils.json_utils import clean_generic_profile
from sqlmodel import select

from typing import Optional, List

async def GET(request: Request, namespace: str, ids: Optional[str] = None):
    ids_list = [int(i) for i in ids.split(",")] if ids else None
    with get_session() as session:
        specs = list_service_metadata_profiles(session, namespace, ids=ids_list)
        return [clean_generic_profile(s.dict()) for s in specs]

async def POST(request: Request, body: K8sServiceMetadataProfile):
    with get_session() as session:
        spec = create_service_metadata_profile(session, body)
        return spec.dict()

async def PUT(request: Request, id: int, body: K8sServiceMetadataProfile):
    with get_session() as session:
        data = body.dict(exclude_unset=True)
        spec = update_service_metadata_profile(session, id, data)
        if not spec:
            return JSONResponse(status_code=404, content={"detail": "Profile not found"})
        return spec.dict()

async def DELETE(request: Request, id: int):
    with get_session() as session:
        # Dependency check
        stmt = select(K8sService).where(K8sService.metadata_profile_id == id)
        dependents = session.exec(stmt).all()
        if dependents:
            dependent_data = [{"id": d.id, "name": d.name, "type": "service"} for d in dependents]
            return JSONResponse(status_code=409, content={"detail": {"dependents": dependent_data}})

        success = delete_service_metadata_profile(session, id)
        if not success:
             return JSONResponse(status_code=404, content={"detail": "Profile not found"})
        return {"status": "success"}
