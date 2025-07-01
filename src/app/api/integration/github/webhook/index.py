import hmac
import hashlib
import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime
from fastapi import Request, HTTPException, Header, BackgroundTasks
from pydantic import BaseModel, Field
from app.github_client.config import get_config
from app.github_client.handler import PullRequestHandler
from app.github_client.allowed_repo import AllowedRepoUtils
from app.db_client.controllers.source_code_build import (
    SourceCodeBuildWithLogsType
)
import logging
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for GitHub webhook payload
class GitHubUser(BaseModel):
    """GitHub user model"""
    login: str
    id: int
    node_id: str
    avatar_url: str
    gravatar_id: str
    url: str
    html_url: str
    followers_url: str
    following_url: str
    gists_url: str
    starred_url: str
    subscriptions_url: str
    organizations_url: str
    repos_url: str
    events_url: str
    received_events_url: str
    type: str
    user_view_type: str
    site_admin: bool


class GitHubRepository(BaseModel):
    """GitHub repository model"""
    id: int
    node_id: str
    name: str
    full_name: str
    private: bool
    owner: GitHubUser
    html_url: str
    description: Optional[str] = None
    fork: bool
    url: str
    forks_url: str
    keys_url: str
    collaborators_url: str
    teams_url: str
    hooks_url: str
    issue_events_url: str
    events_url: str
    assignees_url: str
    branches_url: str
    tags_url: str
    blobs_url: str
    git_tags_url: str
    git_refs_url: str
    trees_url: str
    statuses_url: str
    languages_url: str
    stargazers_url: str
    contributors_url: str
    subscribers_url: str
    subscription_url: str
    commits_url: str
    git_commits_url: str
    comments_url: str
    issue_comment_url: str
    contents_url: str
    compare_url: str
    merges_url: str
    archive_url: str
    downloads_url: str
    issues_url: str
    pulls_url: str
    milestones_url: str
    notifications_url: str
    labels_url: str
    releases_url: str
    deployments_url: str
    created_at: str
    updated_at: str
    pushed_at: str
    git_url: str
    ssh_url: str
    clone_url: str
    svn_url: str
    homepage: Optional[str] = None
    size: int
    stargazers_count: int
    watchers_count: int
    language: Optional[str] = None
    has_issues: bool
    has_projects: bool
    has_downloads: bool
    has_wiki: bool
    has_pages: bool
    has_discussions: bool
    forks_count: int
    mirror_url: Optional[str] = None
    archived: bool
    disabled: bool
    open_issues_count: int
    license: Optional[Dict[str, Any]] = None
    allow_forking: Optional[bool] = None
    is_template: Optional[bool] = None
    web_commit_signoff_required: Optional[bool] = None
    topics: Optional[List[str]] = None
    visibility: Optional[str] = None
    forks: Optional[int] = None
    open_issues: Optional[int] = None
    watchers: Optional[int] = None
    default_branch: str
    allow_squash_merge: Optional[bool] = None
    allow_merge_commit: Optional[bool] = None
    allow_rebase_merge: Optional[bool] = None
    allow_auto_merge: Optional[bool] = None
    delete_branch_on_merge: Optional[bool] = None
    allow_update_branch: Optional[bool] = None
    use_squash_pr_title_as_default: Optional[bool] = None
    squash_merge_commit_message: Optional[str] = None
    squash_merge_commit_title: Optional[str] = None
    merge_commit_message: Optional[str] = None
    merge_commit_title: Optional[str] = None


class PullRequestHead(BaseModel):
    """Pull request head model"""
    label: str
    ref: str
    sha: str
    user: GitHubUser
    repo: GitHubRepository


class PullRequestLinks(BaseModel):
    """Pull request links model"""
    self: Dict[str, str]
    html: Dict[str, str]
    issue: Dict[str, str]
    comments: Dict[str, str]
    review_comments: Dict[str, str]
    review_comment: Dict[str, str]
    commits: Dict[str, str]
    statuses: Dict[str, str]


class PullRequest(BaseModel):
    """Pull request model"""
    url: str
    id: int
    node_id: str
    html_url: str
    diff_url: str
    patch_url: str
    issue_url: str
    number: int
    state: str
    locked: bool
    title: str
    user: GitHubUser
    body: Optional[str] = None
    created_at: str
    updated_at: str
    closed_at: Optional[str] = None
    merged_at: Optional[str] = None
    merge_commit_sha: Optional[str] = None
    assignee: Optional[GitHubUser] = None
    assignees: List[GitHubUser]
    requested_reviewers: List[Any]
    requested_teams: List[Any]
    labels: List[Any]
    milestone: Optional[Any] = None
    draft: bool
    commits_url: str
    review_comments_url: str
    review_comment_url: str
    comments_url: str
    statuses_url: str
    head: PullRequestHead
    base: PullRequestHead
    _links: PullRequestLinks
    author_association: str
    auto_merge: Optional[Any] = None
    active_lock_reason: Optional[str] = None
    merged: bool
    mergeable: Optional[bool] = None
    rebaseable: Optional[bool] = None
    mergeable_state: str
    merged_by: Optional[GitHubUser] = None
    comments: int
    review_comments: int
    maintainer_can_modify: bool
    commits: int
    additions: int
    deletions: int
    changed_files: int


class Installation(BaseModel):
    """GitHub App installation model"""
    id: int
    node_id: str


class PullRequestWebhookPayload(BaseModel):
    """Complete pull request webhook payload model"""
    action: str
    number: int
    pull_request: PullRequest
    repository: GitHubRepository
    sender: GitHubUser
    installation: Installation


class GenericEventResponse(BaseModel):
    """Response model for generic events"""
    event_type: str = Field(..., description="Event type")
    repository: str = Field(..., description="Repository name")
    action: Optional[str] = Field(None, description="Action performed")
    actor: str = Field(..., description="Actor (user) who triggered the event")
    message: str = Field(..., description="Human readable message")
    timestamp: str = Field(..., description="Event timestamp")

class DeploymentStageInfo(BaseModel):
    tag: str
    pr_url: str
    jira: str

class LastAndCurrentDeploymentInfo(BaseModel):
    stage: DeploymentStageInfo
    dev: DeploymentStageInfo
    prod: DeploymentStageInfo

class DeploymentInfo(BaseModel):
    namespace: str
    deployment_name: str
    last_deployment: LastAndCurrentDeploymentInfo
    current_deployment: LastAndCurrentDeploymentInfo

class HealthCheckResponse(BaseModel):
    """Response model for health check endpoint"""
    status: str = Field("healthy", description="Service status")
    supported_events: List[str] = Field(..., description="List of supported event types")
    allowed_repositories: Dict[str, str] = Field(..., description="Mapping of repository names to repository identifiers")
    allowed_branches: Dict[str, List[str]] = Field(..., description="Mapping of repository names to allowed branch lists")
    deployments: Optional[Dict[str, DeploymentInfo]] = Field(None, description="Mapping of repository names to deployment info")
    timestamp: str = Field(..., description="Current timestamp")
    builds: Dict[str, Dict[str, Optional[SourceCodeBuildWithLogsType]]]

PR_SUPPORTED_ACTION = [
    "opened",
    "closed",
    "reopened"
]

SUPPORTED_EVENTS = [
    "pull_request",
]

WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET", "somedata")

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify GitHub webhook signature"""
    if not signature:
        return False
    
    if not signature.startswith("sha256="):
        return False
    
    expected_signature = signature[7:]
    calculated_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(calculated_signature, expected_signature)

def extract_branch_name(ref: str) -> str:
    """Extract branch name from ref string"""
    if not ref:
        return ""
    return ref.split("/")[-1]

def is_valid_payload(payload: PullRequestWebhookPayload) -> bool:
    """Validate payload against allowed repositories and branches"""
    current_branch_name = extract_branch_name(payload.pull_request.base.ref)
    current_repo_name = payload.repository.name
    utils = AllowedRepoUtils()
    all_data = utils.get_all()
    ALLOWED_REPOSITORIES = all_data[0]
    ALLOWED_BRANCHES = all_data[1]
    # Check if repository is allowed and get its allowed branches
    if current_repo_name not in ALLOWED_REPOSITORIES:
        return False
    
    # Check if branch is allowed for this repository
    allowed_branches_for_repo = ALLOWED_BRANCHES.get(current_repo_name, [])
    return current_branch_name in allowed_branches_for_repo

async def POST(
    request: Request,
    background:BackgroundTasks,
    x_github_event: str = Header(None),
    x_hub_signature_256: str = Header(None)
):
    """GitHub webhook endpoint"""
    try:
        # Read request body
        body = await request.body()
        
        # Verify signature
        if not verify_signature(body, x_hub_signature_256, WEBHOOK_SECRET):
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Parse JSON payload
        payload_data = json.loads(body)
        
        # Validate event type
        if not x_github_event:
            raise HTTPException(status_code=400, detail="Unsupported event type")
        
        # Parse payload with Pydantic
        try:
            webhook_payload = PullRequestWebhookPayload(**payload_data)
        except Exception as e:
            print(f"Validation error: {e}")
            # Try to provide more helpful error information
            if "validation error" in str(e).lower():
                raise HTTPException(status_code=400, detail=f"Invalid payload structure: {str(e)}")
            else:
                raise HTTPException(status_code=400, detail=f"Failed to parse payload: {str(e)}")
        
        # Validate payload
        if not is_valid_payload(webhook_payload):
            raise HTTPException(status_code=400, detail="Repository or branch not allowed")
        
        # Handle pull request events
        if x_github_event == "pull_request":
            event_type = f"pull_request.{webhook_payload.action}"
            
            # Convert Pydantic model to dict for the handler
            payload_dict = webhook_payload.model_dump()
            
            if webhook_payload.action in PR_SUPPORTED_ACTION:
                # Handle the pull request event in background
                """Legacy function that maintains the original interface."""
                config = get_config()
                handler = PullRequestHandler(config)
                
                # Add the Docker build process to background tasks
                background.add_task(handler.handle_pull_request_event, payload_dict)
                logger.info("Docker build task added to background queue")
                
                # Return immediate response while processing continues in background
                return GenericEventResponse(
                    event_type=event_type,
                    repository=webhook_payload.repository.full_name,
                    action=webhook_payload.action,
                    actor=webhook_payload.sender.login,
                    message=f"Pull request {event_type} received and queued for processing. Docker build will start shortly.",
                    timestamp=datetime.now().isoformat()
                )
            else:
                # For other actions (like closed), return immediate response
                return GenericEventResponse(
                    event_type=event_type,
                    repository=webhook_payload.repository.full_name,
                    action=webhook_payload.action,
                    actor=webhook_payload.sender.login,
                    message=f"Successfully processed {event_type} for PR #{webhook_payload.number}",
                    timestamp=datetime.now().isoformat()
                )
                
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def GET(request: Request) -> HealthCheckResponse:
    """Health check endpoint"""
    utils = AllowedRepoUtils()
    ALLOWED_REPOSITORIES, ALLOWED_BRANCHES, DEPLOYMENTS = utils.get_all()
    builds = utils.get_last_builds_for_all_repo_branches()
    return HealthCheckResponse(
        status="healthy",
        supported_events=SUPPORTED_EVENTS,
        allowed_repositories=ALLOWED_REPOSITORIES,
        allowed_branches=ALLOWED_BRANCHES,
        deployments=DEPLOYMENTS,
        builds=builds,
        timestamp=datetime.now().isoformat()
    )

class UpdateBranchesRequest(BaseModel):
    repo_name: str
    branches: List[str]

async def PUT(request: Request,body:UpdateBranchesRequest):
    try:
        utils = AllowedRepoUtils()
        utils.update_branches(body.repo_name, body.branches)
        return {"success": True, "message": f"Branches for {body.repo_name} updated."}
    except KeyError as e:
        return {"success": False, "message": str(e)}
    
async def DELETE(request:Request,name:str):
    try:
        utils = AllowedRepoUtils()
        utils.delete_repository(repo_name=name)
        return {"success": True, "message": f"Repository {name} and its branches deleted."}
    except Exception as e:
        return {"success": True,"message":str(e)}

async def middleware(request: Request, call_next):
    """Middleware for logging and validation"""
    # Log request
    print(f"[{datetime.now()}] {request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    print(f"[{datetime.now()}] Response: {response.status_code}")
    
    return response