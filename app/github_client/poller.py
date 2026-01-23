import asyncio
import logging
from typing import Any
from github import Github

from app.github_client.client.pat_client import get_github_client_from_pat
from app.github_client.core import AllowedRepoUtils, PRCommenter, Detector
from app.github_client.services.pr_service import PRService
from app.docker_client.image_lifecycle_service import ImageLifecycleService
from app.docker_client.builder import DockerImageBuilder
from app.docker_client.registry import RegistryManager
from app.docker_client.cleanup import ImageCleanupService
from app.db_client.controllers.HOC.build_repository import BuildRepository
from app.db_client.controllers.HOC.pr_repository import PRRepository
from app.github_client.triggers.trigger_detector import TriggerDetector
from app.github_client.triggers.rate_limiter import RateLimiter
from app.docker_client import clientContext
from app.db_client.db import get_session
from app.utils.promise import Promise
from render_relay.utils import load_settings
from app.github_client.config.registry_config import load_registries
from app.github_client.config.docker_config import load_docker_config

logger = logging.getLogger(__name__)


class RepoPoller:
    """Central poller that discovers open PRs and invokes PRService.
    
    This poller is intended to run inside the application process (no CLI). 
    It uses a single PAT-authenticated PyGithub client to fetch open PRs 
    for allowed repos and calls `PRService.process_pr` to process them.
    """
    
    def __init__(self, poll_interval_seconds: int = 60):
        self.github_client = get_github_client_from_pat()
        self.poll_interval_seconds = poll_interval_seconds
        self.repo_utils = AllowedRepoUtils()
        
        self._stop = True
        self.if_run_forever = False
        
        self.pr_service = self._create_pr_service()
        self.trigger_detector = TriggerDetector()
        self.rate_limiter = RateLimiter()
    
    def _create_pr_service(self) -> PRService:
        """Create PR service with all dependencies."""
        settings = load_settings()
        
        docker_client = clientContext.client
        registries = load_registries(settings)
        docker_config = load_docker_config(settings)
        
        builder = DockerImageBuilder(docker_client)
        registry_manager = RegistryManager(registries, docker_client)
        cleanup_service = ImageCleanupService(docker_client)
        
        
        session_gen = get_session()
        session = next(session_gen)
        
        build_repository = BuildRepository(session)
        pr_repository = PRRepository(session)
        
        commenter = PRCommenter()
        detector = Detector()

        image_lifecycle_service = ImageLifecycleService(
            builder=builder,
            registry_manager=registry_manager,
            cleanup_service=cleanup_service,
            session=session
        )
        
        
        return PRService(
            image_lifecycle_service=image_lifecycle_service,
            build_repository=build_repository,
            pr_repository=pr_repository,
            commenter=commenter,
            detector=detector
        )
    
    async def run_once(self) -> None:
        """Run a single iteration: iterate allowed repos and process open PRs."""
        logger.info("RepoPoller: starting run_once")
        try:
            repos_map, branches_map, deployments = self.repo_utils.get_all()
            user_login = None
            try:
                user = self.github_client.get_user()
                user_login = user.login
                logger.debug(f"RepoPoller authenticated as GitHub user: {user_login}")
            except Exception as e:
                logger.error(f"RepoPoller failed to get authenticated user: {e}")
                raise e
            
            should_backoff, backoff_seconds = await self.rate_limiter.should_backoff(
                self.github_client
            )
            if should_backoff:
                logger.warning(
                    f"Backing off due to rate limiting for {backoff_seconds} seconds"
                )
                await asyncio.sleep(backoff_seconds)
                return
            
            promises = []
            for repo_name in repos_map.keys():
                promises.append(
                    Promise(
                        self.process_branches_for_repo(
                            repo_name, branches_map, user_login
                        )
                    )
                )
            await Promise.all(promises)
            
        except Exception as e:
            logger.error(f"RepoPoller run_once failed: {e}")
        finally:
            if not self.if_run_forever:
                self._stop = True
            logger.info("RepoPoller: completed")
    
    async def process_branches_for_repo(
        self, repo_name: str, branches_map: dict, user_login: str
    ) -> None:
        """Process all branches for a given repository."""
        try:
            logger.info(f"Polling repo: {repo_name} branches: {branches_map[repo_name]}")
            gh_repo = self.github_client.get_repo(
                repo_name if "/" in repo_name else f"{user_login}/{repo_name}"
            )
            promises = []
            for branch in branches_map[repo_name]:
                promises.append(
                    Promise(
                        self.process_single_branch(branch, gh_repo, repo_name, user_login)
                    )
                )
            await Promise.all(promises)
        except Exception as e:
            logger.error(f"Failed to poll repo {repo_name}: {e}")
    
    async def process_single_branch(
        self, branch: str, gh_repo: Any, repo_name: str, user_login: str
    ) -> None:
        """Process all PRs for a single branch."""
        try:
            pulls = gh_repo.get_pulls(state="open", base=branch)
            if pulls.totalCount == 0:
                logger.info(f"No open PRs found for repo {repo_name} base_branch {branch}")
            else:
                for pull in pulls:
                    logger.info(
                        f"Found open PR #{pull.number} in repo {repo_name} base_branch {branch}"
                    )
                    Promise(
                        self.process_single_pr(pull, repo_name, branch, user_login)
                    )
        except Exception as e:
            logger.error(f"Failed to poll branch {branch} in repo {repo_name}: {e}")
            raise e
    
    async def process_single_pr(
        self, pr: Any, repo_name: str, branch: str, user_login: str
    ) -> None:
        """Process a single PR: check triggers and process if needed."""
        logger.info(
            f"base: {branch} <- head: {pr.head.ref} (PR #{pr.number})"
        )
        
        try:
            settings = load_settings()
            
            url_with_protocol = (
                "http://localhost:5001" 
                if settings.get("DEBUG", False) 
                else settings.get("URL")
            )
            check_status_url = (
                f"{url_with_protocol}/settings/ci_cd/source_control/"
                f"{pr.head.repo.name}/{pr.head.ref}"
            )
            
            should_trigger, reason = await self.trigger_detector.should_trigger_build(
                pr, self.pr_service.pr_repository.session, branch, repo_name
            )
            
            if should_trigger:
                logger.info(reason)
                
                if not self._stop:
                    async def process():
                        repo_full_name = (
                            repo_name if "/" in repo_name 
                            else f"{user_login}/{repo_name}"
                        )
                        try:
                            await self.pr_service.process_pr(
                                repo=pr.head.repo,
                                pr=pr,
                                github_client=self.github_client,
                                check_status_url=check_status_url
                            )
                            logger.info(f"Completed processing PR #{pr.number} in {repo_name}")
                        except Exception as e:
                            logger.error(f"Error processing PR #{pr.number} in {repo_name}: {e}")
                            raise e
                    
                    Promise(process())
                    logger.info(f"Triggered processing for PR #{pr.number} in {repo_name}")
                else:
                    logger.info("Already handling initialization; skipping build trigger")
            else:
                logger.info(
                    f"Skipping PR #{pr.number} in {repo_name} for base_branch {branch}: "
                    f"{reason}"
                )
        except Exception as e:
            logger.error(f"Error processing PR #{pr.number} in {repo_name}: {e}")
    
    async def run_forever(self) -> None:
        """Run poller loop until stopped."""
        logger.info("RepoPoller: starting run_forever")
        self.if_run_forever = True
        self._stop = False
        
        while not self._stop:
            try:
                rate_info = self.rate_limiter.should_backoff(self.github_client)
                logger.info(f"Rate limit check: {rate_info}")
                Promise(self.run_once())
                logger.info("RepoPoller: started")
            except Exception as e:
                logger.error(f"RepoPoller encountered error: {e}")
            await asyncio.sleep(self.poll_interval_seconds)
    
    def stop(self):
        """Stop the poller."""
        self._stop = True


def get_repo_poller() -> RepoPoller:
    """Get or create a singleton repo poller instance."""
    repo_poller = globals().get("repo_poller", None)
    if repo_poller is None:
        repo_poller = RepoPoller()
        globals()["repo_poller"] = repo_poller
    logger.info(f"repo_poller._stop: {globals()['repo_poller']._stop}")
    return globals()["repo_poller"]
