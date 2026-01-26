import os
import logging
from typing import Dict, Optional
from github import Github
from render_relay.utils.load_settings import load_settings
from app.db_client.db import get_session
from app.db_client.controllers.github_pat.github_pat import get_active_pat
from app.db_client.controllers.github_pat.github_pat import mark_last_used
from app.utils.get_fernet import get_fernet

logger = logging.getLogger(__name__)

def _get_pat_from_db() -> Optional[str]:
    """Retrieve and decrypt the active GitHub PAT from the database."""
    with get_session() as session:
        pat_obj = get_active_pat(session)
        if not pat_obj:
            return None
        token_enc = pat_obj.token_encrypted
        f = get_fernet()
        if not f:
            # No encryption key configured. It's possible the DB row contains a
            # plaintext token (older installs). If the value looks like a GitHub
            # PAT, use it as a fallback but log a strong warning so the operator
            # can rotate and encrypt it properly.
            try:
                token_plain = token_enc if isinstance(token_enc, str) else token_enc.decode('utf-8')
            except Exception:
                token_plain = None

            if token_plain and (token_plain.startswith('ghp_') or token_plain.startswith('github_pat_') or len(token_plain) >= 36):
                logger.warning(
                    "GITHUB_PAT_ENCRYPTION_KEY is not set but an active PAT exists in DB. "
                    "Using stored token as plaintext fallback — rotate and encrypt this PAT as soon as possible."
                )
                try:
                    if pat_obj.id:
                        mark_last_used(session, pat_obj.id)
                    else:
                        raise Exception("PAT object has no ID")
                except Exception:
                    pass
                return token_plain

            logger.warning(
                "Encryption key not configured; cannot decrypt PAT from DB. "
                "Set the environment variable GITHUB_PAT_ENCRYPTION_KEY (Fernet key) "
                "or set GITHUB_PAT as a temporary fallback."
            )
            return None
        try:
            token = f.decrypt(token_enc.encode('utf-8')).decode('utf-8')
            # mark last used (best-effort)
            try:
                if pat_obj.id:
                    mark_last_used(session, pat_obj.id)
                else:
                    raise Exception("PAT object has no ID")
            except Exception:
                pass
            return token
        except Exception as e:
            logger.error(f"Failed to decrypt PAT from DB: {e}")
            return None


def get_github_client_from_pat() -> Github:
    """Return a PyGithub Github client.

    Preference order:
      1. Active PAT stored in DB (encrypted with `GITHUB_PAT_ENCRYPTION_KEY`).
      2. `GITHUB_PAT` environment variable (legacy).

    Raises ValueError if no token is available.
    """
    settings = load_settings()
    # Try DB first
    token = _get_pat_from_db()
    if not token:
        token = settings.get("GITHUB_PAT")
    if not token:
        raise ValueError(
            "No GitHub PAT available. Either set the environment variable `GITHUB_PAT` "
            "(temporary), or configure a stored PAT and ensure `GITHUB_PAT_ENCRYPTION_KEY` "
            "is set so the server can decrypt database-stored PATs. Generate a key with: "
            "python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
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
