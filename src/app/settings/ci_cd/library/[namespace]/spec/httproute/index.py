from fastapi import Request

async def index(request: Request):
    """
    Server-side rendering or logic for the Personal Access Tokens management page.
    """
    return {"message": "PATs management page"}
