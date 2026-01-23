from typing import Any, Dict
from fastapi import Request, Query, HTTPException
from render_relay.utils.get_logger import get_logger
import os
from app.github_client.client.pat_client import get_github_client_from_pat
from github import GithubException, UnknownObjectException

logger = get_logger("SCM Polling Access Route")


async def GET(request: Request, name: str = Query(..., description="full repo name owner/repo")) -> Dict[str, Any]:
    """
    Access-check route for a configured repo.

    Uses the active PAT to perform read checks on repository, PRs, comments and
    collaborator permission for posting comments. Implementation uses the
    PyGithub SDK for repository/pull/comment/permission checks and a single
    short httpx call to fetch `X-OAuth-Scopes` because PyGithub doesn't expose
    that header.
    """
    try:
        gh = get_github_client_from_pat()
    except Exception as e:
        logger.error(f"Failed to create PyGithub client: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize GitHub client")

    owner_repo = name
    result: Dict[str, Any] = {
        "repo": owner_repo,
        "accessible": False,
        "can_read_pulls": False,
        "can_read_comments": False,
        "can_post_comments": False,
        "user": None,
        "scopes": [],
    }

    try:
        user_login =  gh.get_user().login
        result["user"] = user_login
    except GithubException as e:
        logger.error(f"PyGithub failed getting user: {e}")
        raise HTTPException(status_code=502, detail="Failed to validate PAT with GitHub via SDK")

    # repo existence / read access
    try:
        repo = gh.get_repo(f"{user_login}/{owner_repo}")
        result["accessible"] = True
    except UnknownObjectException as e:
        # repository not found or no access
        logger.error(f"UnknownObjectException: {owner_repo}: {e}")
        return result
    except GithubException as e:
        logger.error(f"PyGithub failed getting repo {owner_repo}: {e}")
        raise HTTPException(status_code=502, detail="Failed to query repository via GitHub SDK")

    # check ability to read pulls
    try:
        # get first open PR (if any)
        pr_s = repo.get_pulls(state="open")
        pr = [p for p in pr_s][:1]
        result["can_read_pulls"] = True
        if pr:
            # check comments read on this PR (issue comments)
            try:
                has_comment = pr[0].get_issue_comments()
                if has_comment:
                    result["can_read_comments"] = True
                permission = repo.get_collaborator_permission(user_login)
                result["scopes"] = [permission]
                if permission in ["admin", "write", "maintain", "triage", "read"]:
                    result["can_post_comments"] = True
                else:
                    result["can_post_comments"] = False
            except GithubException as e:
                # if comments aren't readable, leave can_read_comments False
                logger.warning(f"GithubException: {owner_repo}: {e}")
                pass
    except GithubException as e:
        logger.warning(f"Failed reading pulls for {owner_repo}: {e}")

    return result
