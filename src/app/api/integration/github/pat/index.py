from typing import List, Optional
from datetime import datetime
import asyncio
from fastapi import Request, HTTPException
from pydantic import BaseModel
from app.db_client.db import get_session
from app.db_client.controllers.github_pat.github_pat import (
    create_pat,
    list_pats,
    delete_pat,
    set_active_pat,
)
from render_relay.utils.get_logger import get_logger
import httpx
from app.utils.get_fernet import get_fernet

logger = get_logger("GitHub PAT API")


class CreatePATRequest(BaseModel):
    name: str
    token: str
    active: bool = False


class PATListItem(BaseModel):
    id: int
    name: str
    active: bool
    created_at: datetime
    last_used_at: Optional[datetime]
    last_used_at: Optional[datetime]
    scopes: Optional[List[str]] = None
    usage_count: int = 0
    used_repos: List[str] = []

async def validate_pat_token(token: str, required_scopes: Optional[List[str]] = None) -> List[str]:
    """
    Validate the supplied GitHub PAT by calling the GitHub /user API
    and checking the returned X-OAuth-Scopes header contains required_scopes.
    Raises HTTPException(400) if invalid or missing scopes.
    """
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "cloud_ops-pat-validator"
    }
    # Implement retries/backoff for transient network/5xx errors
    max_attempts = 3
    backoff_seconds = 1
    for attempt in range(1, max_attempts + 1):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get("https://api.github.com/user", headers=headers)
        except httpx.RequestError:
            # transient network error: retry
            if attempt < max_attempts:
                await asyncio.sleep(backoff_seconds)
                backoff_seconds *= 2
                continue
            raise HTTPException(status_code=400, detail="Failed to validate token with GitHub (network error)")

        # Retry on server errors
        if 500 <= resp.status_code < 600:
            if attempt < max_attempts:
                await asyncio.sleep(backoff_seconds)
                backoff_seconds *= 2
                continue
            raise HTTPException(status_code=400, detail=f"GitHub token validation failed (status {resp.status_code})")

        if resp.status_code == 401:
            raise HTTPException(status_code=400, detail="Invalid GitHub token")
        if resp.status_code >= 400:
            raise HTTPException(status_code=400, detail=f"GitHub token validation failed (status {resp.status_code})")

        scopes_header = resp.headers.get("X-OAuth-Scopes") or resp.headers.get("x-oauth-scopes", "")
        scopes = [s.strip() for s in scopes_header.split(",") if s.strip()]

        if required_scopes:
            missing = [s for s in required_scopes if s not in scopes]
            if missing:
                raise HTTPException(
                    status_code=400,
                    detail=f"PAT missing required scopes: {', '.join(missing)}. Token scopes: {', '.join(scopes) or '<none>'}"
                )

        # success
        return scopes

    # If we exhausted retries
    raise HTTPException(status_code=400, detail="Failed to validate token with GitHub")


async def GET(request: Request) -> List[PATListItem]:
    with get_session() as session:
        pats = list_pats(session)
        result = []
        for p in pats:
            if not p.id:
                continue
            scopes_list = None
            if getattr(p, 'scopes', None):
                try:
                    if p.scopes:
                        scopes_list = [s.strip() for s in p.scopes.split(',') if s.strip()]
                except Exception:
                    scopes_list = None
            result.append(PATListItem(id=p.id, name=p.name, active=p.active, created_at=p.created_at, last_used_at=p.last_used_at, scopes=scopes_list))
        
        # Enrich with usage data
        # Fetch all CodeSourceControl entries
        from app.db_client.controllers.code_source_control import list_code_source_controls
        repos = list_code_source_controls(session)
        # usage map: pat_id -> [repo_names]
        usage_map = {}
        for r in repos:
            if r.pat_id:
                if r.pat_id not in usage_map:
                    usage_map[r.pat_id] = []
                usage_map[r.pat_id].append(r.name)
        
        for item in result:
            repos_using = usage_map.get(item.id, [])
            item.usage_count = len(repos_using)
            item.used_repos = repos_using
            
        return result


async def POST(request: Request, body: CreatePATRequest):
    f = get_fernet()
    if not f:
        raise HTTPException(status_code=500, detail="Server not configured with GITHUB_PAT_ENCRYPTION_KEY")
    # Validate the token with GitHub before persisting (ensure it is valid and has required scopes)
    # Required scopes can be adjusted here; default to 'repo' which is needed for pull-request access.
    required_scopes = []
    scopes = await validate_pat_token(body.token, required_scopes=required_scopes)
    try:
        token_enc = f.encrypt(body.token.encode('utf-8')).decode('utf-8')
    except Exception as e:
        logger.error(f"Failed to encrypt token: {e}")
        raise HTTPException(status_code=500, detail="Encryption failed")

    with get_session() as session:
        # store scopes as comma-separated string for now
        scopes_str = None
        try:
            scopes_str = ",".join(scopes) if scopes else None
        except Exception:
            scopes_str = None
        pat = create_pat(session, name=body.name, token_encrypted=token_enc, active=body.active, scopes=scopes_str)

        if not pat.id:
            return {"success": False, "detail": "Failed to create PAT" }
        # if created active, ensure it's the active one
        if body.active:
            set_active_pat(session, pat.id)
        return {"success": True, "id": pat.id}


async def DELETE(request: Request, id: int):
    with get_session() as session:
        ok = delete_pat(session, id)
        if not ok:
            raise HTTPException(status_code=404, detail="PAT not found")
        return {"success": True}


class UpdatePATRequest(BaseModel):
    active: Optional[bool] = None
    verify: Optional[bool] = False

async def PUT(request: Request, id: int, body: Optional[UpdatePATRequest] = None):
    """Update PAT status or verify token"""
    
    from app.db_client.controllers.github_pat.github_pat import update_pat, set_active_pat, get_pat
    
    with get_session() as session:
        # Verification Logic
        if body and body.verify:
            pat = get_pat(session, id)
            if not pat:
                 raise HTTPException(status_code=404, detail="PAT not found")
            f = get_fernet()
            if not f:
                 raise HTTPException(status_code=500, detail="Encryption key not configured")
            try:
                token = f.decrypt(pat.token_encrypted.encode('utf-8')).decode('utf-8')
                # Validate
                await validate_pat_token(token)
                return {"success": True, "valid": True, "message": "Token is valid"}
            except Exception as e:
                return {"success": False, "valid": False, "message": str(e)}

        if body and body.active is not None:
            pat = update_pat(session, id, active=body.active)
        else:
             # Fallback to old behavior: just activate
            pat = set_active_pat(session, id)
            
        if not pat:
            raise HTTPException(status_code=404, detail="PAT not found")
        return {"success": True, "id": pat.id}
