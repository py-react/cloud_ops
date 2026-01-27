from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import date

class ServicePortConfig(BaseModel):
    port: int
    target_port: int
    protocol: Optional[str] = "TCP"

class ContainerPortConfig(BaseModel):
    containerPort: int
    name: Optional[str] = None
    protocol: Optional[str] = "TCP"  # TCP, UDP, SCTP

class ResourceRequirements(BaseModel):
    requests: Optional[Dict[str, str]] = None  # e.g., {"cpu": "100m", "memory": "128Mi"}
    limits: Optional[Dict[str, str]] = None    # e.g., {"cpu": "200m", "memory": "256Mi"}

class EnvVar(BaseModel):
    name: str
    value: Optional[str] = None
    valueFrom: Optional[Dict[str, Any]] = None  # For configMap/secret refs

class VolumeMount(BaseModel):
    name: str
    mountPath: str
    readOnly: Optional[bool] = False

class Probe(BaseModel):
    httpGet: Optional[Dict[str, Any]] = None
    exec: Optional[Dict[str, Any]] = None
    tcpSocket: Optional[Dict[str, Any]] = None
    initialDelaySeconds: Optional[int] = None
    periodSeconds: Optional[int] = None
    timeoutSeconds: Optional[int] = None
    successThreshold: Optional[int] = None
    failureThreshold: Optional[int] = None

class Lifecycle(BaseModel):
    preStop: Optional[Dict[str, Any]] = None
    postStart: Optional[Dict[str, Any]] = None

class SecurityContext(BaseModel):
    allowPrivilegeEscalation: Optional[bool] = None
    runAsNonRoot: Optional[bool] = None
    runAsUser: Optional[int] = None
    readOnlyRootFilesystem: Optional[bool] = None

class ContainerConfig(BaseModel):
    name: str
    image: Optional[str] = None
    command: Optional[List[str]] = None
    args: Optional[List[str]] = None
    workingDir: Optional[str] = None
    env: Optional[List[EnvVar]] = None
    envFrom: Optional[List[Dict[str, Any]]] = None
    ports: Optional[List[ContainerPortConfig]] = None
    resources: Optional[ResourceRequirements] = None
    volumeMounts: Optional[List[VolumeMount]] = None
    livenessProbe: Optional[Probe] = None
    readinessProbe: Optional[Probe] = None
    startupProbe: Optional[Probe] = None
    lifecycle: Optional[Lifecycle] = None
    terminationMessagePath: Optional[str] = None
    terminationMessagePolicy: Optional[str] = None
    imagePullPolicy: Optional[str] = None
    securityContext: Optional[SecurityContext] = None
    stdin: Optional[bool] = None
    stdinOnce: Optional[bool] = None
    tty: Optional[bool] = None

# Kubernetes Toleration
class K8sToleration(BaseModel):
    key: Optional[str] = None
    operator: Optional[str] = None  # Equal, Exists
    value: Optional[str] = None
    effect: Optional[str] = None  # NoSchedule, PreferNoSchedule, NoExecute
    tolerationSeconds: Optional[int] = None

# Kubernetes Node Affinity
class NodeSelectorTerm(BaseModel):
    matchExpressions: Optional[List[Dict[str, Any]]] = None
    matchFields: Optional[List[Dict[str, Any]]] = None

class NodeSelector(BaseModel):
    nodeSelectorTerms: List[NodeSelectorTerm]

class PreferredSchedulingTerm(BaseModel):
    weight: int
    preference: NodeSelectorTerm

class NodeAffinity(BaseModel):
    requiredDuringSchedulingIgnoredDuringExecution: Optional[NodeSelector] = None
    preferredDuringSchedulingIgnoredDuringExecution: Optional[List[PreferredSchedulingTerm]] = None

# Kubernetes Pod Affinity
class PodAffinityTerm(BaseModel):
    labelSelector: Optional[Dict[str, Any]] = None
    namespaces: Optional[List[str]] = None
    topologyKey: str

class WeightedPodAffinityTerm(BaseModel):
    weight: int
    podAffinityTerm: PodAffinityTerm

class PodAffinity(BaseModel):
    requiredDuringSchedulingIgnoredDuringExecution: Optional[List[PodAffinityTerm]] = None
    preferredDuringSchedulingIgnoredDuringExecution: Optional[List[WeightedPodAffinityTerm]] = None

class PodAntiAffinity(BaseModel):
    requiredDuringSchedulingIgnoredDuringExecution: Optional[List[PodAffinityTerm]] = None
    preferredDuringSchedulingIgnoredDuringExecution: Optional[List[WeightedPodAffinityTerm]] = None

class K8sAffinity(BaseModel):
    nodeAffinity: Optional[NodeAffinity] = None
    podAffinity: Optional[PodAffinity] = None
    podAntiAffinity: Optional[PodAntiAffinity] = None

# Kubernetes Volumes
class K8sEmptyDirVolume(BaseModel):
    medium: Optional[str] = None  # "", "Memory"
    sizeLimit: Optional[str] = None

class K8sConfigMapVolume(BaseModel):
    name: str
    defaultMode: Optional[int] = None
    optional: Optional[bool] = None

class K8sSecretVolume(BaseModel):
    secretName: str
    defaultMode: Optional[int] = None
    optional: Optional[bool] = None

class K8sPersistentVolumeClaimVolume(BaseModel):
    claimName: str
    readOnly: Optional[bool] = None

class K8sVolume(BaseModel):
    name: str
    emptyDir: Optional[K8sEmptyDirVolume] = None
    configMap: Optional[K8sConfigMapVolume] = None
    secret: Optional[K8sSecretVolume] = None
    persistentVolumeClaim: Optional[K8sPersistentVolumeClaimVolume] = None

class DeploymentConfigType(BaseModel):
    id: Optional[int] = None
    type: str
    namespace: str
    deployment_name: str
    status: str = "active"  # active or inactive
    tag: Optional[str] = None  # Optional since it comes from derived deployment
    required_source_control: bool = False
    code_source_control_name: Optional[str] = None
    source_control_branch: Optional[str] = None
    derived_deployment_id: Optional[int] = None
    service_id: Optional[int] = None
    replicas: Optional[int] = 1
    
    # NEW: Reusable Profile IDs (preferred approach)
    scheduling_profile_id: Optional[int] = None
    container_profile_ids: Optional[List[int]] = None
    volume_profile_ids: Optional[List[int]] = None
    
    # Legacy: Direct embedded config (optional for backward compatibility)
    containers: Optional[List[ContainerConfig]] = None
    service_ports: Optional[List[ServicePortConfig]] = None
    labels: Optional[Dict[str, str]] = None
    annotations: Optional[Dict[str, str]] = None
    node_selector: Optional[Dict[str, str]] = None
    tolerations: Optional[List[K8sToleration]] = None
    affinity: Optional[K8sAffinity] = None
    volumes: Optional[List[K8sVolume]] = None
    soft_delete: bool = False
    deleted_at: Optional[date] = None
    hard_delete: bool = False