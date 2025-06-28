from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ServicePortConfig(BaseModel):
    port: int
    target_port: int
    protocol: Optional[str] = "TCP"

class ResourceRequirements(BaseModel):
    requests: Optional[Dict[str, str]] = None  # e.g., {"cpu": "100m", "memory": "128Mi"}
    limits: Optional[Dict[str, str]] = None    # e.g., {"cpu": "200m", "memory": "256Mi"}

class EnvVar(BaseModel):
    name: str
    value: Optional[str] = None
    value_from: Optional[Dict[str, Any]] = None  # For configMap/secret refs

class ContainerConfig(BaseModel):
    name: str
    command: Optional[List[str]] = None
    args: Optional[List[str]] = None
    env: Optional[List[EnvVar]] = None
    ports: Optional[List[ServicePortConfig]] = None
    resources: Optional[ResourceRequirements] = None

class DeploymentConfigType(BaseModel):
    id: Optional[int] = None
    type: str
    namespace: str
    deployment_name: str
    tag: str
    code_source_control_name: str
    deployment_strategy_id: int
    replicas: Optional[int] = 1
    containers: List[ContainerConfig]
    service_ports: Optional[List[ServicePortConfig]] = None
    labels: Optional[Dict[str, str]] = None
    annotations: Optional[Dict[str, str]] = None
    soft_delete: bool = False
    deleted_at: Optional[datetime] = None
    hard_delete: bool = False
    # Add more fields as needed 