from fastapi import Request
from app.db_client.db import engine, get_session
from sqlmodel import Session
from app.db_client.controllers.kubernetes_profiles.profiles import list_profiles, create_profile, delete_profile
from typing import Optional, List

async def GET(request: Request, namespace: Optional[str] = None, ids: Optional[str] = None):
    ids_list = [int(i) for i in ids.split(",")] if ids else None
    with get_session() as session:
        profiles = list_profiles(session, namespace, ids=ids_list)
        return [p.dict() for p in profiles]

async def POST(request: Request):
    with get_session() as session:
        data = await request.json()
        profile = create_profile(session, data)
        return profile.dict()


async def DELETE(request:Request,id:int):
    with get_session() as session:
        return delete_profile(session,id)
