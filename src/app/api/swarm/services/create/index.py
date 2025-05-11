import docker
from pydantic import BaseModel
from typing import Optional, List, Dict

class ServiceCreationSpec(BaseModel):
    image: str  # Image is required
    command: Optional[List[str]] = None
    args: Optional[List[str]] = None
    constraints: Optional[List[str]] = None
    preferences: Optional[List[tuple]] = None
    maxreplicas: Optional[int] = None
    container_labels: Optional[Dict[str, str]] = None
    env: Optional[List[str]] = None
    hostname: Optional[str] = None
    init: Optional[bool] = False
    isolation: Optional[str] = None
    labels: Optional[Dict[str, str]] = None
    log_driver: Optional[str] = "json-file"
    mode: Optional[str] = "replicated"  # Default to "replicated"
    networks: Optional[List[str]] = None
    resources: Optional[Dict] = None
    restart_policy: Optional[str] = "any"
    update_config: Optional[Dict] = None
    rollback_config: Optional[Dict] = None
    secrets: Optional[List[str]] = None
    stop_grace_period: Optional[int] = None
    workdir: Optional[str] = None
    tty: Optional[bool] = False
    open_stdin: Optional[bool] = False
    read_only: Optional[bool] = False
    stop_signal: Optional[str] = None
    healthcheck: Optional[Dict] = None
    hosts: Optional[Dict] = None
    dns_config: Optional[Dict] = None
    configs: Optional[List[str]] = None
    privileges: Optional[Dict] = None
    cap_add: Optional[List[str]] = None
    cap_drop: Optional[List[str]] = None
    sysctls: Optional[Dict[str, str]] = None


async def POST(service_data: ServiceCreationSpec):
    try:
        # Initialize Docker client
        client = docker.from_env()
        # Create a new service in the swarm
        service = client.services.create(**service_data)
        return {"status": "Service created successfully", "service_id": service.id}
    except docker.errors.APIError as e:
        return {"error":True,"message": f"Error creating service: {e}"}