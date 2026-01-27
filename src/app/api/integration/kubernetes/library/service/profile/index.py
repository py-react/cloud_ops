from fastapi import Request
from fastapi.responses import JSONResponse
from app.db_client.db import get_session
from app.db_client.models.kubernetes_profiles.service_profile import K8sServiceProfile
from app.db_client.controllers.kubernetes_profiles.service_profile import (
    list_service_profiles,
    create_service_profile,
    update_service_profile,
    delete_service_profile
)
from app.db_client.models.kubernetes_profiles.service import K8sService
from app.utils.json_utils import clean_generic_profile
from sqlmodel import select

from typing import Optional, List

async def GET(request: Request, namespace: str, ids: Optional[str] = None):
    ids_list = [int(i) for i in ids.split(",")] if ids and ids.strip() else None
    with get_session() as session:
        specs = list_service_profiles(session, namespace, ids=ids_list)
        return [clean_generic_profile(s.dict()) for s in specs]

async def POST(request: Request, body: K8sServiceProfile):
    with get_session() as session:
        spec = create_service_profile(session, body)
        return spec.dict()

async def PUT(request: Request, id: int, body: K8sServiceProfile):
    with get_session() as session:
        data = body.dict(exclude_unset=True)
        spec = update_service_profile(session, id, data)
        if not spec:
            return JSONResponse(status_code=404, content={"detail": "Profile not found"})
        return spec.dict()

async def DELETE(request: Request, id: int):
    with get_session() as session:
        # Dependency check - check if any service uses this profile in its dynamic_attr
        all_services = session.exec(select(K8sService)).all()
        dependents = [s for s in all_services if id in (s.dynamic_attr or {}).values()]
        
        if dependents:
            dependent_data = [{"id": d.id, "name": d.name, "type": "service"} for d in dependents]
            return JSONResponse(status_code=409, content={"detail": {"dependents": dependent_data}})

        success = delete_service_profile(session, id)
        if not success:
             return JSONResponse(status_code=404, content={"detail": "Profile not found"})
        return {"status": "success"}
