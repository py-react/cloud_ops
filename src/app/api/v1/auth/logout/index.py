from fastapi import Request
from fastapi.responses import JSONResponse

async def POST(request: Request):
    response = JSONResponse(content={"status": "success", "message": "Logged out successfully"})
    # Delete the session cookie
    response.delete_cookie(key="k1w1_token")
    return response
