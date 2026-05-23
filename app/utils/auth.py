import os
from fastapi import Request, HTTPException
from app.db_client.db import get_session
from app.db_client.models import User, GoogleCredential
from sqlmodel import select
from app.utils.encryption import encrypt_string
from app.utils.credential_cache import get_google_credential_token, invalidate_google_credential
from app.utils.session_manager import validate_session, delete_all_user_sessions
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    
    if not token:
        token = request.cookies.get("k1w1_token")
        
    if not token:
        token = request.query_params.get("token")
        
    if not token:
        raise HTTPException(status_code=401, detail="Authentication required")

    user = validate_session(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return user


def get_user_google_credentials(user_id: int):
    try:
        access_token, refresh_token = get_google_credential_token(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Google account not connected")

    with get_session() as session:
        statement = select(GoogleCredential).where(GoogleCredential.user_id == user_id)
        db_cred = session.exec(statement).first()

        if not db_cred:
            raise HTTPException(status_code=400, detail="Google account not connected")

        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri=db_cred.token_uri,
            client_id=db_cred.client_id,
            client_secret=db_cred.client_secret,
            scopes=db_cred.scopes.split(" "),
            expiry=db_cred.expiry,
        )

        if creds.expired:
            try:
                creds.refresh(GoogleRequest())
                db_cred.access_token = encrypt_string(creds.token)
                db_cred.expiry = creds.expiry
                db_cred.updated_at = datetime.utcnow()
                session.add(db_cred)
                session.commit()
                invalidate_google_credential(user_id)
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Failed to refresh Google token: {str(e)}")

        return creds
