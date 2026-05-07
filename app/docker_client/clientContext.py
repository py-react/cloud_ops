import docker
import os
import tempfile
import contextvars
from typing import Optional
from app.db_client.db import get_session
from app.db_client.controllers.docker_config.docker_config import (
    get_active_docker_config,
    get_docker_config
)

_engine_id_context = contextvars.ContextVar("engine_id", default=None)
_clients_cache = {} # { config_id: client }

# Track temp files to avoid accumulation
_temp_files = []

def _cleanup_temp_files():
    global _temp_files
    for f_path in _temp_files:
        try:
            if os.path.exists(f_path):
                os.remove(f_path)
        except Exception as e:
            print(f"Error cleaning up temp file {f_path}: {e}")
    _temp_files = []

def set_engine_id(engine_id: int):
    """Set the Docker Engine ID for the current asyncio context."""
    _engine_id_context.set(engine_id)

def get_engine_id(use_active: bool = True) -> Optional[int]:
    """Resolves the current engine ID."""
    engine_id = _engine_id_context.get()
    if engine_id is None and use_active:
        try:
            with get_session() as session:
                active_config = get_active_docker_config(session)
                if active_config:
                    return active_config.id
                return 0 # Local
        except Exception:
            return 0
    return engine_id or 0

def reset():
    """Reset the asyncio-local Docker Engine context."""
    _engine_id_context.set(None)

def get_client(use_active: bool = True) -> docker.DockerClient:
    """Gets the correct Docker client based on the current thread's configured engine.
    
    Resolution priority:
    1. _engine_id_context (if set and > 0) -> specific remote engine
    2. _engine_id_context == 0 -> explicit local engine
    3. _engine_id_context is None AND use_active=True -> globally active engine from DB
    4. fallback -> local engine
    """
    engine_id = _engine_id_context.get()
    active_config = None
    
    # If engine_id is None and use_active is True, try to get the globally active config
    if engine_id is None and use_active:
        try:
            with get_session() as session:
                active_config = get_active_docker_config(session)
                if active_config:
                    engine_id = active_config.id
        except Exception as e:
            raise Exception(f"Error fetching active docker config from DB: {e}")
    # engine_id == 0 or (engine_id is None and active_config is None) means local
    if engine_id is None or engine_id == 0:
        if "local" not in _clients_cache:
            _clients_cache["local"] = docker.from_env()
        return _clients_cache["local"]
    
    # If we already fetched active_config above, we can use it.
    # Otherwise, we need to fetch the specific engine_id.
    if not active_config:
        try:
            with get_session() as session:
                active_config = get_docker_config(session, engine_id)
        except Exception as e:
            raise Exception(f"Error fetching docker config {engine_id} from DB: {e}")
    
    if not active_config:
        raise Exception(f"Docker config {engine_id} not found.")
    current_active_id = active_config.id
    
    # Return cached client if available
    if current_active_id in _clients_cache:
        return _clients_cache[current_active_id]
        
    _cleanup_temp_files()
    
    tls_config = None
    if active_config.client_cert or active_config.ca_cert:
        cert_path = None
        key_path = None
        ca_path = None
        
        try:
            if active_config.client_cert:
                cert_content = active_config.client_cert
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as f:
                    f.write(cert_content.encode())
                    cert_path = f.name
                    _temp_files.append(cert_path)
            
            if active_config.client_key:
                key_content = active_config.client_key
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as f:
                    f.write(key_content.encode())
                    key_path = f.name
                    _temp_files.append(key_path)
            
            if active_config.ca_cert:
                ca_content = active_config.ca_cert
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as f:
                    f.write(ca_content.encode())
                    ca_path = f.name
                    _temp_files.append(ca_path)
        except Exception as e:
            raise Exception(f"Decryption or extraction of Docker certs failed: {e}")
        
        tls_config = docker.tls.TLSConfig(
            client_cert=(cert_path, key_path) if cert_path and key_path else None,
            ca_cert=ca_path if ca_path else None,
            verify=active_config.verify
        )
    
    try:
        client = docker.DockerClient(
            base_url=active_config.base_url,
            tls=tls_config,
            timeout=30 # Set a reasonable timeout to prevent 60s hangs
        )
    except Exception as e:
        raise Exception(f"Failed to initialize remote Docker client {current_active_id}: {e}")
    
    _clients_cache[current_active_id] = client
    return client