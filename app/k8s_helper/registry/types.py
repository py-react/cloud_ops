from pydantic import BaseModel
from typing import Optional
class SetReplicas(BaseModel):
    count: int

class SetContainerImage(BaseModel):
    container_name: str
    new_image: str

class SetLabels(BaseModel):
    labels: dict

class SetAnnotations(BaseModel):
    annotations: dict

class RemoveEnvVars(BaseModel):
    container_name: str
    var_names: list

class SetResources(BaseModel):
    container_name: str
    requests: Optional[dict] = None
    limits: Optional[dict] = None

class AddVolume(BaseModel):
    volume: dict
    mount: dict

class RemoveVolume(BaseModel):
    volume_name: str

class AddEnvVars(BaseModel):
    container_name: str
    env_vars: dict

class AddPort(BaseModel):
    container_name: str
    port_spec: dict

class RemovePort(BaseModel):
    container_name: str
    port_name: str

class SetStrategy(BaseModel):
    strategy: dict

class SetNodeSelector(BaseModel):
    selector: dict

class SetAffinity(BaseModel):
    affinity: dict

class SetTolerations(BaseModel):
    tolerations: list

class AddInitContainer(BaseModel):
    init: dict

class AddSidecarContainer(BaseModel):
    sidecar: dict

class RemoveInitContainer(BaseModel):
    name: str

class RemoveSidecarContainer(BaseModel):
    name: str

class UpdateConfigMapData(BaseModel):
    new_data: dict

class UpdateSecretData(BaseModel):
    new_data: dict

class SetServiceType(BaseModel):
    new_type: str

class SetServicePorts(BaseModel):
    ports: list

class SetStorageClass(BaseModel):
    sc_name: str
