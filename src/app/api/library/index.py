from fastapi import Request
from app.services.library_manager import LibraryManager

async def GET(request: Request):
    """
    Search/Index endpoint for the Library.
    """
    manager = LibraryManager()
    return manager.index_library()
