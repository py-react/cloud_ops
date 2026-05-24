import os
from fastapi import Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from kiwijs.utils.load_settings import load_settings

# Required OAuth Scopes
SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
]

async def GET(request: Request):
    settings = load_settings()
    client_id = settings.get("GOOGLE_CLIENT_ID")
    client_secret = settings.get("GOOGLE_CLIENT_SECRET")
    redirect_uri = settings.get("GOOGLE_REDIRECT_URI", "http://localhost:5002/api/v1/auth/callback")

    if not client_id or not client_secret:
        return {"error": "Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."}

    client_config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )
    
    # access_type="offline" and prompt="consent" guarantee a refresh_token is issued
    authorization_url, state = flow.authorization_url(
        access_type="offline",
        prompt="consent",
        include_granted_scopes="true"
    )
    
    response = RedirectResponse(authorization_url)
    # Store state and code_verifier in cookies since we don't have sessions
    response.set_cookie(key="oauth_state", value=state, httponly=True, max_age=3600)
    if hasattr(flow, 'code_verifier'):
        response.set_cookie(key="code_verifier", value=flow.code_verifier, httponly=True, max_age=3600)
        
    return response
