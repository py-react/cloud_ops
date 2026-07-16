import hashlib
import json
import secrets
import time
from datetime import datetime, timedelta
from typing import Optional
from app.db_client.db import get_session as get_db_session
from app.db_client.models.session.session import UserSession
from app.db_client.models import User
from app.utils.cache import cache_get, cache_set, cache_delete, l1_get, l1_set
from sqlmodel import select


def _get_session_ttl() -> int:
    from kiwijs.utils.load_settings import load_settings
    s = load_settings()
    debug = s.get("DEBUG", False)
    if debug:
        debug_ttl = s.get("DEBUG_SESSION_TTL")
        if debug_ttl:
            return int(debug_ttl)
    return int(s["SESSION_TTL"])


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(user_id: int, tenant_id: Optional[int] = None) -> str:
    token = secrets.token_urlsafe(48)
    token_hash = _hash_token(token)
    ttl = _get_session_ttl()
    expires_at = datetime.utcnow() + timedelta(seconds=ttl)

    with get_db_session() as db:
        db_session = UserSession(
            user_id=user_id,
            tenant_id=tenant_id,
            token_hash=token_hash,
            expires_at=expires_at,
            last_accessed_at=datetime.utcnow(),
        )
        db.add(db_session)
        db.commit()

    return token


def validate_session(token: str) -> Optional[User]:
    if not token:
        return None

    token_hash = _hash_token(token)

    cached = l1_get(f"session:{token_hash}")
    if cached and time.time() < cached["expires_ts"]:
        with get_db_session() as db:
            db.expire_on_commit = False
            return db.get(User, cached["user_id"])
    if cached:
        return None

    cached_str = cache_get(f"session:{token_hash}")
    if cached_str:
        try:
            data = json.loads(cached_str)
            if time.time() >= data["expires_ts"]:
                cache_delete(f"session:{token_hash}")
                return None
            remaining = data["expires_ts"] - time.time()
            l1_set(f"session:{token_hash}", data, ttl=min(int(remaining), 60))
            with get_db_session() as db:
                db.expire_on_commit = False
                return db.get(User, data["user_id"])
        except (json.JSONDecodeError, KeyError):
            cache_delete(f"session:{token_hash}")
            return None

    with get_db_session() as db:
        db.expire_on_commit = False
        stmt = select(UserSession).where(UserSession.token_hash == token_hash)
        db_session = db.exec(stmt).first()

        if not db_session:
            return None

        now = datetime.utcnow()
        if db_session.expires_at < now:
            db.delete(db_session)
            db.commit()
            return None

        user = db.get(User, db_session.user_id)
        if not user:
            db.delete(db_session)
            db.commit()
            return None

        remaining = db_session.expires_at.timestamp() - time.time()
        l2_ttl = max(int(remaining), 60)
        l1_ttl = min(int(remaining), 60)
        session_data = {"user_id": user.id, "expires_ts": db_session.expires_at.timestamp()}

        cache_set(f"session:{token_hash}", json.dumps(session_data), ttl=l2_ttl)
        l1_set(f"session:{token_hash}", session_data, ttl=l1_ttl)

        db_session.last_accessed_at = now
        db.add(db_session)
        db.commit()

        return user


def delete_session(token: str):
    if not token:
        return
    token_hash = _hash_token(token)
    cache_delete(f"session:{token_hash}")

    with get_db_session() as db:
        stmt = select(UserSession).where(UserSession.token_hash == token_hash)
        db_session = db.exec(stmt).first()
        if db_session:
            db.delete(db_session)
            db.commit()


def delete_all_user_sessions(user_id: int):
    with get_db_session() as db:
        stmt = select(UserSession).where(UserSession.user_id == user_id)
        sessions = db.exec(stmt).all()
        for s in sessions:
            cache_delete(f"session:{s.token_hash}")
            db.delete(s)
        db.commit()


def clean_expired_sessions():
    with get_db_session() as db:
        stmt = select(UserSession).where(UserSession.expires_at < datetime.utcnow())
        expired = db.exec(stmt).all()
        for s in expired:
            cache_delete(f"session:{s.token_hash}")
            db.delete(s)
        db.commit()
