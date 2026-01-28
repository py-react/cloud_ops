from typing import Dict, Any, List
from sqlmodel import Session, select
from kubernetes import client
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from app.db_client.models.kubernetes_profiles.container import K8sContainerProfile

class DeploymentGenerator:
    def __init__(self, session: Session):
        self.session = session

    def generate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a Kubernetes Deployment YAML (dict) from the composed data.
        """
        deployment_name = data.get("deployment_name")
        namespace = data.get("namespace")
        
        # 1. Metadata
        metadata = client.V1ObjectMeta(
            name=deployment_name,
            namespace=namespace,
            labels=(data.get("labels") or {}),
            annotations=(data.get("annotations") or {})
        )

        # 2. Pod Spec Construction
        pod_spec = self._build_pod_spec(data)

        # 3. Pod Template
        # 3. Pod Template
        # Ensure 'app' label exists for selector match (FORCE OVERWRITE)
        labels = (data.get("labels") or {}).copy()
        labels["app"] = deployment_name  # Force match selector

        template = client.V1PodTemplateSpec(
            metadata=client.V1ObjectMeta(
                labels=labels,
                annotations=data.get("annotations")
            ),
            spec=pod_spec
        )

        # 4. Spec Construction based on Kind
        kind = data.get("kind", "Deployment")
        
        # Common fields
        replicas = data.get("replicas", 1)
        
        custom_selector = data.get("selector")
        if custom_selector:
             # Map the selector object (which might have matchLabels, matchExpressions)
             selector = client.V1LabelSelector(
                 match_labels=custom_selector.get("matchLabels"),
                 match_expressions=custom_selector.get("matchExpressions")
             )
        else:
             selector = client.V1LabelSelector(match_labels={"app": deployment_name})
        
        if kind == "StatefulSet":
            spec = client.V1StatefulSetSpec(
                service_name=deployment_name, # Requirement for StatefulSet
                replicas=replicas,
                selector=selector,
                template=template
            )
            workload_obj = client.V1StatefulSet(
                api_version="apps/v1",
                kind="StatefulSet",
                metadata=metadata,
                spec=spec
            )
            
        elif kind == "ReplicaSet":
            spec = client.V1ReplicaSetSpec(
                replicas=replicas,
                selector=selector,
                template=template
            )
            workload_obj = client.V1ReplicaSet(
                api_version="apps/v1",
                kind="ReplicaSet",
                metadata=metadata,
                spec=spec
            )
            
        else: # Default to Deployment
            spec = client.V1DeploymentSpec(
                replicas=replicas,
                selector=selector,
                template=template
            )
            workload_obj = client.V1Deployment(
                api_version="apps/v1",
                kind="Deployment",
                metadata=metadata,
                spec=spec
            )
            
        # 5. Full Object Serialization
        return client.ApiClient().sanitize_for_serialization(workload_obj)

    def _build_pod_spec(self, data: Dict[str, Any]) -> client.V1PodSpec:
        containers = []
        
        composed_containers = data.get("containers", [])
        for c_data in composed_containers:
            if c_data:
                containers.append(self._build_container(c_data))

        # Build Volumes
        volumes = []
        if data.get("volumes"):
            for v_data in data["volumes"]:
                volumes.append(self._build_volume(v_data))

        affinity_data = data.get("affinity")
        affinity = client.V1Affinity(**affinity_data) if affinity_data else None

        # Map dynamic attributes (dnsPolicy, restartPolicy, etc.)
        dynamic_kwargs = self._map_dynamic_attrs(data, client.V1PodSpec, exclude=[
             "containers", "volumes", "service_account_name", "affinity", "node_selector", "tolerations"
        ])

        return client.V1PodSpec(
            containers=containers,
            volumes=volumes if volumes else None,
            service_account_name=data.get("service_account_name"),
            affinity=affinity,
            node_selector=data.get("node_selector"),
            tolerations=data.get("tolerations"),
            **dynamic_kwargs
        )

    def _build_container(self, c_data: Dict[str, Any]) -> client.V1Container:
        # Helper to map camelCase probes to snake_case
        def map_probe(probe_dict):
            if not probe_dict: return None
            return probe_dict

        # Sanitize container name
        container_name = self._sanitize_container_name(c_data.get("name"))
        
        # Ensure image is never None
        image = c_data.get("image")
        if not image:
            image = "<IMAGE_NAME_FILLED_AT_RUNTIME>"

        return client.V1Container(
            name=container_name,
            image=image,
            image_pull_policy=c_data.get("image_pull_policy", "IfNotPresent"),
            command=c_data.get("command"),
            args=c_data.get("args"),
            working_dir=c_data.get("working_dir"),
            resources=c_data.get("resources"),
            liveness_probe=map_probe(c_data.get("livenessProbe")),
            readiness_probe=map_probe(c_data.get("readinessProbe")),
            startup_probe=map_probe(c_data.get("startupProbe")),
            
            # Debugging Env
            # env=[client.V1EnvVar(name=e.get("name"), value=str(e.get("value", ""))) for e in c_data.get("env", [])] if c_data.get("env") else None,
            env=self._build_env(c_data.get("env")),
            ports=[client.V1ContainerPort(container_port=p["containerPort"], name=p.get("name"), protocol=p.get("protocol", "TCP")) for p in c_data.get("ports", [])] if c_data.get("ports") else None,
            volume_mounts=[client.V1VolumeMount(name=vm["name"], mount_path=vm["mountPath"], read_only=vm.get("readOnly", False)) for vm in c_data.get("volumeMounts", [])] if c_data.get("volumeMounts") else None,
            tty=c_data.get("tty"),
            stdin=c_data.get("stdin"),
            **self._map_dynamic_attrs(c_data, client.V1Container, exclude=[
                "name", "image", "image_pull_policy", "command", "args", "working_dir", 
                "resources", "liveness_probe", "readiness_probe", "startup_probe", 
                "env", "ports", "volume_mounts", "tty", "stdin"
            ])
        )

    def _build_env(self, env_data):
        if not env_data:
            return None
        
        result = []
        import sys
        
        try:
            # sys.stderr.write(f"DEBUG ENV DATA TYPE: {type(env_data)}\n")
            # sys.stderr.write(f"DEBUG ENV DATA CONTENT: {env_data}\n")
            
            for e in env_data:
                # sys.stderr.write(f"DEBUG ENV ITEM: {e} TYPE: {type(e)}\n")
                if isinstance(e, dict):
                     # Safe access with defaults
                    name = e.get("name")
                    value = str(e.get("value", ""))
                    if name:
                        result.append(client.V1EnvVar(name=name, value=value))
                else:
                    sys.stderr.write(f"WARNING: Skipping invalid env item: {e}\n")
                    
        except Exception as ex:
            sys.stderr.write(f"ERROR constructing env vars: {ex}\n")
            # Don't crash the whole generation for env vars
            return None
            
        return result

    def _build_volume(self, v_data: Dict[str, Any]) -> client.V1Volume:
        return client.V1Volume(
            name=v_data.get("name"),
            empty_dir=v_data.get("emptyDir"),
            config_map=v_data.get("configMap"),
            secret=v_data.get("secret"),
            persistent_volume_claim=v_data.get("persistentVolumeClaim")
        )

    def _sanitize_container_name(self, name: str) -> str:
        """
        Sanitizes the container name to be RFC 1123 compliant.
        - Lowercase only
        - Alphanumeric and hyphens only
        - Start/end with alphanumeric
        """
        if not name:
            return "container"
        
        # Lowercase
        sanitized = name.lower()
        
        # Replace invalid chars with hyphen
        import re
        sanitized = re.sub(r'[^a-z0-9-]', '-', sanitized)
        
        # Remove consecutive hyphens
        sanitized = re.sub(r'-+', '-', sanitized)
        
        # Strip leading/trailing hyphens
        sanitized = sanitized.strip('-')
        
        return sanitized or "container"

    def _to_snake_case(self, name: str) -> str:
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

    def _map_dynamic_attrs(self, data: Dict[str, Any], target_class: Any, exclude: List[str] = []) -> Dict[str, Any]:
        """
        Dynamically maps keys from data (often camelCase) to target_class snake_case arguments.
        Skips keys in exclude list.
        """
        mapped_args = {}
        
        # Get list of valid arguments for the target class __init__
        # K8s client models usually store this in attribute_map (snake_case -> json_key)
        # But we need to know what __init__ accepts.
        # Most k8s models use swagger_types or attribute_map. 
        # Reverse the attribute_map to get json_key -> snake_case_attr
        
        if not hasattr(target_class, 'attribute_map'):
            return {}
            
        json_to_attr = {v: k for k, v in target_class.attribute_map.items()}
        
        for key, value in data.items():
            # Skip if explicitly handled
            # We need to account for both camelCase key and snake_case derived key in exclusion
            snake_key = self._to_snake_case(key)
            if key in exclude or snake_key in exclude:
                continue
                
            # Check if this key maps to a valid attribute in the class
            if key in json_to_attr:
                attr_name = json_to_attr[key]
                mapped_args[attr_name] = value
            elif snake_key in target_class.attribute_map:
                 # Direct snake_case match
                 mapped_args[snake_key] = value

        return mapped_args
