from fastapi import Request
from fastapi.responses import RedirectResponse

async def middleware(request: Request, call_next):
    # Check for the authentication cookie
    token = request.cookies.get("k1w1_token")
    if not token:
        # Server-side redirect to login if no session is found
        return RedirectResponse(url="/login")
    return await call_next(request)

async def index(request: Request):
    """
    Explicitly accept the request object. 
    KiwiJs view_func expects this to be passed down correctly.
    """
    return {}