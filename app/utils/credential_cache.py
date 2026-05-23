import logging
from typing import Any, Callable, Optional, Tuple

from app.utils.cache import l1_get, l1_set, cache_get, cache_set, cache_delete
from app.utils.get_fernet import get_fernet
from app.db_client.db import get_session
from app.db_client.models.github_pat.github_pat import IntegrationCredential
from app.db_client.models.ssh_management import System
from sqlmodel import select

logger = logging.getLogger(__name__)
logger.info("credential_cache module loaded")

L1_TTL = 90
L2_TTL = 600


def _decrypt(ciphertext: str) -> str:
    f = get_fernet()
    if not f:
        raise RuntimeError("Server not configured with encryption key")
    return f.decrypt(ciphertext.encode()).decode()


def get_cached_credential(
    cache_key: str,
    load_ciphertext: Callable[[], str],
    *,
    transform: Optional[Callable[[str], Any]] = None,
    l2_ttl: int = L2_TTL,
) -> Any:
    full_key = f"cred:{cache_key}"

    l1 = l1_get(full_key)
    if l1 is not None:
        logger.info("L1 HIT  key=%s", cache_key)
        return l1

    l2 = cache_get(full_key)
    if l2:
        try:
            plain = _decrypt(l2)
            result = transform(plain) if transform else plain
            l1_set(full_key, result, L1_TTL)
            logger.info("L2 HIT  key=%s  warmed L1", cache_key)
            return result
        except Exception:
            logger.warning("L2 STALE key=%s  decrypt failed, purging", cache_key)
            cache_delete(full_key)

    ciphertext = load_ciphertext()
    logger.info("L2 MISS key=%s  loaded from DB", cache_key)
    plain = _decrypt(ciphertext)
    result = transform(plain) if transform else plain

    cache_set(full_key, ciphertext, l2_ttl)
    l1_set(full_key, result, L1_TTL)
    logger.info("CACHE SET key=%s  L1+L2 populated (L2 ttl=%ds)", cache_key, l2_ttl)
    return result


def invalidate_cached_credential(cache_key: str):
    logger.info("CACHE INVAL key=%s", cache_key)
    cache_delete(f"cred:{cache_key}")


def get_credential_token(credential_id: int, provider: Optional[str] = None) -> str:
    from app.db_client.controllers.github_pat.github_pat import mark_last_used

    def _load():
        with get_session() as session:
            cred = session.get(IntegrationCredential, credential_id)
            if not cred:
                raise ValueError(f"Credential {credential_id} not found")
            if provider and cred.provider != provider:
                raise ValueError(f"Credential {credential_id} provider={cred.provider}, expected {provider}")
            try:
                mark_last_used(session, credential_id)
            except Exception:
                pass
            return cred.token_encrypted

    return get_cached_credential(f"int_cred:{credential_id}", _load)


def get_system_credential(system_id: int, field: str) -> str:
    def _load():
        with get_session() as session:
            system = session.get(System, system_id)
            if not system:
                raise ValueError(f"System {system_id} not found")
            val = getattr(system, field)
            if not val:
                raise ValueError(f"System {system_id} has no {field}")
            return val

    return get_cached_credential(f"system:{system_id}:{field}", _load)


def get_google_credential_token(user_id: int) -> Tuple[str, Optional[str]]:
    from app.db_client.models import GoogleCredential

    cache_key = f"google_cred:{user_id}"
    full_key = f"cred:{cache_key}"

    l1 = l1_get(full_key)
    if l1 is not None:
        logger.info("L1 HIT  key=%s", cache_key)
        return l1

    l2 = cache_get(full_key)
    if l2:
        try:
            from app.utils.encryption import decrypt_string
            parts = l2.split("||", 1)
            if len(parts) != 2:
                cache_delete(full_key)
                raise ValueError("Invalid cached format")
            access_enc, refresh_enc = parts
            access_token = decrypt_string(access_enc)
            refresh_token = decrypt_string(refresh_enc) if refresh_enc else None
            result = (access_token, refresh_token)
            l1_set(full_key, result, L1_TTL)
            logger.info("L2 HIT  key=%s  warmed L1", cache_key)
            return result
        except Exception:
            logger.warning("L2 STALE key=%s  decrypt failed, purging", cache_key)
            cache_delete(full_key)

    with get_session() as session:
        stmt = select(GoogleCredential).where(GoogleCredential.user_id == user_id)
        db_cred = session.exec(stmt).first()
        if not db_cred:
            raise ValueError(f"Google credentials not found for user {user_id}")

        logger.info("L2 MISS key=%s  loaded from DB", cache_key)
        from app.utils.encryption import decrypt_string
        access_token = decrypt_string(db_cred.access_token)
        refresh_token = decrypt_string(db_cred.refresh_token) if db_cred.refresh_token else None
        result = (access_token, refresh_token)

        l2_value = f"{db_cred.access_token}||{db_cred.refresh_token or ''}"
        cache_set(full_key, l2_value, L2_TTL)
        l1_set(full_key, result, L1_TTL)
        logger.info("CACHE SET key=%s  L1+L2 populated (L2 ttl=%ds)", cache_key, L2_TTL)
        return result


def invalidate_google_credential(user_id: int):
    invalidate_cached_credential(f"google_cred:{user_id}")
