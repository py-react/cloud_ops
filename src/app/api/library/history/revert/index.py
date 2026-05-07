from fastapi import Request
from app.services.library_version_manager import LibraryVersionManager
from fastapi.responses import JSONResponse

async def POST(request: Request):
    """
    Revert a chart or environment to a specific commit.
    """
    try:
        body = await request.json()
        commit_hash = body.get("commit_hash")
        chart_name = body.get("chart_name")
        env_name = body.get("env_name")
        message = body.get("message")
        
        if not commit_hash:
            return JSONResponse(status_code=400, content={"status": "error", "message": "commit_hash is required"})
            
        lvm = LibraryVersionManager()
        lvm.revert(commit_hash, chart_name=chart_name, env_name=env_name, message=message)
        
        return {"status": "success", "message": "Revert successful"}
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
