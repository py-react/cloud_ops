import os
import jwt
from fastapi import Request, HTTPException
from app.db_client.db import get_session
from app.db_client.models import User, GoogleCredential
from sqlmodel import select
from app.utils.encryption import decrypt_string, encrypt_string
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from datetime import datetime

from kiwijs.utils.load_settings import load_settings

settings = load_settings()
JWT_SECRET = settings.get("JWT_SECRET", "k1w1-internal-secret")

def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    
    if not token:
        # Check cookies
        token = request.cookies.get("k1w1_token")
        
    if not token:
        # Check query params (for dev/onboarding redirect)
        token = request.query_params.get("token")
        
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        with get_session() as session:
            user = session.get(User, user_id)
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_user_google_credentials(user_id: int):
    with get_session() as session:
        statement = select(GoogleCredential).where(GoogleCredential.user_id == user_id)
        db_cred = session.exec(statement).first()
        
        if not db_cred:
            raise HTTPException(status_code=400, detail="Google account not connected")
        
        # Decrypt tokens
        access_token = decrypt_string(db_cred.access_token)
        refresh_token = decrypt_string(db_cred.refresh_token) if db_cred.refresh_token else None
        
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri=db_cred.token_uri,
            client_id=db_cred.client_id,
            client_secret=db_cred.client_secret,
            scopes=db_cred.scopes.split(" "),
            expiry=db_cred.expiry
        )
        
        # Refresh if expired
        if creds.expired:
            try:
                creds.refresh(GoogleRequest())
                # Update DB with new access token
                db_cred.access_token = encrypt_string(creds.token)
                db_cred.expiry = creds.expiry
                db_cred.updated_at = datetime.utcnow()
                session.add(db_cred)
                session.commit()
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Failed to refresh Google token: {str(e)}")
            
        return creds
