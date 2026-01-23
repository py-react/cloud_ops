import logging
from typing import Tuple
from github import Github

logger = logging.getLogger(__name__)


class RateLimiter:
    """Manages GitHub API rate limiting."""
    
    def __init__(self, threshold: int = 50):
        self.threshold = threshold
        self.backoff_multiplier = 1.0
    
    async def should_backoff(self, github_client: Github) -> Tuple[bool, int]:
        """
        Check if should backoff due to rate limits.
        
        Args:
            github_client: PyGithub Github client
            
        Returns:
            Tuple of (should_backoff, backoff_seconds)
        """
        try:
            rl = github_client.get_rate_limit()
            core = rl.core
            remaining = core.remaining
            limit = core.limit
            
            logger.info(f"GitHub rate limit: {remaining}/{limit} remaining")
            
            if remaining < 50:
                self.backoff_multiplier = 2.0
            elif remaining < 100:
                self.backoff_multiplier = 1.5
            else:
                self.backoff_multiplier = 1.0
            
            should_backoff = remaining < self.threshold
            backoff_seconds = int((limit / max(remaining, 1)) * self.backoff_multiplier * 60)
            
            if should_backoff:
                logger.warning(
                    f"Low GitHub rate limit remaining: {remaining}. "
                    f"Backing off for {backoff_seconds} seconds"
                )
            
            return should_backoff, backoff_seconds
            
        except Exception as e:
            logger.error(f"Failed to check rate limit: {e}")
            return False, 0
