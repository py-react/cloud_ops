
import asyncio
from typing import List, Optional
from fastapi import Request, HTTPException
from pydantic import BaseModel, Field
from app.github_client.core import AllowedRepoUtils
from render_relay.utils.get_logger import get_logger

logger = get_logger("GitHub Repos API")

class RepoRequest(BaseModel):
    name: str = Field(..., description="Repository name (e.g. 'owner/repo')")
    branches: List[str] = Field(..., description="List of branches to monitor")
    pat_id: Optional[int] = Field(None, description="ID of the PAT to use for this repository")

async def POST(request: Request, body: RepoRequest):
    """Add a new repository to the allowed list."""
    try:
        utils = AllowedRepoUtils()
        # repo_id is ignored by add_repository implementation, so we just pass name
        utils.add_repository(repo_name=body.name, repo_id=body.name, branches=body.branches, pat_id=body.pat_id)
        return {"success": True, "message": f"Repository {body.name} added."}
    except Exception as e:
        logger.error(f"Failed to add repository {body.name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def PUT(request: Request, body: RepoRequest):
    """Update branches for an existing repository."""
    try:
        utils = AllowedRepoUtils()
        utils.update_branches(repo_name=body.name, branches=body.branches, pat_id=body.pat_id)
        return {"success": True, "message": f"Repository {body.name} updated."}
    except Exception as e:
        logger.error(f"Failed to update repository {body.name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def DELETE(request: Request, name: str):
    """Delete a repository and its configured branches."""
    try:
        utils = AllowedRepoUtils()
        utils.delete_repository(repo_name=name)
        return {"success": True, "message": f"Repository {name} deleted."}
    except Exception as e:
        logger.error(f"Failed to delete repository {name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
