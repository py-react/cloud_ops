from fastapi import Request, Query
from app.services.library_version_manager import LibraryVersionManager
from fastapi.responses import JSONResponse
from typing import Optional

async def GET(
    request: Request, 
    chart_name: Optional[str] = Query(None), 
    env_name: Optional[str] = Query(None),
    commit_hash: Optional[str] = Query(None)
):
    """
    Get history or diff for charts and environments.
    """
    try:
        lvm = LibraryVersionManager()
        
        if commit_hash:
            diff = lvm.get_diff(commit_hash, chart_name=chart_name, env_name=env_name)
            return {"status": "success", "data": diff}
        
        history = lvm.get_history(chart_name=chart_name, env_name=env_name)
        return {"status": "success", "data": history}
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
