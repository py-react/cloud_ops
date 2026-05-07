from fastapi import Request, BackgroundTasks
from app.services.library_manager import LibraryManager
from fastapi.responses import JSONResponse
import yaml

async def GET(request: Request, template: str = None):
    """List all environment configurations for a given template."""
    manager = LibraryManager()
    return manager.list_values(template)

async def POST(request: Request, background_tasks: BackgroundTasks):
    """Create or update an environment configuration for a template."""
    manager = LibraryManager()
    body = await request.json()

    template = body.get("template")
    env_name = body.get("env_name")
    values_yaml = body.get("values_yaml", "")
    message = body.get("message", "Update values via API")

    if not template or not env_name:
        return JSONResponse(status_code=400, content={"detail": "Missing template or env_name"})

    try:
        should_sync = manager.save_values_raw(template, env_name, values_yaml, message)
        if should_sync:
            from app.services.library_sync_worker import run_background_sync
            background_tasks.add_task(run_background_sync)
        
        return {"status": "success", "template": template, "env_name": env_name}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

async def DELETE(request: Request, background_tasks: BackgroundTasks, template: str = None, env_name: str = None):
    """Delete an environment configuration."""
    if not template or not env_name:
        return JSONResponse(status_code=400, content={"detail": "Missing template or env_name"})
    manager = LibraryManager()
    try:
        should_sync = manager.delete_values(template, env_name)
        if should_sync:
            from app.services.library_sync_worker import run_background_sync
            background_tasks.add_task(run_background_sync)
            
        return {"status": "deleted"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})
