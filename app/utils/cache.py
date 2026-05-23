import logging
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)

_redis_client = None
_l1 = {}
CACHE_PREFIX = "cloud_ops:"
L1_TTL = 60


def _get_redis_url() -> str:
    try:
        from kiwijs.utils.load_settings import load_settings
        s = load_settings()
        return s.get("REDIS_URL", "redis://localhost:6379/0")
    except Exception:
        return "redis://localhost:6379/0"


def _get_client():
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    import redis as redis_mod
    url = _get_redis_url()
    _redis_client = redis_mod.from_url(url, decode_responses=True, socket_connect_timeout=2)
    _redis_client.ping()
    logger.info(f"Connected to Redis at {url}")
    return _redis_client


# ── L1: in-memory, stores decrypted/parsed Python objects ──

def l1_get(key: str) -> Optional[Any]:
    full_key = f"{CACHE_PREFIX}{key}"
    entry = _l1.get(full_key)
    if entry and time.time() < entry["expires_at"]:
        return entry["value"]
    if entry:
        del _l1[full_key]
    return None


def l1_set(key: str, value: Any, ttl: int = L1_TTL):
    full_key = f"{CACHE_PREFIX}{key}"
    _l1[full_key] = {"value": value, "expires_at": time.time() + ttl}


def l1_delete(key: str):
    full_key = f"{CACHE_PREFIX}{key}"
    _l1.pop(full_key, None)


# ── L2: Redis, stores encrypted/serialized strings ──

def cache_get(key: str) -> Optional[str]:
    full_key = f"{CACHE_PREFIX}{key}"
    return _get_client().get(full_key)


def cache_set(key: str, value: str, ttl: int = 300):
    full_key = f"{CACHE_PREFIX}{key}"
    _get_client().setex(full_key, ttl, value)


def cache_delete(key: str):
    l1_delete(key)
    full_key = f"{CACHE_PREFIX}{key}"
    _get_client().delete(full_key)


def cache_clear_all():
    _l1.clear()
    client = _get_client()
    cursor = 0
    while True:
        cursor, keys = client.scan(cursor=cursor, match=f"{CACHE_PREFIX}*", count=100)
        if keys:
            client.delete(*keys)
        if cursor == 0:
            break
