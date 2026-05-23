import os
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
from fastapi import Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from app.db_client.db import get_session
from app.db_client.models import User, GoogleCredential, Tenant
from sqlmodel import select
import jwt
from datetime import datetime, timedelta
from app.utils.encryption import encrypt_string
from kiwijs.utils.load_settings import load_settings
async def GET(request: Request):
    code = request.query_params.get("code")
    if not code:
        return {"error": "No authorization code provided"}
    settings = load_settings()
    client_id = settings.get("GOOGLE_CLIENT_ID")
    client_secret = settings.get("GOOGLE_CLIENT_SECRET")
    redirect_uri = settings.get("GOOGLE_REDIRECT_URI", "http://localhost:5002/api/v1/auth/callback")
    
    client_config = {
        "web": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }
    
    state = request.cookies.get("oauth_state")
    code_verifier = request.cookies.get("code_verifier")

    flow = Flow.from_client_config(
        client_config,
        scopes=[
            "openid",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/cloud-platform"
        ],
        state=state,
        redirect_uri=redirect_uri
    )
    
    flow.fetch_token(code=code, code_verifier=code_verifier)
    credentials = flow.credentials
    
    # Get user profile data
    user_info_service = build("oauth2", "v2", credentials=credentials)
    user_info = user_info_service.userinfo().get().execute()
    
    email = user_info.get("email")
    name = user_info.get("name")
    picture = user_info.get("picture")
    
    with get_session() as session:
        # Check if user exists
        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()
        
        if not user:
            # Create a new tenant (Organization) for this user (Multi-tenant isolation)
            tenant = Tenant(name=f"{name}'s Organization")
            session.add(tenant)
            session.commit()
            session.refresh(tenant)
            
            user = User(
                email=email,
                full_name=name,
                picture=picture,
                tenant_id=tenant.id
            )
            session.add(user)
            session.commit()
            session.refresh(user)
            
        # Encrypt tokens before storing
        encrypted_access_token = encrypt_string(credentials.token)
        encrypted_refresh_token = encrypt_string(credentials.refresh_token) if credentials.refresh_token else None
        
        # Store or update Google credentials
        statement = select(GoogleCredential).where(GoogleCredential.user_id == user.id)
        db_cred = session.exec(statement).first()
        
        if db_cred:
            db_cred.access_token = encrypted_access_token
            if encrypted_refresh_token:
                db_cred.refresh_token = encrypted_refresh_token
            db_cred.expiry = credentials.expiry
            db_cred.updated_at = datetime.utcnow()
            session.add(db_cred)
        else:
            db_cred = GoogleCredential(
                user_id=user.id,
                access_token=encrypted_access_token,
                refresh_token=encrypted_refresh_token or "",
                token_uri=credentials.token_uri,
                client_id=credentials.client_id,
                client_secret=credentials.client_secret,
                scopes=" ".join(credentials.scopes),
                expiry=credentials.expiry
            )
            session.add(db_cred)
            
        session.commit()
        
        # Issue internal application JWT
        payload = {
            "user_id": user.id,
            "tenant_id": user.tenant_id,
            "email": user.email,
            "exp": datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(payload, settings.get("JWT_SECRET", "k1w1-internal-secret"), algorithm="HS256")
        
        # Redirect to root and set session cookie
        response = RedirectResponse(url="/")
        response.set_cookie(
            key="k1w1_token", 
            value=token, 
            httponly=False, # Set to False so frontend can read it if needed, or True if purely backend-side
            max_age=7*24*3600,
            samesite="lax"
        )
        response.delete_cookie("oauth_state")
        response.delete_cookie("code_verifier")
        return response
