import logging
import time
import datetime
from typing import Dict, Any, Optional
from io import BytesIO
import requests
import urllib3
import re

from app.docker_client import clientContext
from .models import GitHubAppConfig
from .client import GitHubAppClient
from .commenter import PRCommenter
from .detector import Detector
from .utils import generate_image_name, decode_github_content
from app.db_client.db import get_session
from app.db_client.controllers.source_code_build.source_code_build import add_build_log, create_source_code_build, get_source_code_build, update_source_code_build_status, safe_add_build_log
from app.db_client.models.source_code_build.types import SourceCodeBuildType
from render_relay.utils import load_settings
from docker.errors import APIError, ImageNotFound

client = clientContext.client
logger = logging.getLogger(__name__)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def clean_image_name(name: str) -> str:
    """Remove @sha256:<digest> if present"""
    return re.sub(r'@sha256:[a-f0-9]{64}$', '', name)


async def _verify_registry_connectivity(registry_url: str) -> bool:
    """Test if registry is accessible"""
    try:
        registry_api_url = f"http://{registry_url}/v2/_catalog"
        response = requests.get(registry_api_url, timeout=10, verify=False)
        return response.status_code == 200
    except Exception:
        return False


async def _push_image_to_registry(docker_client, registry_url: str, repo_name: str, source_tag: str):
    """Push image to registry and collect progress"""
    push_logs = []
    
    push_stream = docker_client.images.push(
        repository=f"{registry_url}/{repo_name}",
        tag=source_tag,
        stream=True,
        decode=True,
    )
    
    for line in push_stream:
        if 'status' in line:
            status = line['status']
            layer_id = line.get('id', '')
            
            if layer_id:
                push_logs.append(f"{layer_id[:12]}: {status}")
            else:
                push_logs.append(status)
        
        if 'error' in line:
            raise APIError(line['error'])
    
    return push_logs


async def _verify_push_success(registry_url: str, repo_name: str, source_tag: str):
    """Verify image was successfully pushed to registry"""
    try:
        # Check repository exists
        catalog_url = f"http://{registry_url}/v2/_catalog"
        response = requests.get(catalog_url, timeout=10, verify=False)
        
        if response.status_code != 200:
            return False, "Cannot access registry catalog"
        
        repositories = response.json().get('repositories', [])
        if repo_name not in repositories:
            return False, f"Repository '{repo_name}' not found in registry"
        
        # Check tag exists
        tags_url = f"http://{registry_url}/v2/{repo_name}/tags/list"
        tags_response = requests.get(tags_url, timeout=10, verify=False)
        
        if tags_response.status_code != 200:
            return False, "Cannot retrieve tags"
        
        available_tags = tags_response.json().get('tags', [])
        if source_tag not in available_tags:
            return False, f"Tag '{source_tag}' not found in available tags"
        
        return True, "Image successfully verified in registry"
    
    except Exception as e:
        return False, f"Verification failed: {str(e)}"


def _update_build_time_and_status(session, build_id: int, start_time: datetime.datetime, status: str):
    """Update build status and calculate time taken"""
    try:
        build_obj = get_source_code_build(session, build_id)
        if build_obj:
            end_time = datetime.datetime.utcnow()
            time_taken_seconds = (end_time - start_time).total_seconds()
            build_obj.time_taken = int(time_taken_seconds)
            session.commit()
        update_source_code_build_status(session, build_id, status)
    except Exception as e:
        logger.error(f"Failed to update build time: {e}")
        # Still update status even if time update fails
        update_source_code_build_status(session, build_id, status)


class PullRequestHandler:
    """
    Main handler for pull request events.
    
    This handler processes GitHub pull request webhook events and performs the following actions:
    1. Creates welcome comments for new contributors
    2. Gets the Dockerfile content directly from the PR branch using GitHub API
    3. Builds a Docker image from the Dockerfile content
    4. Posts build status comments to the PR with the image name for user reference
    5. Handles all build status and log updates in the database via centralized controller helpers for clarity and maintainability
    
    The Docker build process:
    - Creates a unique image name using format: {repo_name}_{branch_name}_{unique_id}
    - Uses GitHub API to get Dockerfile content directly (no downloading needed)
    - Works with both public and private repositories using authenticated GitHub client
    - Searches for Dockerfile in multiple common locations (root, docker/, build/, etc.)
    - Labels images with GitHub metadata for tracking
    - Handles various error cases gracefully with informative comments
    - Provides the image name in success comments for users to use later
    
    Database operations:
    - All build status and log updates are handled through controller helper functions (update_source_code_build_status, safe_add_build_log, etc.)
    - This ensures less repetition, better error handling, and easier maintenance
    
    Requirements:
    - Docker daemon must be running
    - Repository must be accessible (public or app has access)
    - Branch must contain a valid Dockerfile
    - GitHub App must have appropriate permissions for repository access
    """
    
    def __init__(self, config: GitHubAppConfig):
        self.github_client = GitHubAppClient(config)
        self.commenter = PRCommenter()
        self.first_pr_detector = Detector()
    
    async def build_and_run_from_branch(self, repo_name: str, branch_name: str, pr_number: int, repo) -> str:
        """
        Get repository content from branch and build Docker image from Dockerfile.
        
        Args:
            repo_name: Full repository name (e.g., "owner/repo")
            branch_name: Branch name to get content from
            pr_number: Pull request number for logging
            repo: Authenticated Repository object for accessing repository content
            
        Returns:
            Image name with tag
        """
        build_id = None
        status="started"
        build_start_time = datetime.datetime.utcnow()
        repo_name_full_name=repo_name
        repo_name=repo_name.split('/')[-1] if '/' in repo_name else repo_name
        pull_request_number=str(pr_number)
        user_login=repo.get_pull(pr_number).user.login

        try:
            # Load registry configuration first
            settings = load_settings()
            registry_host = settings.get("REGISTRY_HOST")
            
            # Generate image name with registry URL if available
            image_name = generate_image_name(repo_name, branch_name, registry_url=registry_host)
        except Exception as e:
            logger.info(f"failed to generate image image from {repo_name} and {branch_name}")
            raise e
        try:
            # --- DB: Create SourceCodeBuild entry ---
            session_gen = get_session()
            session = next(session_gen)
            build_data = SourceCodeBuildType(
                image_name=image_name,
                status=status,
                repo_name_full_name=repo_name_full_name,
                repo_name=repo_name.split('/')[-1] if '/' in repo_name else repo_name,
                pull_request_number=pull_request_number,
                user_login=user_login,
                branch_name=branch_name,
                created_at=build_start_time,
                time_taken=None  # Will be updated when build completes
            )
            build_obj = create_source_code_build(session, build_data)
            build_id = build_obj.id
        except Exception as e:
            logger.info(f"failed to create entry in database for {repo_name} and {branch_name} will not continue with build as well")
            raise e

        try:
            # Create unique image name
            unique_id = image_name.split(':')[-1]
            
            logger.info(f"Building image {image_name} from branch {branch_name}")
            # Try to get the Dockerfile content directly from the repository
            dockerfile_content = None
            possible_paths = ["Dockerfile", "dockerfile", "Dockerfile.txt", "docker/Dockerfile", "build/Dockerfile"]
            
            for path in possible_paths:
                try:
                    # Get the file content from the specific branch
                    file_content = repo.get_contents(path, ref=branch_name)
                    if file_content.type == "file":
                        # Decode the content (GitHub returns base64 encoded content)
                        dockerfile_content = decode_github_content(file_content.content)
                        logger.info(f"Found Dockerfile at {path} in branch {branch_name}")
                        break
                except Exception as e:
                    # File not found at this path, continue to next
                    continue
            
            if not dockerfile_content:
                # If no Dockerfile found, try to list files in root to help debug
                try:
                    contents = repo.get_contents("", ref=branch_name)
                    files = [item.name for item in contents if item.type == "file"]
                    raise FileNotFoundError(f"No Dockerfile found in branch {branch_name}. Available files in root: {files[:10]}...")
                except Exception as e:
                    raise FileNotFoundError(f"No Dockerfile found in branch {branch_name}")
            
            # Basic validation of Dockerfile content
            if not dockerfile_content.strip():
                raise ValueError("Dockerfile is empty")
            
            logger.info(f"Building Docker image from Dockerfile content...")
            
            # Build the Docker image
            f = BytesIO(dockerfile_content.encode('utf-8'))
            image, logs = client.images.build(
                fileobj=f, 
                tag=image_name,
                forcerm=True, 
                rm=True,
                pull=False,
                labels={
                    "com.github.pr": str(pr_number),
                    "com.github.repo": repo_name,
                    "com.github.branch": branch_name,
                    "com.github.unique_id": unique_id
                }
            )

            # --- DB: Add build logs from Docker build output ---
            session_gen = get_session()
            session = next(session_gen)
            safe_add_build_log(session, build_id, message=logs)
            logger.info(f"Successfully built image {image_name} with ID {image.id}")
            
            # --- Push to Registry ---
            try:
                if registry_host:
                    logger.info(f"Starting push to registry {registry_host}")
                    
                    # Extract components from the registry image name we already have
                    source_tag = image_name.split(':')[-1]  # Extract tag
                    registry_repo_name = image_name.split('/')[1].split(':')[0]  # Extract repo name after registry URL
                    
                    # Test registry connectivity
                    registry_accessible = await _verify_registry_connectivity(registry_host)
                    if not registry_accessible:
                        logger.warning(f"Registry at {registry_host} may not be accessible")
                        safe_add_build_log(session, build_id, f"Warning: Registry connectivity test failed for {registry_host}")
                    
                    # Tag image for registry
                    try:
                        image.tag(f"{registry_host}/{registry_repo_name}", tag=source_tag)
                        logger.info(f"Tagged image as {image_name}")
                        safe_add_build_log(session, build_id, f"Tagged image for registry: {image_name}")
                    except Exception as e:
                        raise Exception(f"Failed to tag image for registry: {str(e)}")
                    
                    # Push image to registry
                    try:
                        push_logs = await _push_image_to_registry(
                            client, registry_host, registry_repo_name, source_tag
                        )
                        logger.info("Image push completed successfully")
                        safe_add_build_log(session, build_id, f"Push completed: {len(push_logs)} log entries")
                        
                        # Verify push success
                        verified, verification_msg = await _verify_push_success(
                            registry_host, registry_repo_name, source_tag
                        )
                        
                        if verified:
                            logger.info(f"Push verified successfully: {image_name}")
                            safe_add_build_log(session, build_id, f"Push verified: {verification_msg}")
                            _update_build_time_and_status(session, build_id, build_start_time, "pushed")
                            return image_name  # Already has registry URL
                        else:
                            logger.warning(f"Push completed but verification failed: {verification_msg}")
                            safe_add_build_log(session, build_id, f"Push verification failed: {verification_msg}")
                            _update_build_time_and_status(session, build_id, build_start_time, "push_failed")
                            return image_name
                    
                    except APIError as e:
                        error_msg = str(e)
                        logger.error(f"Registry push failed: {error_msg}")
                        safe_add_build_log(session, build_id, f"Push failed: {error_msg}")
                        _update_build_time_and_status(session, build_id, build_start_time, "push_failed")
                        return image_name
                    
                    except Exception as e:
                        logger.error(f"Unexpected push error: {str(e)}")
                        safe_add_build_log(session, build_id, f"Push error: {str(e)}")
                        _update_build_time_and_status(session, build_id, build_start_time, "push_failed")
                        return image_name
                
                else:
                    logger.warning("Registry host not configured, image built locally only")
                    safe_add_build_log(session, build_id, "Registry not configured, image built locally only")
                    _update_build_time_and_status(session, build_id, build_start_time, "success")
                    return image_name
                    
            except Exception as e:
                logger.error(f"Registry push process failed: {str(e)}")
                safe_add_build_log(session, build_id, f"Registry push failed: {str(e)}")
                _update_build_time_and_status(session, build_id, build_start_time, "push_failed")
                return image_name
        
        except Exception as e:
            logger.error(f"Failed to build image: {e}")
            # Ensure SourceCodeBuild entry exists for logging
            try:
                session_gen = get_session()
                session = next(session_gen)
                _update_build_time_and_status(session, build_id, build_start_time, "failed")
                safe_add_build_log(session, build_id, str(e))
            except Exception as inner_e:
                logger.error(f"Failed to create SourceCodeBuild entry for error logging: {inner_e}")
                raise e  # Re-raise original error if we can't log
    
    def cleanup_old_pr_resources(self, max_age_hours: int = 24) -> None:
        """
        Clean up old PR-related images to free up disk space.
        
        Args:
            max_age_hours: Maximum age in hours for resources to be considered old
        """
        try:
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            
            # Clean up old images
            images = client.images.list(filters={"label": "com.github.pr"})
            for image in images:
                try:
                    # Get image creation time
                    created_time = image.attrs['Created']
                    # Parse the ISO format timestamp
                    created_dt = datetime.datetime.fromisoformat(created_time.replace('Z', '+00:00'))
                    created_timestamp = created_dt.timestamp()
                    
                    if current_time - created_timestamp > max_age_seconds:
                        logger.info(f"Removing old image {image.tags[0] if image.tags else image.id} (created {created_time})")
                        client.images.remove(image.id, force=True)
                except Exception as e:
                    logger.warning(f"Failed to remove old image {image.id}: {e}")
                    
        except Exception as e:
            logger.error(f"Failed to cleanup old PR resources: {e}")
    
    async def handle_pull_request_event(self, payload: Dict[str, Any]) -> None:
        """
        Handle pull request event and add appropriate comments.
        
        Args:
            payload: GitHub webhook payload for pull request event
        """
        try:
            logger.info("Starting background Docker build process...")
            
            # Extract data from payload
            installation_id = payload["installation"]["id"]
            repo_name_full_name = payload["repository"]["full_name"]
            repo_name = payload["repository"]["name"]
            pull_request_number = payload["pull_request"]["number"]
            user_login = payload["pull_request"]["user"]["login"]
            branch_name = payload["pull_request"]["head"]["ref"]  # Get the branch name
            
            logger.info(f"Processing PR #{pull_request_number} by {user_login} in {repo_name_full_name} from branch {branch_name}")
            
            # Get authenticated GitHub client
            github_client = self.github_client.get_github_client(installation_id)
            
            # Get repository using the full name from payload
            repo = github_client.get_repo(repo_name_full_name)
            pr = repo.get_pull(pull_request_number)
            
            # Check if this is the user's first PR
            is_first_pr = self.first_pr_detector.is_first_pr_to_repo(
                repo, user_login, pull_request_number
            )
            
            # Create welcome comment
            self.commenter.create_welcome_comment(pr, user_login, is_first_pr)
            
            # Build and run container from branch's Dockerfile
            try:
                # Clean up old resources before building new ones
                self.cleanup_old_pr_resources()
                
                image_name = await self.build_and_run_from_branch(repo_name, branch_name, pull_request_number, repo)
                
                # Create build status comment
                self.commenter.create_build_started_comment(pr, user_login)
                
                # Create build success comment
                self.commenter.create_build_success_comment(pr, user_login, image_name)
                
            except FileNotFoundError as e:
                # Handle case where Dockerfile doesn't exist
                self.commenter.create_build_failure_comment(pr, user_login, str(e))
                logger.warning(f"No Dockerfile found in PR #{pull_request_number}: {e}")
                
            except Exception as e:
                # Handle other build errors
                self.commenter.create_build_failure_comment(pr, user_login, str(e))
                logger.error(f"Build failed for PR #{pull_request_number}: {e}")
            
        except KeyError as e:
            logger.error(f"Missing required field in payload: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to handle pull request event: {e}")
            raise 