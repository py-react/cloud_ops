import os
import logging
from typing import Dict, Optional
from github import Github
from kiwijs.utils.load_settings import load_settings
from app.db_client.db import get_session
from app.db_client.controllers.github_pat.github_pat import get_active_credential, get_credential
from app.db_client.controllers.github_pat.github_pat import mark_last_used
from app.utils.get_fernet import get_fernet

logger = logging.getLogger(__name__)

def _get_pat_from_db(pat_id: Optional[int] = None) -> Optional[str]:
    """Retrieve and decrypt a specific GitHub credential from the database."""
    if not pat_id:
        return None
        
    with get_session() as session:
        cred_obj = get_credential(session, pat_id)
        
        if not cred_obj:
            return None
        
        # Ensure we only return credentials intended for GitHub
        if cred_obj.provider != "github":
            logger.warning(f"Credential {pat_id} is not a GitHub provider.")
            return None

        token_enc = cred_obj.token_encrypted
        f = get_fernet()
        if not f:
            # No encryption key configured. 
            try:
                token_plain = token_enc if isinstance(token_enc, str) else token_enc.decode('utf-8')
            except Exception:
                token_plain = None

            if token_plain and (token_plain.startswith('ghp_') or token_plain.startswith('github_pat_') or len(token_plain) >= 36):
                logger.warning(
                    "GITHUB_PAT_ENCRYPTION_KEY is not set but an active credential exists in DB. "
                    "Using stored token as plaintext fallback."
                )
                try:
                    if cred_obj.id:
                        mark_last_used(session, cred_obj.id)
                except Exception:
                    pass
                return token_plain

            return None
        try:
            token = f.decrypt(token_enc.encode('utf-8')).decode('utf-8')
            try:
                if cred_obj.id:
                    mark_last_used(session, cred_obj.id)
            except Exception:
                pass
            return token
        except Exception as e:
            logger.error(f"Failed to decrypt credential from DB: {e}")
            return None


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
