from typing import Optional
from fastapi import Request
from app.github_client.core import AllowedRepoUtils

async def GET(request:Request,repo_name:str,branch_name:Optional[str] = None):
    utils = AllowedRepoUtils()
    return utils.get_builds(repo_name=repo_name, branch_name=branch_name) or []