from fastapi import Request
from fastapi.responses import JSONResponse
from sqlmodel import Session, select
from app.db_client.db import engine
from app.services.kube_config_service import KubeConfigService
from app.db_client.models.kubernetes_configs.kube_config_file import KubeConfigFile
from typing import Optional

async def GET(request: Request):
    """List all available Kubeconfigs."""
    with Session(engine) as session:
        configs = KubeConfigService.list_configs(session)
        return [c.dict(exclude={"content_encrypted"}) for c in configs]

async def POST(request: Request):
    """
    Handle adding, activating, or switching contexts in a Kubeconfig.
    """
    data = await request.json()
    action = data.get("action", "add")
    
    with Session(engine) as session:
        if action == "add":
            name = data.get("name")
            content = data.get("content")
            is_system = data.get("is_system", False)
            system_path = data.get("system_path")
            
            if not name:
                return JSONResponse(status_code=400, content={"error": "Missing name"})
            if not is_system and not content:
                return JSONResponse(status_code=400, content={"error": "Missing content for uploaded config"})
            if is_system and not system_path:
                return JSONResponse(status_code=400, content={"error": "Missing system path for system config"})
                
            new_config = KubeConfigService.add_config(
                name=name, 
                content=content, 
                session=session, 
                is_system=is_system, 
                system_path=system_path
            )
            return new_config.dict(exclude={"content_encrypted"})
            
        elif action == "activate":
            config_id = data.get("id")
            if not config_id:
                return JSONResponse(status_code=400, content={"error": "Missing config ID"})
            KubeConfigService.set_active(config_id, session)
            return {"status": "success", "message": "Config activated"}
            
        elif action == "switch_context":
            config_id = data.get("id")
            context_name = data.get("context_name")
            if not config_id or not context_name:
                return JSONResponse(status_code=400, content={"error": "Missing config ID or context name"})
            KubeConfigService.switch_context(config_id, context_name, session)
            return {"status": "success", "message": f"Context switched to {context_name}"}
            
        else:
            return JSONResponse(status_code=400, content={"error": "Invalid action"})

async def DELETE(request: Request):
    """Delete a Kubeconfig file from the database."""
    config_id = request.query_params.get("id")
    if not config_id:
        return JSONResponse(status_code=400, content={"error": "Missing config ID"})
        
    with Session(engine) as session:
        config_obj = session.get(KubeConfigFile, int(config_id))
        if config_obj:
            if config_obj.is_active:
                total_configs = session.exec(select(KubeConfigFile)).all()
                if len(total_configs) > 1:
                    return JSONResponse(status_code=400, content={"error": "Cannot delete active config when others exist. Switch to another config first."})
            
            was_active = config_obj.is_active
            session.delete(config_obj)
            session.commit()
            
            if was_active:
                try:
                    KubeConfigService.load_active_config()
                except ValueError:
                    # Ignore the error if we just deleted the last active config
                    pass
                
            return {"status": "success"}
        return JSONResponse(status_code=404, content={"error": "Config not found"})
