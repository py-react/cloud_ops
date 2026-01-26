from fastapi import Request
from app.db_client.db import get_session
from app.db_client.controllers.kubernetes_profiles.container import list_profiles, create_profile, delete_profile


async def GET(request: Request, namespace:str):
    session = next(get_session())
    profiles = list_profiles(session, namespace)
    return [p.dict() for p in profiles]

async def POST(request: Request):
    session = next(get_session())
    data = await request.json()
    profile = create_profile(session, data)
    return profile.dict()


async def DELETE(request:Request,id:int):
    session = next(get_session())
    return delete_profile(session,id)


