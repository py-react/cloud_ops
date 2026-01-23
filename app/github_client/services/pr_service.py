import logging
import datetime
from typing import Any, Optional
from github import Github

logger = logging.getLogger(__name__)


class PRService:
    """Service for orchestrating PR processing workflow."""
    
    def __init__(
        self,
        image_lifecycle_service: Any,
        build_repository: Any,
        pr_repository: Any,
        commenter: Any,
        detector: Any
    ):
        self.image_lifecycle_service = image_lifecycle_service
        self.build_repository = build_repository
        self.pr_repository = pr_repository
        self.commenter = commenter
        self.detector = detector
    
    async def process_pr(
        self, 
        repo: Any, 
        pr: Any, 
        github_client: Github,
        check_status_url: Optional[str] = None
    ) -> str | None:
        """
        Process a PR: detect triggers, build, push to registry, comment results.
        
        Args:
            repo: GitHub repository object
            pr: GitHub PR object
            github_client: GitHub client
            check_status_url: Optional URL for build status page
            
        Returns:
            Image name (or None if not built)
            
        Raises:
            Exception: If processing fails
        """
        try:
            logger.info(f"Processing PR #{pr.number} in {repo.full_name}")
            
            user_login = pr.user.login
            branch_name = pr.head.ref
            pr_number = str(pr.number)
            
            is_first_pr = self.detector.is_first_pr_to_repo(
                repo, user_login, pr.number
            )
            
            self.commenter.create_welcome_comment(pr, user_login, is_first_pr)
            
            build_start_time = datetime.datetime.utcnow()
            build_id = None
            
            try:
                dockerfile_content = self._get_dockerfile_from_repo(repo, branch_name)
                
                build_data = self._create_build_data(
                    repo, pr, build_start_time, user_login
                )
                build_obj = self.build_repository.create_build(build_data)
                build_id = build_obj.id
                
                self.commenter.create_build_started_comment(
                    pr, user_login, check_status_url
                )
                
                image_name = await self._build_pr_image(
                    repo, pr, dockerfile_content, build_id, build_start_time
                )
                
                self.commenter.create_build_success_comment(pr, user_login, image_name)
                logger.info(f"PR #{pr_number} processed successfully")
                
                return image_name
                
            except FileNotFoundError as e:
                self.commenter.create_build_failure_comment(pr, user_login, str(e))
                logger.warning(f"No Dockerfile found in PR #{pr_number}: {e}")
                if build_id:
                    self.build_repository.update_time_and_status(
                        build_id, build_start_time, "failed"
                    )
                return None
                
            except Exception as e:
                self.commenter.create_build_failure_comment(pr, user_login, str(e))
                logger.error(f"Build failed for PR #{pr_number}: {e}")
                if build_id:
                    self.build_repository.update_time_and_status(
                        build_id, build_start_time, "failed"
                    )
                raise Exception(f"PR processing failed: {str(e)}")
                
        except Exception as e:
            logger.error(f"Failed to process PR: {e}")
            raise Exception(f"PR service error: {str(e)}")
    
    def _get_dockerfile_from_repo(self, repo: Any, branch_name: str) -> str:
        """Get Dockerfile content from repository."""
        possible_paths = [
            "Dockerfile", "dockerfile", "Dockerfile.txt", 
            "docker/Dockerfile", "build/Dockerfile"
        ]
        
        for path in possible_paths:
            try:
                file_content = repo.get_contents(path, ref=branch_name)
                if file_content.type == "file":
                    from app.github_client.helpers import decode_github_content
                    dockerfile_content = decode_github_content(file_content.content)
                    logger.info(f"Found Dockerfile at {path} in branch {branch_name}")
                    return dockerfile_content
            except Exception:
                continue
        
        try:
            contents = repo.get_contents("", ref=branch_name)
            files = [item.name for item in contents if item.type == "file"]
            raise FileNotFoundError(
                f"No Dockerfile found in branch {branch_name}. "
                f"Available files in root: {files[:10]}..."
            )
        except Exception:
            raise FileNotFoundError(f"No Dockerfile found in branch {branch_name}")
    
    def _create_build_data(
        self, 
        repo: Any, 
        pr: Any, 
        start_time: datetime.datetime, 
        user_login: str
    ) -> Any:
        """Create build data object."""
        from app.github_client.helpers import generate_image_name
        from app.db_client.models.source_code_build.types import SourceCodeBuildType
        from render_relay.utils import load_settings
        
        settings = load_settings()
        registry_host = settings.get("REGISTRY_HOST")

        if registry_host:
            image_name = generate_image_name(
                repo.name, pr.head.ref, registry_url=registry_host
            )
            
            return SourceCodeBuildType(
                image_name=image_name,
                status="started",
                repo_name_full_name=repo.full_name,
                repo_name=repo.name,
                pull_request_number=str(pr.number),
                pr_head_sha=pr.head.sha,
                user_login=user_login,
                branch_name=pr.head.ref,
                created_at=start_time,
                base_branch_name=pr.base.ref,
                time_taken=None
            )
        raise Exception("REGISTRY_HOST not configured in settings")
    
    async def _build_pr_image(
        self, 
        repo: Any, 
        pr: Any, 
        dockerfile_content: str, 
        build_id: int, 
        start_time: datetime.datetime
    ) -> str:
        """Build and push PR image."""
        from app.github_client.helpers import generate_image_name
        from render_relay.utils import load_settings
        
        settings = load_settings()
        registry_host = settings.get("REGISTRY_HOST")

        if not registry_host:
            raise Exception("REGISTRY_HOST not configured in settings")
        
        base_image_name = generate_image_name(
            repo.name, pr.head.ref, registry_url=registry_host
        )
        
        unique_id = base_image_name.split(':')[-1]
        
        labels = {
            "com.github.pr": str(pr.number),
            "com.github.repo": repo.full_name,
            "com.github.branch": pr.head.ref,
            "com.github.unique_id": unique_id
        }
        
        try:
            image_name = await self.image_lifecycle_service.build_and_push(
                dockerfile_content, base_image_name, labels
            )
            
            self.build_repository.add_log(build_id, "Build and push completed successfully")
            self.build_repository.update_time_and_status(
                build_id, start_time, "success"
            )
            
            return image_name
            
        except Exception as e:
            self.build_repository.add_log(build_id, str(e))
            self.build_repository.update_time_and_status(
                build_id, start_time, "failed"
            )
            raise
