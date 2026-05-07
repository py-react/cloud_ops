from fastapi import Request
from app.services.library_manager import LibraryManager
from fastapi.responses import PlainTextResponse, JSONResponse
import yaml

async def GET(request: Request, template: str, env_name: str):
    """Return raw YAML content of a specific environment configuration."""
    manager = LibraryManager()
    content = manager.get_values_raw(template, env_name)
    if content is None:
        return JSONResponse(status_code=404, content={"detail": "Values not found"})
    return PlainTextResponse(content)

async def index(request: Request):
    pass
