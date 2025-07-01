import logging
import time
import datetime
from typing import Dict, Any
from io import BytesIO

from app.docker_client import clientContext
from .models import GitHubAppConfig
from .client import GitHubAppClient
from .commenter import PRCommenter
from .detector import Detector
from .utils import generate_image_name, decode_github_content
from app.db_client.db import get_session
from app.db_client.controllers.source_code_build.source_code_build import add_build_log, create_source_code_build, get_source_code_build, update_source_code_build_status, safe_add_build_log
from app.db_client.models.source_code_build.types import SourceCodeBuildType

client = clientContext.client
logger = logging.getLogger(__name__)


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
    
    def build_and_run_from_branch(self, repo_name: str, branch_name: str, pr_number: int, repo) -> str:
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
        repo_name_full_name=repo_name
        repo_name=repo_name.split('/')[-1] if '/' in repo_name else repo_name
        pull_request_number=str(pr_number)
        user_login=repo.get_pull(pr_number).user.login

        try:
            image_name = generate_image_name(repo_name, branch_name)
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
                branch_name=branch_name
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
            safe_add_build_log(session,build_id,message=logs)
            update_source_code_build_status(session,build_id,"success")
            logger.info(f"Successfully built image {image_name} with ID {image.id}")
            return image_name
        
        except Exception as e:
            logger.error(f"Failed to build image: {e}")
            # Ensure SourceCodeBuild entry exists for logging
            try:
                session_gen = get_session()
                session = next(session_gen)
                update_source_code_build_status(session, build_id, "failed")
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
    
    def handle_pull_request_event(self, payload: Dict[str, Any]) -> None:
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
                
                image_name = self.build_and_run_from_branch(repo_name, branch_name, pull_request_number, repo)
                
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