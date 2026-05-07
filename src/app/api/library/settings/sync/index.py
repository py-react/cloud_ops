from fastapi import Request
from app.services.library_version_manager import LibraryVersionManager
from fastapi.responses import JSONResponse
import asyncio

async def GET(request: Request):
    """Get the current conflict status of the library repository."""
    try:
        lvm = LibraryVersionManager()
        status = lvm.get_conflict_status()
        return {"status": "success", "data": status}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

async def POST(request: Request):
    """Resolve a conflict in a specific file or continue the sync process."""
    try:
        body = await request.json()
        action = body.get("action") # 'resolve', 'continue', 'abort'
        
        lvm = LibraryVersionManager()
        
        if action == "resolve":
            file_path = body.get("file_path")
            content = body.get("content")
            if not file_path:
                return JSONResponse(status_code=400, content={"status": "error", "message": "file_path is required"})
            await asyncio.to_thread(lvm.resolve_conflict, file_path, content)
            return {"status": "success", "message": f"File {file_path} marked as resolved"}
            
        elif action == "continue":
            result = await asyncio.to_thread(lvm.continue_sync)
            return result
            
        elif action == "pull":
            result = await asyncio.to_thread(lvm.pull)
            return result
            
        elif action == "abort":
            await asyncio.to_thread(lvm.abort_sync)
            return {"status": "success", "message": "Sync aborted and repository reset"}
            
        else:
            return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid action"})
            
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
