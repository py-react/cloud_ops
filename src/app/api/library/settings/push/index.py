from fastapi import Request
from app.services.library_version_manager import LibraryVersionManager
from fastapi.responses import JSONResponse

async def POST(request: Request):
    """
    Manually trigger a push to the remote repository.
    """
    try:
        lvm = LibraryVersionManager()
        lvm.push()
        return {"status": "success", "message": "Changes pushed to remote repository"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
