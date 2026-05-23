from fastapi import Request
from fastapi.responses import JSONResponse
from app.utils.session_manager import delete_session

async def POST(request: Request):
    token = request.cookies.get("k1w1_token")
    if token:
        delete_session(token)
    response = JSONResponse(content={"status": "success", "message": "Logged out successfully"})
    response.delete_cookie(key="k1w1_token")
    return response
