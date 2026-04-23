from typing import List, Optional
from datetime import datetime
import asyncio
from fastapi import Request, HTTPException
from pydantic import BaseModel
from app.db_client.db import get_session
from app.db_client.controllers.github_pat.github_pat import (
    create_credential,
    list_credentials,
    delete_credential,
    set_active_credential,
    get_credential,
    update_credential
)
from render_relay.utils.get_logger import get_logger
import httpx
from app.utils.get_fernet import get_fernet

logger = get_logger("Credentials API")


class CreateCredentialRequest(BaseModel):
    name: str
    token: str
    provider: str = "github"  # github, npm, pypi
    active: bool = False


class CredentialListItem(BaseModel):
    id: int
    name: str
    provider: str
    active: bool
    created_at: datetime
    last_used_at: Optional[datetime]
    scopes: Optional[List[str]] = None
    usage_count: int = 0
    used_repos: List[str] = []

async def validate_github_token(token: str, required_scopes: Optional[List[str]] = None) -> List[str]:
    """Validate GitHub token and return scopes."""
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "User-Agent": "cloud_ops-pat-validator"
    }
    max_attempts = 3
    backoff_seconds = 1
    for attempt in range(1, max_attempts + 1):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get("https://api.github.com/user", headers=headers)
        except httpx.RequestError:
            if attempt < max_attempts:
                await asyncio.sleep(backoff_seconds)
                backoff_seconds *= 2
                continue
            raise HTTPException(status_code=400, detail="Failed to validate token with GitHub (network error)")

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
                    detail=f"PAT missing required scopes: {', '.join(missing)}"
                )
        return scopes

    raise HTTPException(status_code=400, detail="Failed to validate token with GitHub")


async def validate_npm_token(token: str) -> str:
    """Validate NPM token using the whoami endpoint."""
    headers = {"Authorization": f"Bearer {token}"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get("https://registry.npmjs.org/-/whoami", headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            return data.get("username", "verified-user")
        elif resp.status_code == 401:
            raise HTTPException(status_code=400, detail="Invalid NPM token")
        else:
            raise HTTPException(status_code=400, detail=f"NPM validation failed (status {resp.status_code})")
    except httpx.RequestError:
        raise HTTPException(status_code=400, detail="Failed to reach NPM registry")


async def validate_pypi_token(token: str) -> str:
    """Validate PyPI token using the warehouse API."""
    if not token.startswith("pypi-"):
        raise HTTPException(status_code=400, detail="Invalid PyPI token format. Must start with 'pypi-'")
    
    auth = ("__token__", token)
    headers = {
        "User-Agent": "CloudOps-pypi-validator/1.0",
        "Accept": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://pypi.org/hub/api/whoami/",
                auth=auth,
                headers=headers
            )
            
            if resp.status_code == 200:
                return "verified-account"
            elif resp.status_code == 401:
                raise HTTPException(status_code=400, detail="Invalid PyPI token")
            elif resp.status_code == 403:
                return "format-verified"
            else:
                return "format-verified"
    except httpx.RequestError:
        return "format-verified"


async def GET(request: Request) -> List[CredentialListItem]:
    with get_session() as session:
        credentials = list_credentials(session)
        result = []
        for c in credentials:
            if not c.id:
                continue
            scopes_list = None
            if getattr(c, 'scopes', None) and c.scopes:
                scopes_list = [s.strip() for s in c.scopes.split(',') if s.strip()]
            
            result.append(CredentialListItem(
                id=c.id, 
                name=c.name, 
                provider=c.provider,
                active=c.active, 
                created_at=c.created_at, 
                last_used_at=c.last_used_at, 
                scopes=scopes_list
            ))
        
        # Enrich with usage data
        from app.db_client.controllers.code_source_control import list_code_source_controls
        repos = list_code_source_controls(session)
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


async def POST(request: Request, body: CreateCredentialRequest):
    f = get_fernet()
    if not f:
        raise HTTPException(status_code=500, detail="Server not configured with encryption key")
    
    scopes = []
    if body.provider == "github":
        # Specific validation for GitHub
        if not (body.token.startswith("ghp_") or body.token.startswith("github_pat_")):
             raise HTTPException(status_code=400, detail="GitHub token must start with 'ghp_' or 'github_pat_'")
        scopes = await validate_github_token(body.token)
    elif body.provider == "npm":
        await validate_npm_token(body.token)
    elif body.provider == "pypi":
        await validate_pypi_token(body.token)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported provider: {body.provider}")

    try:
        token_enc = f.encrypt(body.token.encode('utf-8')).decode('utf-8')
    except Exception as e:
        logger.error(f"Failed to encrypt token: {e}")
        raise HTTPException(status_code=500, detail="Encryption failed")

    with get_session() as session:
        scopes_str = ",".join(scopes) if scopes else None
        credential = create_credential(
            session, 
            name=body.name, 
            token_encrypted=token_enc, 
            provider=body.provider,
            active=body.active, 
            scopes=scopes_str
        )

        if not credential.id:
            raise HTTPException(status_code=500, detail="Failed to create credential")
            
        if body.active:
            set_active_credential(session, credential.id)
            
        return {"success": True, "id": credential.id}


async def DELETE(request: Request, id: int):
    with get_session() as session:
        ok = delete_credential(session, id)
        if not ok:
            raise HTTPException(status_code=404, detail="Credential not found")
        return {"success": True}


class UpdateCredentialRequest(BaseModel):
    active: Optional[bool] = None
    verify: Optional[bool] = False

async def PUT(request: Request, id: int, body: Optional[UpdateCredentialRequest] = None):
    with get_session() as session:
        if body and body.verify:
            credential = get_credential(session, id)
            if not credential:
                 raise HTTPException(status_code=404, detail="Credential not found")
            
            f = get_fernet()
            if not f:
                 raise HTTPException(status_code=500, detail="Encryption key not configured")
            
            try:
                token = f.decrypt(credential.token_encrypted.encode('utf-8')).decode('utf-8')
                if credential.provider == "github":
                    await validate_github_token(token)
                elif credential.provider == "npm":
                    await validate_npm_token(token)
                elif credential.provider == "pypi":
                    await validate_pypi_token(token)
                elif not token.strip():
                    raise Exception("Token is empty")
                
                return {"success": True, "valid": True, "message": "Token is valid"}
            except Exception as e:
                return {"success": False, "valid": False, "message": str(e)}

        if body and body.active is not None:
            credential = update_credential(session, id, active=body.active)
        else:
            credential = set_active_credential(session, id)
            
        if not credential:
            raise HTTPException(status_code=404, detail="Credential not found")
        return {"success": True, "id": credential.id}
