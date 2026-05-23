import os
import logging
from typing import Dict, Optional
from github import Github
from kiwijs.utils.load_settings import load_settings
from app.utils.credential_cache import get_credential_token

logger = logging.getLogger(__name__)

def _get_pat_from_db(pat_id: Optional[int] = None) -> Optional[str]:
    """Retrieve and decrypt a specific GitHub credential from the database."""
    if not pat_id:
        return None

    try:
        token = get_credential_token(pat_id, provider="github")
    except ValueError:
        return None
    except Exception as e:
        logger.error(f"Failed to decrypt credential {pat_id}: {e}")
        return None

    if not token.startswith("ghp_") and not token.startswith("github_pat_") and len(token) < 36:
        logger.warning(f"Credential {pat_id} is not a valid GitHub PAT.")
        return None

    return token


def get_github_client_from_pat(pat_id: Optional[int] = None) -> Github:
    """Return a PyGithub Github client for a specific pat_id.

    Raises ValueError if no token is available for the given pat_id.
    """
    settings = load_settings()
    
    token = _get_pat_from_db(pat_id) if pat_id else None
    
    if not token:
        # Fallback to env var for extreme edge cases but NO global active DB creds
        token = settings.get("GITHUB_PAT")
        
    if not token:
        raise ValueError(
            "No GitHub access token available. Please configure a repository-specific PAT."
        )
    return Github(token)


def get_rate_limit_info(client: Github) -> Dict[str, int]:
    """Return rate limit info (core and search) for monitoring and throttling.

    Returns a mapping with keys `core_remaining`, `core_limit`, `search_remaining`, `search_limit`.
    """
    try:
        rl = client.get_rate_limit()
        core = rl.core
        search = rl.search
        return {
            "core_remaining": core.remaining,
            "core_limit": core.limit,
            "search_remaining": search.remaining,
            "search_limit": search.limit,
        }
    except Exception as e:
        logger.warning(f"Failed to fetch rate limit info: {e}")
        return {"core_remaining": 0, "core_limit": 0, "search_remaining": 0, "search_limit": 0}
