import json
from typing import Dict, Any, List, Union
from sqlmodel import Session, select
from ..models.deployment_config.deployment_config import DeploymentConfig
from ..models.kubernetes_profiles.deployment import K8sDeployment
from ..models.kubernetes_profiles.pod import K8sPod
from ..models.kubernetes_profiles.container import K8sContainerProfile
from ..models.kubernetes_profiles.pod_metadata_profile import K8sPodMetaDataProfile
from ..models.kubernetes_profiles.pod_profile import K8sPodProfile
from ..models.kubernetes_profiles.profile import K8sEntityProfile

class DeploymentComposer:
    def __init__(self, session: Session):
        self.session = session

    def _parse_json(self, data: Any) -> Union[Dict[str, Any], List[Any]]:
        """Safely parse JSON data if it's a string, otherwise return as dict or list."""
        if isinstance(data, str):
            try:
                parsed = json.loads(data)
                return parsed if isinstance(parsed, (dict, list)) else {}
            except (json.JSONDecodeError, TypeError):
                return {}
        return data if isinstance(data, (dict, list)) else {}

    def compose(self, release_config: DeploymentConfig) -> Dict[str, Any]:
        """
        Assembles a full deployment specification from a release config.
        If derived_deployment_id is set, it pulls data from the library deployment.
        """
        result = release_config.dict()
        
        # If no library deployment is linked, return basic config
        if not release_config.derived_deployment_id:
            # For backward compatibility or direct configs, return what we have
            return result

        # Load library deployment
        lib_deployment = self.session.get(K8sDeployment, release_config.derived_deployment_id)
        if not lib_deployment:
            return result

        # Overwrite/Merge basic fields
        # Replicas from release config takes priority
        result["replicas"] = release_config.replicas if release_config.replicas is not None else lib_deployment.replicas
        
        # Resolve Pod Spec hierarchy
        if lib_deployment.pod_id:
            pod = self.session.get(K8sPod, lib_deployment.pod_id)
            if pod:
                self._resolve_pod_details(pod, result)
        
        # 4. Resolve Library-level Dynamic Attributes (Deployment Profiles)
        lib_dynamic_attr = self._parse_json(lib_deployment.dynamic_attr)
        if lib_dynamic_attr:
            for key, profile_id in lib_dynamic_attr.items():
                profile = self.session.get(K8sEntityProfile, profile_id)
                if profile:
                    profile_config = self._parse_json(profile.config)
                    if profile_config:
                        result[key] = profile_config
        
        # Handle status display mapping if missing
        if "status" not in result or not result["status"]:
            result["status"] = "active"
            
        return result

    def _parse_list(self, data: Any) -> List[Any]:
        """Safely parse JSON data if it's a string, otherwise return as list."""
        if isinstance(data, str):
            try:
                parsed = json.loads(data)
                return parsed if isinstance(parsed, list) else []
            except (json.JSONDecodeError, TypeError):
                return []
        return data if isinstance(data, list) else []

    def _resolve_pod_details(self, pod: K8sPod, result: Dict[str, Any]):
        """Resolves metadata, containers, and scheduling for a pod."""
        
        # 1. Resolve Pod Metadata (Labels, Annotations)
        if pod.metadata_profile_id:
            meta = self.session.get(K8sPodMetaDataProfile, pod.metadata_profile_id)
            if meta:
                meta_config = self._parse_json(meta.config)
                if meta_config:
                    # Generic merge: labels, annotations, etc.
                    result.update(meta_config)

        # 2. Resolve Containers
        containers = []
        pod_containers = self._parse_list(pod.containers)
        for container_id in pod_containers:
            container_profile = self.session.get(K8sContainerProfile, container_id)
            if container_profile:
                containers.append(self._resolve_container(container_profile))
        result["containers"] = containers

        # 3. Resolve Generic Pod Attributes (scheduling, volumes, etc.)
        pod_dynamic_attr = self._parse_json(pod.dynamic_attr)
        if pod_dynamic_attr:
            for key, profile_id in pod_dynamic_attr.items():
                # Try PodProfile first
                profile = self.session.get(K8sPodProfile, profile_id)
                # Fallback to EntityProfile (e.g. for volumes)
                if not profile:
                    profile = self.session.get(K8sEntityProfile, profile_id)
                
                if profile:
                    profile_config = self._parse_json(profile.config)
                    if profile_config:
                        # Special case for 'scheduling' to map flat into pod
                        if key == "scheduling":
                            result.update(profile_config)
                            # Handle naming mismatch for service account in scheduling profile
                            if "serviceAccountName" in profile_config:
                                result["service_account_name"] = profile_config["serviceAccountName"]
                        else:
                            # Map key directly (e.g., volumes)
                            result[key] = self._normalize_attribute(key, profile_config)

        # Use pod's own service account if specified and not yet overridden
        if pod.service_account_name and not result.get("service_account_name"):
            result["service_account_name"] = pod.service_account_name

    def _resolve_container(self, profile: K8sContainerProfile) -> Dict[str, Any]:
        """Resolves a container profile into the format expected by the frontend."""
        container = profile.dict()
        
        # Clean up internal fields
        if "id" in container:
            container["profile_id"] = container.pop("id")
        if "name" in container:
            container["profile_name"] = container.pop("name")
            container["name"] = container["profile_name"]

        # 4. Resolve Generic Container Attributes (ports, env, probes, resources, etc.)
        profile_dynamic_attr = self._parse_json(profile.dynamic_attr)
        if profile_dynamic_attr:
            for key, profile_id in profile_dynamic_attr.items():
                entity_profile = self.session.get(K8sEntityProfile, profile_id)
                if entity_profile:
                    entity_config = self._parse_json(entity_profile.config)
                    if entity_config is not None:
                        container[key] = self._normalize_attribute(key, entity_config)
        
        return container

    def _normalize_attribute(self, key: str, config: Any) -> Any:
        """Applies essential normalizations for specific K8s attributes."""
        
        # 1. Environment Variables
        if key == "env":
            if isinstance(config, dict):
                return [{"name": k, "value": str(v)} for k, v in config.items()]
            env_list = config if isinstance(config, list) else [config]
            return [{
                "name": e.get("name"),
                "value": str(e.get("value", ""))
            } for e in env_list if isinstance(e, dict)]
        
        # 2. Ports (Ensure camelCase for frontend/generator)
        elif key == "ports":
            ports_list = config if isinstance(config, list) else [config]
            return [{
                "containerPort": p.get("containerPort") or p.get("container_port"),
                "name": p.get("name"),
                "protocol": p.get("protocol", "TCP")
            } for p in ports_list if isinstance(p, dict)]

        # 3. Volume Mounts
        elif key == "volumeMounts":
            mounts_list = config if isinstance(config, list) else [config]
            return [{
                "name": m.get("name"),
                "mountPath": m.get("mountPath") or m.get("mount_path"),
                "readOnly": m.get("readOnly") or m.get("read_only", False)
            } for m in mounts_list if isinstance(m, dict)]

        # 4. Pod Volumes
        elif key == "volumes":
            vol_list = config if isinstance(config, list) else [config]
            result_vols = []
            for v in vol_list:
                if isinstance(v, dict):
                    mapped_vol = {
                        "name": v.get("name"),
                        "emptyDir": v.get("emptyDir") or v.get("empty_dir"),
                        "configMap": v.get("configMap") or v.get("config_map"),
                        "secret": v.get("secret"),
                        "persistentVolumeClaim": v.get("persistentVolumeClaim") or v.get("persistent_volume_claim")
                    }
                    result_vols.append({k: val for k, val in mapped_vol.items() if val is not None})
            return result_vols

        return config
