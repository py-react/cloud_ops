import logging
import asyncio
import datetime
from typing import Any, Optional
from github import Github
from app.github_client.helpers.utils import clone_repo
from app.github_client.client.pat_client import _get_pat_from_db

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
                # Use pr.head.sha for content retrieval to ensure we see the exact commit
                dockerfile_content = await self._get_dockerfile_from_repo(repo, pr.head.sha)
                
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
    
    async def _get_dockerfile_from_repo(self, repo: Any, ref: str) -> str:
        """Get Dockerfile content from repository."""
        possible_paths = [
            "Dockerfile", "dockerfile", "Dockerfile.txt", 
            "docker/Dockerfile", "build/Dockerfile"
        ]
        
        logger.info(f"Searching for Dockerfile in {repo.full_name} at ref {ref}")
        
        for path in possible_paths:
            try:
                file_content = await asyncio.to_thread(repo.get_contents, path, ref=ref)
                if file_content.type == "file":
                    from app.github_client.helpers import decode_github_content
                    dockerfile_content = decode_github_content(file_content.content)
                    logger.info(f"Successfully found Dockerfile at {path} in {repo.full_name} at ref {ref}")
                    return dockerfile_content
            except Exception as e:
                # Log non-404 errors as they might indicate permission or other issues
                if getattr(e, "status", None) != 404:
                    logger.debug(f"Path {path} check failed with status {getattr(e, 'status', 'unknown')}: {e}")
                continue
        
        try:
            logger.warning(f"Dockerfile not found in common paths for {repo.full_name}@{ref}. Listing root contents...")
            contents = await asyncio.to_thread(repo.get_contents, "", ref=ref)
            files = [item.name for item in contents if item.type == "file"]
            dirs = [item.name for item in contents if item.type == "dir"]
            
            error_msg = (
                f"No Dockerfile found in {repo.full_name} at ref {ref}. "
                f"Root files: {files[:15]}. Root dirs: {dirs[:10]}."
            )
            logger.error(error_msg)
            raise FileNotFoundError(error_msg)
        except Exception as e:
            if isinstance(e, FileNotFoundError):
                raise
            
            detailed_error = f"Failed to list contents of {repo.full_name} at ref {ref}: {str(e)}"
            logger.error(detailed_error)
            raise FileNotFoundError(detailed_error)
    
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
        
        from app.db_client.db import get_session
        from app.db_client.models.registry_config import RegistryConfig as DBRegistryConfig
        from app.github_client.core.allowed_repo import AllowedRepoUtils
        
        # Determine registry and engine (branch specific > repo specific > default)
        registry_url = None
        engine_id = None
        branch_name = pr.head.ref
        
        with get_session() as session:
            utils = AllowedRepoUtils(session)
            _, allowed_branches, _, _, repo_registries, repo_engines = utils.get_all()
            
            # 1. Check branch-specific config
            branch_list = allowed_branches.get(repo.name, [])
            branch_config = next((b for b in branch_list if b["branch"] == branch_name), None)
            
            if branch_config:
                registry_id = branch_config.get("registry_id")
                engine_id = branch_config.get("docker_config_id")
                
                if registry_id:
                    reg_config = session.get(DBRegistryConfig, registry_id)
                    if reg_config:
                        registry_url = reg_config.url
            
            # 2. Fallback to repo-specific config
            if not registry_url:
                repo_registry_id = repo_registries.get(repo.name)
                if repo_registry_id:
                    reg_config = session.get(DBRegistryConfig, repo_registry_id)
                    if reg_config:
                        registry_url = reg_config.url
            
            if not engine_id:
                engine_id = repo_engines.get(repo.name)
            
            # 3. Fallback to default registry
            if not registry_url:
                 settings = load_settings()
                 registry_url = settings.get("REGISTRY_HOST")

        if registry_url:
            image_name = generate_image_name(
                repo.name, branch_name, registry_url=registry_url
            )
            
            return SourceCodeBuildType(
                image_name=image_name,
                status="started",
                repo_name_full_name=repo.full_name,
                repo_name=repo.name,
                pull_request_number=str(pr.number),
                pr_head_sha=pr.head.sha,
                user_login=user_login,
                branch_name=branch_name,
                created_at=start_time,
                base_branch_name=pr.base.ref,
                time_taken=None
            )
        raise Exception("No registry configured for repository (check Settings -> CI/CD -> Source Control or General Settings)")
    
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
        
        from app.db_client.db import get_session
        from app.db_client.models.registry_config import RegistryConfig as DBRegistryConfig
        from app.github_client.config.registry_config import RegistryConfig
        from app.github_client.core.allowed_repo import AllowedRepoUtils
        
        registry_url = None
        registry_config = None
        engine_id = None
        branch_name = pr.head.ref
        
        with get_session() as session:
            utils = AllowedRepoUtils(session)
            _, allowed_branches, _, _, repo_registries, repo_engines = utils.get_all()
            
            # 1. Check branch-specific config
            branch_list = allowed_branches.get(repo.name, [])
            branch_config = next((b for b in branch_list if b["branch"] == branch_name), None)
            
            target_registry_id = None
            if branch_config:
                target_registry_id = branch_config.get("registry_id")
                engine_id = branch_config.get("docker_config_id")
            
            # 2. Fallback to repo-specific config
            if not target_registry_id:
                target_registry_id = repo_registries.get(repo.name)
            
            if not engine_id:
                engine_id = repo_engines.get(repo.name)
            
            # Resolve registry details
            if target_registry_id:
                db_reg_config = session.get(DBRegistryConfig, target_registry_id)
                if db_reg_config:
                   registry_url = db_reg_config.url
                   registry_config = RegistryConfig(
                       url=db_reg_config.url,
                       name=db_reg_config.name,
                       username=db_reg_config.username,
                       password=db_reg_config.password,
                       priority=1,
                       is_remote=db_reg_config.is_remote,
                       config=db_reg_config.config
                   )

            # 3. Fallback to default if no specific registry found
            if not registry_url:
                 settings = load_settings()
                 registry_url = settings.get("REGISTRY_HOST")

        if not registry_url:
            raise Exception("No registry configured for repository (check Settings -> CI/CD -> Source Control or General Settings)")
        
        base_image_name = generate_image_name(
            repo.name, branch_name, registry_url=registry_url
        )
        
        unique_id = base_image_name.split(':')[-1]
        
        labels = {
            "com.github.pr": str(pr.number),
            "com.github.repo": repo.full_name,
            "com.github.branch": pr.head.ref,
            "com.github.unique_id": unique_id
        }
        
        try:
            pat = _get_pat_from_db()
            if not pat:
                raise Exception("Failed to retrieve GitHub PAT for cloning")

            from app.docker_client import clientContext
            
            with clone_repo(repo.full_name, branch_name, pat) as (context_path, clone_logs):
                if build_id:
                    self.build_repository.add_log(build_id, f"--- Git Clone Logs ---\n{clone_logs}")
                
                # Set the engine context for the background thread.
                # NOTE: engine_id=0 is the Local Engine sentinel — must use `is not None`
                # because `if 0:` is falsy in Python and would silently skip local engine.
                if engine_id is not None:
                    clientContext.set_engine_id(engine_id)
                
                try:
                    image_name = await self.image_lifecycle_service.build_and_push(
                        dockerfile_content, 
                        base_image_name, 
                        labels, 
                        context_path=context_path, 
                        registry_config=registry_config,
                        build_id=build_id
                    )
                finally:
                    # Reset after build regardless of engine type
                    if engine_id is not None:
                        clientContext.reset()
            
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
