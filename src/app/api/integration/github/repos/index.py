import asyncio
from typing import List, Optional
from fastapi import Request, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from app.github_client.core.allowed_repo import AllowedRepoUtils
from app.db_client.controllers.code_source_control.code_source_control import update_code_source_control_status
from render_relay.utils.get_logger import get_logger

logger = get_logger("GitHub Repos API")

class BranchConfigRequest(BaseModel):
    branch: str = Field(..., description="Branch name")
    registry_id: Optional[int] = Field(None, description="Branch-specific Registry ID")
    docker_config_id: Optional[int] = Field(None, description="Branch-specific Docker Engine ID")

class RepoRequest(BaseModel):
    name: str = Field(..., description="Repository name (e.g. 'owner/repo')")
    branches: List[BranchConfigRequest] = Field(..., description="List of branches and their specific configs")
    pat_id: Optional[int] = Field(None, description="ID of the PAT to use for this repository")
    registry_id: Optional[int] = Field(None, description="Default Registry ID for this repo")
    docker_config_id: Optional[int] = Field(None, description="Default Docker Engine ID for this repo")

async def POST(request: Request, body: RepoRequest):
    """Add a new repository to the allowed list."""
    try:
        utils = AllowedRepoUtils()
        # repo_id is ignored by add_repository implementation, so we just pass name
        utils.add_repository(
            repo_name=body.name, 
            repo_id=body.name, 
            branches=[b.dict() for b in body.branches], 
            pat_id=body.pat_id, 
            registry_id=body.registry_id,
            docker_config_id=body.docker_config_id
        )
        return {"success": True, "message": f"Repository {body.name} added."}
    except Exception as e:
        logger.error(f"Failed to add repository {body.name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def PUT(request: Request, body: RepoRequest):
    """Update branches for an existing repository."""
    try:
        utils = AllowedRepoUtils()
        utils.update_branches(
            repo_name=body.name, 
            branches=[b.dict() for b in body.branches], 
            pat_id=body.pat_id, 
            registry_id=body.registry_id,
            docker_config_id=body.docker_config_id
        )
        return {"success": True, "message": f"Repository {body.name} updated."}
    except Exception as e:
        logger.error(f"Failed to update repository {body.name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def DELETE(request: Request, name: str, background_tasks: BackgroundTasks):
    """Delete a repository and its configured branches."""
    try:
        utils = AllowedRepoUtils()
        repo_data = utils.get_repository(name)
        if not repo_data:
            raise HTTPException(status_code=404, detail="Repository not found")
            
        # Protect against triggering the same thing again
        if repo_data.get("status") == "terminating":
            return {"success": True, "message": f"Repository {name} is already terminating."}
        
        # Set status to terminating
        update_code_source_control_status(utils.session, repo_data["repo_id"], "terminating")
        
        # Add background task
        background_tasks.add_task(utils.perform_full_deletion, name)
        
        return {"success": True, "message": f"Repository {name} deletion started."}
    except Exception as e:
        logger.error(f"Failed to start deletion for repository {name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
