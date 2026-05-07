import asyncio
import logging
from typing import Any, Dict, Optional, Tuple
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
from kiwijs.utils import load_settings
from app.github_client.config.registry_config import load_registries
from app.github_client.config.docker_config import load_docker_config

logger = logging.getLogger(__name__)


class RepoPoller:
    """Poller for a specific PAT (Personal Access Token).
    
    This poller processes all repositories associated with its PAT
    reading from a shared configuration cache in the PollingManager.
    """
    
    def __init__(self, manager: 'PollingManager', pat_id: Optional[int] = None, poll_interval_seconds: int = 60, docker_client=None):
        self.manager = manager
        self.pat_id = pat_id
        self.github_client = get_github_client_from_pat(pat_id=pat_id)
        self.poll_interval_seconds = poll_interval_seconds
        self._docker_client = docker_client
        
        self._stop = True
        self.if_run_forever = False
        self._in_flight_prs = set()
        
        self.pr_service = self._create_pr_service()
        self.trigger_detector = TriggerDetector()
        self.rate_limiter = RateLimiter()

    @property
    def docker_client(self):
        return self._docker_client or clientContext.get_client(use_active=False)
    
    def _create_pr_service(self, session: Any = None) -> PRService:
        """Create PR service with all dependencies."""
        settings = load_settings()
        
        builder = DockerImageBuilder()
        registries = load_registries(settings)
        registry_manager = RegistryManager(registries)
        cleanup_service = ImageCleanupService()
        
        if session:
            return self._build_pr_service_with_session(session, builder, registry_manager, cleanup_service)
        
        with get_session() as session:
            return self._build_pr_service_with_session(session, builder, registry_manager, cleanup_service)

    def _build_pr_service_with_session(
        self, session: Any, builder: Any, registry_manager: Any, cleanup_service: Any
    ) -> PRService:
        """Helper to build PR service with a given session."""
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
        """Run a single iteration: use cached config to iterate repos matching our PAT."""
        try:
            # Use cached configuration from the manager instead of hitting the DB
            config = self.manager.get_cached_config()
            if not config:
                logger.debug(f"RepoPoller (PAT:{self.pat_id}): No cached config available.")
                return

            res_map, branches_map, _, repo_pats, _, _, repo_polling_enabled = config
            
            # Filter repos matching our PAT and where polling is enabled
            target_repos = [
                name for name, p_id in repo_pats.items() 
                if p_id == self.pat_id and repo_polling_enabled.get(name, False)
            ]
            
            if not target_repos:
                logger.debug(f"RepoPoller (PAT:{self.pat_id}): No enabled repos found in cache.")
                return

            logger.info(f"RepoPoller (PAT:{self.pat_id}): starting run_once for {len(target_repos)} repos")
            
            user_login = None
            try:
                user = self.github_client.get_user()
                user_login = user.login
            except Exception as e:
                logger.error(f"RepoPoller (PAT:{self.pat_id}) failed to get authenticated user: {e}")
                raise e
            
            should_backoff, backoff_seconds = self.rate_limiter.should_backoff(
                self.github_client
            )
            if should_backoff:
                logger.warning(
                    f"RepoPoller (PAT:{self.pat_id}) backing off for {backoff_seconds} seconds"
                )
                await asyncio.sleep(backoff_seconds)
                return
            
            promises = []
            for repo_name in target_repos:
                repo_id = res_map.get(repo_name)
                promises.append(
                    Promise(
                        self.process_branches_for_repo(
                            repo_name, branches_map, user_login, repo_id=repo_id
                        )
                    )
                )
            await Promise.all(promises)
            
        except Exception as e:
            logger.error(f"RepoPoller (PAT:{self.pat_id}) run_once failed: {e}")
        finally:
            if not self.if_run_forever:
                self._stop = True
    
    async def process_branches_for_repo(
        self, repo_name: str, branches_map: dict, user_login: str, repo_id: Optional[str] = None
    ) -> None:
        """Process all branches for a given repository."""
        try:
            logger.info(f"Polling repo: {repo_name} branches: {branches_map[repo_name]}")
            full_repo_name = repo_name if "/" in repo_name else f"{user_login}/{repo_name}"
            gh_repo = await asyncio.to_thread(self.github_client.get_repo, full_repo_name)
            promises = []
            for branch_data in branches_map[repo_name]:
                branch_name = branch_data["branch"] if isinstance(branch_data, dict) else branch_data
                promises.append(
                    Promise(
                        self.process_single_branch(branch_name, gh_repo, repo_name, user_login, repo_id=repo_id)
                    )
                )
            await Promise.all(promises)
        except Exception as e:
            logger.error(f"Failed to poll repo {repo_name}: {e}")
    
    async def process_single_branch(
        self, branch: str, gh_repo: Any, repo_name: str, user_login: str, repo_id: Optional[str] = None
    ) -> None:
        """Process all PRs for a single branch."""
        try:
            def get_all_pulls():
                return list(gh_repo.get_pulls(state="open", base=branch))
            
            pulls = await asyncio.to_thread(get_all_pulls)
            
            if not pulls:
                logger.debug(f"No open PRs found for repo {repo_name} branch {branch}")
            else:
                for pull in pulls:
                    logger.info(f"Found open PR #{pull.number} in repo {repo_name} branch {branch}")
                    Promise(self.process_single_pr(pull, repo_name, branch, user_login, repo_id=repo_id))
        except Exception as e:
            logger.error(f"Failed to poll branch {branch} in repo {repo_name}: {e}")
            raise e
    
    async def process_single_pr(
        self, pr: Any, repo_name: str, branch: str, user_login: str, repo_id: Optional[str] = None
    ) -> None:
        """Process a single PR: check triggers and process if needed."""
        try:
            settings = load_settings()
            url_with_protocol = "http://localhost:5001" if settings.get("DEBUG", False) else settings.get("URL")
            
            # Use ID for routing to avoid slash issues, fallback to name if ID not provided
            id_for_url = repo_id or repo_name
            check_status_url = f"{url_with_protocol}/settings/ci_cd/source_control/{id_for_url}/{pr.head.ref}"
            
            should_trigger, reason = self.trigger_detector.should_trigger_build(
                pr, self.pr_service.pr_repository.session, branch, repo_name
            )
            
            if should_trigger:
                pr_identifier = f"{repo_name}:{pr.number}"
                if pr_identifier in self._in_flight_prs:
                    logger.debug(f"Skipping PR #{pr.number} in {repo_name} because it is currently in-flight")
                    return

                logger.info(f"Triggering build for PR #{pr.number} in {repo_name}: {reason}")
                if not self._stop:
                    self._in_flight_prs.add(pr_identifier)
                    async def process():
                        try:
                            with get_session() as session:
                                task_service = self._create_pr_service(session)
                                await task_service.process_pr(
                                    repo=pr.head.repo,
                                    pr=pr,
                                    github_client=self.github_client,
                                    check_status_url=check_status_url
                                )
                            logger.info(f"Completed processing PR #{pr.number} in {repo_name}")
                        except Exception as e:
                            logger.error(f"Error processing PR #{pr.number} in {repo_name}: {e}")
                        finally:
                            self._in_flight_prs.discard(pr_identifier)
                    Promise(process())
            else:
                logger.debug(f"Skipping PR #{pr.number} in {repo_name} for branch {branch}: {reason}")
        except Exception as e:
            logger.error(f"Error processing PR #{pr.number} in {repo_name}: {e}")
    
    async def run_forever(self) -> None:
        """Run poller loop until stopped."""
        logger.info(f"RepoPoller (PAT:{self.pat_id}): starting run_forever")
        self.if_run_forever = True
        self._stop = False
        
        while not self._stop:
            try:
                should_backoff, backoff_seconds = self.rate_limiter.should_backoff(self.github_client)
                if should_backoff:
                    await asyncio.sleep(backoff_seconds)
                    continue

                await self.run_once()
            except Exception as e:
                logger.error(f"RepoPoller (PAT:{self.pat_id}) error: {e}")
            await asyncio.sleep(self.poll_interval_seconds)
    
    def stop(self):
        """Stop the poller."""
        self._stop = True


class PollingManager:
    """Manages multiple RepoPoller instances, one per GitHub PAT, with configuration caching."""
    
    def __init__(self):
        self._pollers: Dict[Optional[int], RepoPoller] = {}
        self._tasks: Dict[Optional[int], asyncio.Task] = {}
        self._global_interval = 60
        self._cached_config: Optional[Tuple] = None
        self._config_lock = asyncio.Lock()
        self.repo_utils = AllowedRepoUtils()

    def update_config(self, interval: int = None):
        """Update global polling configuration."""
        if interval is not None:
            self._global_interval = interval
            for poller in self._pollers.values():
                poller.poll_interval_seconds = interval

    def get_cached_config(self) -> Optional[Tuple]:
        """Return the current cached configuration."""
        return self._cached_config

    async def _refresh_cache(self):
        """Internal helper to fetch latest configuration into memory."""
        async with self._config_lock:
            # We wrap the synchronous database call to avoid blocking the event loop
            def fetch():
                return self.repo_utils.get_all()
            
            self._cached_config = await asyncio.to_thread(fetch)
            logger.debug("PollingManager: Configuration cache refreshed from database.")

    async def sync_pollers(self):
        """Synchronize background tasks based on the latest database state."""
        try:
            # First, update the cache so everyone is looking at fresh data
            await self._refresh_cache()
            
            # config format: (result, branches_with_config, deployments, repo_pats, repo_registries, repo_engines, repo_polling_enabled)
            _, _, _, repo_pats, _, _, repo_polling_enabled = self._cached_config
            
            # Find unique PAT IDs used by ANY repository that has polling enabled
            active_pat_ids = {
                p_id for name, p_id in repo_pats.items() 
                if repo_polling_enabled.get(name, False)
            }
            
            # 1. Start pollers for new PATs
            for pat_id in active_pat_ids:
                if pat_id not in self._pollers or self._pollers[pat_id]._stop:
                    logger.info(f"Starting new poller for PAT ID: {pat_id}")
                    poller = RepoPoller(manager=self, pat_id=pat_id, poll_interval_seconds=self._global_interval)
                    self._pollers[pat_id] = poller
                    self._tasks[pat_id] = asyncio.create_task(poller.run_forever())

            # 2. Stop pollers for PATs that are no longer needed
            for pat_id in list(self._pollers.keys()):
                if pat_id not in active_pat_ids:
                    logger.info(f"Stopping poller for PAT ID: {pat_id} (no enabled repos for this PAT)")
                    self._pollers[pat_id].stop()
                    if pat_id in self._tasks:
                        self._tasks[pat_id].cancel()
                        del self._tasks[pat_id]
                    del self._pollers[pat_id]

        except Exception as e:
            logger.error(f"PollingManager sync failed: {e}")

    def stop_all(self):
        """Shutdown all poller tasks."""
        for poller in self._pollers.values():
            poller.stop()
        for task in self._tasks.values():
            task.cancel()
        self._pollers.clear()
        self._tasks.clear()
        self._cached_config = None


def get_polling_manager() -> PollingManager:
    """Get the singleton PollingManager instance."""
    manager = globals().get("polling_manager", None)
    if manager is None:
        manager = PollingManager()
        globals()["polling_manager"] = manager
    return manager


def get_repo_poller() -> RepoPoller:
    """Legacy singleton hook - returns or creates a poller for the default PAT."""
    manager = get_polling_manager()
    if None not in manager._pollers:
        manager._pollers[None] = RepoPoller(manager=manager, pat_id=None)
    return manager._pollers[None]
