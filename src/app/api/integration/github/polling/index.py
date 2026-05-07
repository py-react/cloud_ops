import os
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import Request, HTTPException, Query, BackgroundTasks
import httpx
from pydantic import BaseModel, Field
from app.github_client.core import AllowedRepoUtils
from kiwijs.utils import load_settings
from app.db_client.db import get_session
from app.db_client.controllers.source_code_build import (
    SourceCodeBuildWithLogsType,
)
from app.db_client.controllers.github_pat.github_pat import (
    list_credentials,
)
from kiwijs.utils.get_logger import get_logger
from app.github_client.poller import get_polling_manager

logger = get_logger("SCM Polling API")


class PollingConfigRequest(BaseModel):
    enabled: bool = Field(..., description="Enable or disable SCM polling")
    interval_seconds: Optional[int] = Field(None, description="Poll interval in seconds")
    repo_name: Optional[str] = Field(None, description="Specific repository to toggle polling for")


class PollingStatusResponse(BaseModel):
    status: str = Field("healthy", description="Service status")
    enabled: bool = Field(..., description="Whether polling is enabled (deprecated globally)")
    has_pat: bool = Field(..., description="Whether a GITHUB_PAT is configured")
    interval_seconds: int = Field(..., description="Current poll interval seconds")
    allowed_repositories: Dict[str, str] = Field(..., description="Allowed repositories map")
    allowed_branches: Dict[str, List[Dict[str, Any]]] = Field(..., description="Allowed branches with specific configs")
    repo_pats: Dict[str, Optional[int]] = Field(default={}, description="Map of repo name to PAT ID")
    repo_polling_enabled: Dict[str, bool] = Field(default={}, description="Map of repo name to polling status")
    repo_registries: Dict[str, Optional[int]] = Field(default={}, description="Map of repo name to Registry ID")
    repo_engines: Dict[str, Optional[int]] = Field(default={}, description="Map of repo name to Docker Engine ID")
    builds: Dict[str, Dict[str, Optional[SourceCodeBuildWithLogsType]]] = Field(..., description="Last builds per repo/branch")
    timestamp: str = Field(..., description="Current timestamp")


async def GET(request: Request) -> PollingStatusResponse:
    """Return polling status and allowed repos/branches/builds."""
    utils = AllowedRepoUtils()
    settings = load_settings()
    
    with get_session() as session:
        # get_all returns (result, branches_with_config, deployments, repo_pats, repo_registries, repo_engines, repo_polling_enabled)
        res_map, branches, _, repo_pats, repo_registries, repo_engines, repo_polling_enabled = utils.get_all()
        builds = utils.get_last_builds_for_all_repo_branches()
        
        # enabled flag is now just "is any repo polling?" for compatibility
        enabled = any(repo_polling_enabled.values())
        interval = int(settings.get('SCM_POLL_INTERVAL_SECONDS', '300'))
        credentials = list_credentials(session)
        has_pat = any(p.active for p in credentials)
        
        return PollingStatusResponse(
            status="healthy",
            enabled=enabled,
            has_pat=has_pat,
            interval_seconds=interval,
            allowed_repositories=res_map,
            allowed_branches=branches,
            repo_pats=repo_pats,
            repo_polling_enabled=repo_polling_enabled,
            repo_registries=repo_registries,
            repo_engines=repo_engines,
            builds=builds,
            timestamp=datetime.now().isoformat()
        )


async def PUT(request: Request, body: PollingConfigRequest, background_tasks: BackgroundTasks):
    """Update polling configuration. Handles both global interval and per-repo toggling."""
    try:
        utils = AllowedRepoUtils()
        manager = get_polling_manager()

        if body.interval_seconds:
            os.environ['SCM_POLL_INTERVAL_SECONDS'] = str(body.interval_seconds)
            manager.update_config(interval=body.interval_seconds)

        if body.repo_name:
            # Individual toggle
            utils.update_polling_status(body.repo_name, body.enabled)
            logger.info(f"Toggled polling for {body.repo_name} to {body.enabled}")
        else:
            # Global fallback - could enable/disable all if needed, 
            # but usually we want individual. For now, let's just log it.
            logger.warning("Global polling toggle received without repo_name. Ignoring to prevent accidental bulk change.")

        # Always sync pollers after a change
        background_tasks.add_task(manager.sync_pollers)
        
        return {"success": True, "message": "Polling configuration updated and synced."}

    except Exception as e:
        logger.error(f"Failed to update polling config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def POST(request: Request, background_tasks: BackgroundTasks):
    """Trigger a manual poll for all currently enabled repositories."""
    try:
        manager = get_polling_manager()
        # Ensure pollers are synced before running once
        await manager.sync_pollers()
        
        for poller in manager._pollers.values():
            background_tasks.add_task(poller.run_once)
            
        return {"success": True, "message": "Manual poll queued for all active repositories."}
    except Exception as e:
        logger.error(f"Failed to trigger manual poll: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def DELETE(request: Request, name: str, background_tasks: BackgroundTasks):
    """Proxy delete and sync pollers."""
    try:
        utils = AllowedRepoUtils()
        utils.delete_repository(repo_name=name)
        
        # Cleanup pollers if no longer needed
        manager = get_polling_manager()
        background_tasks.add_task(manager.sync_pollers)
        
        return {"success": True, "message": f"Repository {name} deleted and polling synced."}
    except Exception as e:
        logger.error(f"Failed to delete repository {name}: {e}")
        return {"success": False, "message": str(e)}


async def middleware(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response
