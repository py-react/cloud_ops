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

    def _parse_json(self, data: Any) -> Dict[str, Any]:
        """Safely parse JSON data if it's a string, otherwise return as dict."""
        if isinstance(data, str):
            try:
                parsed = json.loads(data)
                return parsed if isinstance(parsed, dict) else {}
            except (json.JSONDecodeError, TypeError):
                return {}
        return data if isinstance(data, dict) else {}

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
        
        # 1. Resolve Labels & Annotations from Pod Metadata Profile
        if pod.metadata_profile_id:
            meta = self.session.get(K8sPodMetaDataProfile, pod.metadata_profile_id)
            if meta:
                meta_config = self._parse_json(meta.config)
                if meta_config:
                    result["labels"] = meta_config.get("labels", {})
                    result["annotations"] = meta_config.get("annotations", {})

        # 2. Resolve Containers
        containers = []
        pod_containers = self._parse_list(pod.containers)
        for container_id in pod_containers:
            container_profile = self.session.get(K8sContainerProfile, container_id)
            if container_profile:
                containers.append(self._resolve_container(container_profile))
        result["containers"] = containers

        # 3. Resolve Scheduling (Affinity, etc.)
        pod_dynamic_attr = self._parse_json(pod.dynamic_attr)
        scheduling_id = pod_dynamic_attr.get("scheduling") if pod_dynamic_attr else None
        if scheduling_id:
            sched = self.session.get(K8sPodProfile, scheduling_id)
            if sched:
                sched_config = self._parse_json(sched.config)
                if sched_config:
                    result["affinity"] = sched_config.get("affinity", {})
                    # Add service account if present in scheduling config
                    if "serviceAccountName" in sched_config:
                        result["service_account_name"] = sched_config["serviceAccountName"]

    def _resolve_container(self, profile: K8sContainerProfile) -> Dict[str, Any]:
        """Resolves a container profile into the format expected by the frontend."""
        container = profile.dict()
        
        # Clean up internal fields
        if "id" in container:
            container["profile_id"] = container.pop("id")
        if "name" in container:
            container["profile_name"] = container.pop("name")
            container["name"] = container["profile_name"]

        # Resolve dynamic attributes (probes, resources, env)
        profile_dynamic_attr = self._parse_json(profile.dynamic_attr)
        if profile_dynamic_attr:
            # Map of key names in frontend K8sContainer to profile types
            attr_map = {
                "livenessProbe": "livenessProbe",
                "readinessProbe": "readinessProbe",
                "startupProbe": "startupProbe",
                "resources": "resources",
                "env": "env",
            }
            
            for frontend_key, profile_type in attr_map.items():
                profile_id = profile_dynamic_attr.get(profile_type)
                if profile_id:
                    entity_profile = self.session.get(K8sEntityProfile, profile_id)
                    if entity_profile:
                        entity_config = self._parse_json(entity_profile.config)
                        if entity_config:
                            # For 'env', we might need to handle it as a list if it's stored as a dict
                            if profile_type == "env":
                                if isinstance(entity_config, dict):
                                    container["env"] = [{"name": k, "value": str(v)} for k, v in entity_config.items()]
                                else:
                                    container["env"] = entity_config
                            else:
                                container[frontend_key] = entity_config
        
        return container
