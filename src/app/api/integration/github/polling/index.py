import os
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import Request, HTTPException, Query, BackgroundTasks
import httpx
from pydantic import BaseModel, Field
from app.github_client.core import AllowedRepoUtils
from render_relay.utils import load_settings
from app.db_client.db import get_session
from app.db_client.controllers.source_code_build import (
    SourceCodeBuildWithLogsType,
)
from app.db_client.controllers.github_pat.github_pat import (
    list_pats,
)
from render_relay.utils.get_logger import get_logger
from app.db_client.db import get_session
from app.github_client.poller import get_repo_poller

logger = get_logger("SCM Polling API")

# Module-level background poller/task references so we can start/stop at runtime
_background_poller_task: Optional[asyncio.Task] = None


class PollingConfigRequest(BaseModel):
    enabled: bool = Field(..., description="Enable or disable SCM polling")
    interval_seconds: int = Field(..., description="Poll interval in seconds")


class PollingStatusResponse(BaseModel):
    status: str = Field("healthy", description="Service status")
    enabled: bool = Field(..., description="Whether polling is enabled")
    has_pat: bool = Field(..., description="Whether a GITHUB_PAT is configured")
    interval_seconds: int = Field(..., description="Current poll interval seconds")
    allowed_repositories: Dict[str, str] = Field(..., description="Allowed repositories map")
    allowed_branches: Dict[str, List[str]] = Field(..., description="Allowed branches per repo")
    builds: Dict[str, Dict[str, Optional[SourceCodeBuildWithLogsType]]] = Field(..., description="Last builds per repo/branch")
    timestamp: str = Field(..., description="Current timestamp")


async def GET(request: Request) -> PollingStatusResponse:
    """Return polling status and allowed repos/branches/builds."""
    utils = AllowedRepoUtils()
    settings = load_settings()
    
    with get_session() as session:
        ALLOWED_REPOSITORIES, ALLOWED_BRANCHES, DEPLOYMENTS = utils.get_all()
        builds = utils.get_last_builds_for_all_repo_branches()
        enabled = settings.get('SCM_POLLING_ENABLED', 'false').lower() in ('1', 'true', 'yes')
        interval = int(settings.get('SCM_POLL_INTERVAL_SECONDS', '300'))
        pats = list_pats(session)
        has_pat = any(p.active for p in pats)
        return PollingStatusResponse(
            status="healthy",
            enabled=enabled,
            has_pat=has_pat,
            interval_seconds=interval,
            allowed_repositories=ALLOWED_REPOSITORIES,
            allowed_branches=ALLOWED_BRANCHES,
            builds=builds,
            timestamp=datetime.now().isoformat()
        )


async def PUT(request: Request, body: PollingConfigRequest,background_tasks: BackgroundTasks):
    """Update polling configuration for the running process (in-memory env).

    Note: changes are applied to the running process environment only; update your deployment
    configuration to persist across restarts.
    """
    try:
        os.environ['SCM_POLLING_ENABLED'] = 'true' if body.enabled else 'false'
        os.environ['SCM_POLL_INTERVAL_SECONDS'] = str(body.interval_seconds)

        # If enabling, try to start background poller in this running process.
        # If disabling, stop any running background poller task.
        if body.enabled:
            if get_repo_poller()._stop == False:
                return {"success": True, "message": "Polling already enabled."}
            # Start run_forever as a background task
            background_tasks.add_task(get_repo_poller().run_forever)
            return {"success": True, "message": "Polling enabled and background poller started."}
        else:
            background_tasks.add_task(get_repo_poller().stop)
            return {"success": True, "message": "Polling disabled for this process."}

    except Exception as e:
        logger.error(f"Failed to update polling config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def POST(request: Request):
    try:
        poller = get_repo_poller()
        # Schedule run_once asynchronously and return immediately
        asyncio.create_task(poller.run_once())
        return {"success": True, "message": "Manual poll queued."}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to trigger manual poll: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def DELETE(request: Request, name: str):
    """Proxy delete to allowed-repo utils (keeps same contract as webhook DELETE)."""
    try:
        utils = AllowedRepoUtils()
        utils.delete_repository(repo_name=name)
        return {"success": True, "message": f"Repository {name} and its branches deleted."}
    except Exception as e:
        logger.error(f"Failed to delete repository {name}: {e}")
        return {"success": False, "message": str(e)}


async def middleware(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response
    
