from fastapi import Request
from app.utils.auth import get_current_user
from app.gcp_client.gcp_error_handler import gcp_error_interceptor

@gcp_error_interceptor
async def GET(request: Request):
    user = get_current_user(request)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "picture": user.picture
    }
