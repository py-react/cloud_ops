import docker
import os
import tempfile
import threading
from typing import Optional
from app.db_client.db import get_session
from app.db_client.controllers.docker_config.docker_config import (
    get_active_docker_config,
    get_docker_config
)

_thread_local = threading.local()
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
    """Set the Docker Engine ID for the current background thread."""
    _thread_local.engine_id = engine_id

def reset():
    """Reset the thread-local Docker Engine context."""
    if hasattr(_thread_local, 'engine_id'):
        delattr(_thread_local, 'engine_id')

def get_client() -> docker.DockerClient:
    """Gets the correct Docker client based on the current thread's configured engine.
    
    Resolution priority:
    - engine_id is None OR 0  → always use local Docker daemon (docker.from_env())
    - engine_id > 0           → use that specific engine from the DB
    
    The "global active" engine is intentionally NOT used as a fallback here.
    Builds should never accidentally use a remote engine. Remote engines must be
    explicitly configured per repo/branch.
    """
    engine_id = getattr(_thread_local, 'engine_id', None)
    
    # None or 0 both mean local — None because nothing was configured (0 was
    # converted to None at the DB layer to satisfy FK constraints), 0 as explicit sentinel.
    if engine_id is None or engine_id == 0:
        if "local" not in _clients_cache:
            _clients_cache["local"] = docker.from_env()
        return _clients_cache["local"]
    
    # engine_id > 0: look up the specific engine from the DB
    try:
        with get_session() as session:
            active_config = get_docker_config(session, engine_id)
    except Exception as e:
        print(f"Error fetching docker config {engine_id} from DB: {e}. Falling back to local.")
        active_config = None
    
    if not active_config:
        print(f"Docker config {engine_id} not found. Falling back to local.")
        if "local" not in _clients_cache:
            _clients_cache["local"] = docker.from_env()
        return _clients_cache["local"]
    
    current_active_id = active_config.id
    
    # Return cached client if available
    if current_active_id in _clients_cache:
        return _clients_cache[current_active_id]
        
    print(f"Initializing Docker client with config ID: {current_active_id}")
    _cleanup_temp_files()
    
    tls_config = None
    if active_config.client_cert or active_config.ca_cert:
        cert_path = None
        key_path = None
        ca_path = None
        
        if active_config.client_cert:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as f:
                f.write(active_config.client_cert.encode())
                cert_path = f.name
                _temp_files.append(cert_path)
        
        if active_config.client_key:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as f:
                f.write(active_config.client_key.encode())
                key_path = f.name
                _temp_files.append(key_path)
        
        if active_config.ca_cert:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as f:
                f.write(active_config.ca_cert.encode())
                ca_path = f.name
                _temp_files.append(ca_path)
        
        tls_config = docker.tls.TLSConfig(
            client_cert=(cert_path, key_path) if cert_path and key_path else None,
            ca_cert=ca_path if ca_path else None,
            verify=active_config.verify
        )
    
    try:
        client = docker.DockerClient(
            base_url=active_config.base_url,
            tls=tls_config
        )
    except Exception as e:
        print(f"Failed to initialize remote Docker client {current_active_id}: {e}. Falling back to local.")
        client = docker.from_env()
        current_active_id = "local"
    
    _clients_cache[current_active_id] = client
    return client