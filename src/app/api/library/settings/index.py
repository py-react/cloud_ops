from fastapi import Request, HTTPException
from app.db_client.db import get_session
from app.db_client.models.library_setting.library_setting import LibrarySetting
from sqlmodel import select, Session
from fastapi.responses import JSONResponse

async def GET(request: Request):
    with get_session() as session:
        setting = session.exec(select(LibrarySetting)).first()
        if not setting:
            # Return empty defaults
            return {"status": "success", "data": {}}
        return {"status": "success", "data": setting.model_dump()}

async def POST(request: Request):
    body = await request.json()
    with get_session() as session:
        setting = session.exec(select(LibrarySetting)).first()
        if not setting:
            setting = LibrarySetting()
        
        # Update fields
        if "github_credential_id" in body:
            setting.github_credential_id = body["github_credential_id"]
        if "repo_name" in body:
            setting.repo_name = body["repo_name"]
        if "repo_owner" in body:
            setting.repo_owner = body["repo_owner"]
        if "branch" in body:
            setting.branch = body["branch"]
        if "auto_push" in body:
            setting.auto_push = body["auto_push"]
            
        from datetime import datetime
        setting.updated_at = datetime.utcnow()
        
        session.add(setting)
        session.commit()
        session.refresh(setting)
        return {"status": "success", "message": "Settings updated", "data": setting.model_dump()}
