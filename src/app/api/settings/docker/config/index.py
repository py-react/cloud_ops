from fastapi import Request, HTTPException
from app.db_client.db import get_session
from app.db_client.controllers.docker_config.docker_config import (
    create_docker_config,
    list_docker_configs,
    get_docker_config,
    update_docker_config,
    delete_docker_config,
    set_active_docker_config,
    get_active_docker_config
)
from app.db_client.models.docker_config.types import DockerConfigType

async def GET(request: Request):
    with get_session() as session:
        configs = list_docker_configs(session)
        
        results = []
        # Add Local Engine
        results.append({
            "id": 0,
            "name": "Local Engine (Default)",
            "base_url": "unix:///var/run/docker.sock",
            "verify": False,
            "is_default": True
        })
        
        for c in configs:
            d = c.dict()
            d["is_default"] = False
            results.append(d)
            
        return results

async def POST(request: Request, body: DockerConfigType):
    with get_session() as session:
        try:
            config = create_docker_config(session, body)
            return config.dict()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

async def PUT(request: Request, id: int, body: DockerConfigType):
    with get_session() as session:
        config = update_docker_config(session, id, body)
        if not config:
            raise HTTPException(status_code=404, detail="Config not found")
        return config.dict()

async def DELETE(request: Request, id: int):
    with get_session() as session:
        success = delete_docker_config(session, id)
        if not success:
            raise HTTPException(status_code=404, detail="Config not found")
        return {"success": True}

async def PATCH(request: Request, id: int, body: dict):
    with get_session() as session:
        # If body contains is_active: true, activate this ID
        # If body contains is_active: false, we might want to deactivate all (back to default)
        if body.get("is_active"):
            success = set_active_docker_config(session, id)
        else:
            success = set_active_docker_config(session, None)
            
        if not success:
            raise HTTPException(status_code=404, detail="Config not found")
        return {"success": True}
