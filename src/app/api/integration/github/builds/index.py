from fastapi import Request
from app.github_client.core import AllowedRepoUtils

async def GET(request:Request,repo_name:str,branch_name:str):
    utils = AllowedRepoUtils()
    return utils.get_builds(base_branch=branch_name, repo_name=repo_name) or []