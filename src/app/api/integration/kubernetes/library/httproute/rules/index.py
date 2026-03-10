from fastapi import Request
from fastapi.responses import JSONResponse
from app.db_client.db import get_session
from app.db_client.models.kubernetes_profiles.httproute_rules_profile import K8sHTTPRouteRulesProfile
from app.db_client.controllers.kubernetes_profiles.httproute_rules_profile import (
    list_httproute_rules_profiles,
    create_httproute_rules_profile,
    update_httproute_rules_profile,
    delete_httproute_rules_profile
)
from app.db_client.models.kubernetes_profiles.httproute import K8sHTTPRoute
from app.utils.json_utils import clean_generic_profile
from sqlmodel import select
from typing import Optional, List

async def GET(request: Request, namespace: str, ids: Optional[str] = None):
    ids_list = [int(i) for i in ids.split(",")] if ids else None
    with get_session() as session:
        specs = list_httproute_rules_profiles(session, namespace, ids=ids_list)
        return [clean_generic_profile(s.dict()) for s in specs]

async def POST(request: Request, body: K8sHTTPRouteRulesProfile):
    with get_session() as session:
        spec = create_httproute_rules_profile(session, body)
        return spec.dict()

async def PUT(request: Request, id: int, body: K8sHTTPRouteRulesProfile):
    with get_session() as session:
        data = body.dict(exclude_unset=True)
        spec = update_httproute_rules_profile(session, id, data)
        if not spec:
            return JSONResponse(status_code=404, content={"detail": "Profile not found"})
        return spec.dict()

async def DELETE(request: Request, id: int):
    with get_session() as session:
        stmt = select(K8sHTTPRoute).where(K8sHTTPRoute.rules_profile_id == id)
        dependents = session.exec(stmt).all()
        if dependents:
            dependent_data = [{"id": d.id, "name": d.name, "type": "httproute"} for d in dependents]
            return JSONResponse(status_code=409, content={"detail": {"dependents": dependent_data}})

        success = delete_httproute_rules_profile(session, id)
        if not success:
             return JSONResponse(status_code=404, content={"detail": "Profile not found"})
        return {"status": "success"}
