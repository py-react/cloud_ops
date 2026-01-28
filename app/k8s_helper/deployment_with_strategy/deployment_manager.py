import sys
from typing import Dict, Any, Optional
from ...db_client.models.deployment_config.types import DeploymentConfigType
from ...db_client.controllers.deployment_config.deployment_config import (
    create_deployment_config, update_deployment_config, delete_deployment_config, list_deployment_configs
)
from ...db_client.models.deployment_config.deployment_config import DeploymentConfig
from sqlmodel import Session, select
from ...db_client.db import get_session
from ...db_client.controllers.deployment_run.deployment_run import (
    create_deployment_run,get_deployment_run,list_deployment_runs,update_deployment_run,update_deployment_run_status
)
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
from app.k8s_helper.deployment_with_strategy.strategy_handler import StrategyHandler
from app.db_client.services.deployment_generator import DeploymentGenerator
from app.db_client.services.deployment_composer import DeploymentComposer
from app.db_client.services.service_composer import ServiceComposer
from app.db_client.services.service_generator import ServiceGenerator
from ...db_client.models.kubernetes_profiles.service import K8sService
from ...db_client.models.kubernetes_profiles.deployment import K8sDeployment
from ...db_client.models.kubernetes_profiles.pod import K8sPod
from ...db_client.models.kubernetes_profiles.container import K8sContainerProfile
from ...db_client.models.kubernetes_profiles.pod_metadata_profile import K8sPodMetaDataProfile
from ...db_client.models.kubernetes_profiles.pod_profile import K8sPodProfile
from ...db_client.models.kubernetes_profiles.service_metadata_profile import K8sServiceMetadataProfile
from ...db_client.models.kubernetes_profiles.service_selector_profile import K8sServiceSelectorProfile
from ...db_client.models.kubernetes_profiles.deployment_selector import K8sDeploymentSelectorProfile
from ...db_client.models.kubernetes_profiles.service_profile import K8sServiceProfile
from ...db_client.models.kubernetes_profiles.profile import K8sEntityProfile
import json


class DeploymentManager:
    """Manages deployment configs in the database only (no Kubernetes logic)"""
    
    def __init__(self, session: Optional[Session] = None):
        if session is None:
            self.session_ctx = get_session()
            self.session = self.session_ctx.__enter__()
        else:
            self.session = session
            self.session_ctx = None

    def __del__(self):
        if hasattr(self, 'session_ctx') and self.session_ctx:
            self.session_ctx.__exit__(None, None, None)

    @staticmethod
    def validate_and_sanitize_name(name: str) -> str:
        """
        Validate and sanitize a deployment name to be Kubernetes RFC 1123 compliant.
        
        Args:
            name: The original deployment name
            
        Returns:
            A sanitized name that meets Kubernetes requirements
            
        Raises:
            ValueError: If the name cannot be made valid
        """
        if not name:
            raise ValueError("Deployment name cannot be empty")
            
        # Convert to lowercase and replace underscores with hyphens
        sanitized = name.lower().replace("_", "-")
        
        # Remove any characters that aren't alphanumeric or hyphens
        import re
        sanitized = re.sub(r'[^a-z0-9-]', '', sanitized)
        
        # Ensure it doesn't start or end with a hyphen
        sanitized = sanitized.strip('-')
        
        # Ensure it's not empty after sanitization
        if not sanitized:
            raise ValueError(f"Deployment name '{name}' cannot be sanitized to a valid Kubernetes name")
            
        # Ensure it doesn't exceed the maximum length (63 characters for DNS subdomain)
        if len(sanitized) > 63:
            sanitized = sanitized[:63].rstrip('-')
            
        return sanitized

    def create_deployment(self, deployment_config: DeploymentConfigType) -> Dict[str, Any]:
        """
        Persist the deployment config to the DB.
        """
        try:
            result = create_deployment_config(self.session, deployment_config)
            return result
        except Exception as e:
            raise Exception(f"Unexpected error creating deployment: {str(e)}")

    def update_deployment(self, deployment_config: DeploymentConfigType) -> Dict[str, Any]:
        """
        Update an existing deployment config in the DB.
        """
        try:
            config_obj = self.session.exec(select(DeploymentConfig).where(
                DeploymentConfig.id == deployment_config.id,
            )).first()
            if config_obj:
                update_deployment_config(self.session, config_obj.id, deployment_config)
            return {"message": f"Deployment {deployment_config.deployment_name} updated successfully"}
        except Exception as e:
            raise Exception(f"Unexpected error updating deployment: {str(e)}")

    def delete_deployment(self, name: str, namespace: str) -> Dict[str, Any]:
        """
        Delete a deployment config from the DB.
        """
        try:
            config_obj = self.session.exec(select(DeploymentConfig).where(
                DeploymentConfig.deployment_name == name,
                DeploymentConfig.namespace == namespace
            )).first()
            if config_obj:
                delete_deployment_config(self.session, config_obj.id)
            return {"message": f"Deployment {name} deleted successfully."}
        except Exception as e:
            raise Exception(f"Unexpected error deleting deployment: {str(e)}")

    def get_deployment(self, name: str, namespace: str) -> Dict[str, Any]:
        """
        Get the deployment config from the DB by name and namespace.
        Enriched with composed library data if derived.
        """
        try:
            config_obj = self.session.exec(select(DeploymentConfig).where(
                DeploymentConfig.deployment_name == name,
                DeploymentConfig.namespace == namespace
            )).first()
            if not config_obj:
                raise Exception(f"Deployment config not found for name={name}, namespace={namespace}")
            
            composer = DeploymentComposer(self.session)
            return composer.compose(config_obj)
        except Exception as e:
            raise Exception(f"Unexpected error getting deployment from DB: {str(e)}")

    def list_deployments(self, namespace: Optional[str] = None) -> list:
        """
        List all deployment configs from the DB, optionally filtered by namespace.
        Excludes hard-deleted items. Frontend handles status/soft_delete filtering.
        """
        try:
            result = list_deployment_configs(self.session, namespace)
            return result
        except Exception as e:
            raise Exception(f"Unexpected error listing deployments: {str(e)}")

    # --- DeploymentRun CRUD ---
    def create_deployment_run(self, run_data) -> Any:
        return create_deployment_run(self.session, run_data)

    def get_deployment_run(self, run_id: int) -> Any:
        return get_deployment_run(self.session, run_id)

    def list_deployment_runs(self,id:int) -> Any:
        return list_deployment_runs(self.session,deployment_config_id=id)

    def update_deployment_run(self, run_id: int, run_data) -> Any:
        return update_deployment_run(self.session, run_id, run_data)

    def update_deployment_run_status(self, run_id: int, status: str) -> Any:
        return update_deployment_run_status(self.session, run_id, status)

    def run_deployment_from_run(self, run_data) -> dict:
        """
        Create a deployment run, fetch the config, merge run data, and create the deployment in Kubernetes.
        """
        # 1. Store the run in the DB
        run_obj = self.create_deployment_run(run_data)
        try:
            # 2. Fetch and compose the deployment config
            config_obj = self.session.get(DeploymentConfig, run_data.deployment_config_id)
            if not config_obj:
                raise Exception(f"DeploymentConfig with id={run_data.deployment_config_id} not found")
            
            # GUARDRAIL: Only allow active configurations to be released
            if config_obj.status != 'active':
                raise Exception(f"Release forbidden: Configuration '{config_obj.deployment_name}' is currently {config_obj.status}. It must be 'active' to run a release.")

            composer = DeploymentComposer(self.session)
            composed_data = composer.compose(config_obj)
            
            if not composed_data:
                raise Exception("Failed to compose deployment data: Result is empty")

            # Apply run-time image overrides to composed_data BEFORE generation
            # This avoids issues with container name sanitization in the generator
            if getattr(run_data, "images", None):
                for container in composed_data.get("containers", []):
                    c_name = container.get("name")
                    if c_name and c_name in run_data.images:
                         container["image"] = run_data.images[c_name]

            # 3. Generate deployment spec using DeploymentGenerator
            generator = DeploymentGenerator(self.session)
            deployment_spec = generator.generate(composed_data)
            
            if not deployment_spec:
                raise Exception("Failed to generate deployment spec: Result is empty")

            # 4. Apply run-time overrides (pr_url, jira, environment)
            if getattr(run_data, "pr_url", None):
                deployment_spec.setdefault("metadata", {}).setdefault("annotations", {})["pr_url"] = run_data.pr_url
            if getattr(run_data, "jira", None):
                deployment_spec.setdefault("metadata", {}).setdefault("annotations", {})["jira"] = run_data.jira
            if getattr(run_data, "environment", None):
                deployment_spec.setdefault("metadata", {}).setdefault("labels", {})["environment"] = run_data.environment
                deployment_spec.get("spec", {}).get("template", {}).setdefault("metadata", {}).setdefault("labels", {})["environment"] = run_data.environment
            
            # 5. Apply deployment strategy (fallback to 1 if missing)
            strategy_id = composed_data.get("deployment_strategy_id") or 1
            deployment_spec = StrategyHandler.apply_strategy(
                deployment_spec,
                strategy_id
            )
            
            # 6. Create the deployment and service in Kubernetes
            from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
            from kubernetes.client.rest import ApiException
            import json
            import sys
            
            # LOGGING THE MANIFEST
            sys.stderr.write("\n--- APPLYING KUBERNETES MANIFEST ---\n")
            sys.stderr.write(json.dumps(deployment_spec, indent=2, default=str))
            sys.stderr.write("\n------------------------------------\n")

            k8s_helper = KubernetesResourceHelper()
            
            try:
                k8s_helper.apply_resource(deployment_spec)
            except ApiException as e:
                import json
                error_body = json.loads(e.body) if e.body else {}
                sys.stderr.write(f"K8s API Error (Deployment): {error_body.get('message', str(e))}\n")
                sys.stderr.write(f"Problematic Spec: {json.dumps(deployment_spec, indent=2)}\n")
                raise Exception(f"Kubernetes rejected deployment: {error_body.get('message', str(e))}")
                
            result_messages = ["Deployment created in Kubernetes"]

            # 8. Apply Derived Service if Requested (NEW)
            if getattr(run_data, "apply_derived_service", False):
                if config_obj.service_id:
                    sys.stderr.write(f"\n--- APPLYING DERIVED SERVICE for {deployment_spec['metadata']['name']} ---\n")
                    service_obj = self.session.get(K8sService, config_obj.service_id)
                    if service_obj:
                        svc_composer = ServiceComposer(self.session)
                        svc_data = svc_composer.compose(service_obj)
                        
                        if svc_data:
                            svc_generator = ServiceGenerator()
                            svc_spec = svc_generator.generate(svc_data)
                            
                            if svc_spec:
                                sys.stderr.write(f"Applying Service: {svc_spec['metadata']['name']}\n")
                                sys.stderr.write(json.dumps(svc_spec, indent=2, default=str))
                                sys.stderr.write("\n------------------------------------\n")
                                k8s_helper.apply_resource(svc_spec)
                                result_messages.append("Derived Service created")
                            else:
                                sys.stderr.write("Warning: Generated Service spec is empty.\n")
                        else:
                            sys.stderr.write("Warning: Composed Service data is empty.\n")
                    else:
                        sys.stderr.write(f"Warning: Service ID {config_obj.service_id} not found in DB.\n")
            
            # 7. Update run status
            self.update_deployment_run_status(run_obj.id, "deployed")
            return {"run": run_obj, "deployment_result": "; ".join(result_messages)}
        except Exception as e:
            self.update_deployment_run_status(run_obj.id, "failed")
            raise Exception(f"Unexpected error running deployment: {str(e)}")

 

    def _build_k8s_service_spec(self, config_dict) -> dict:
        """
        Build a Kubernetes service spec (dict) from a config dict.
        
        Args:
            config_dict: Dictionary containing deployment configuration
            
        Returns:
            Kubernetes Service manifest as a dictionary
        """
        service_ports = config_dict.get("service_ports")
        if not service_ports:
            return None
            
        # Use the same validated deployment name for consistency
        deployment_name = self.validate_and_sanitize_name(config_dict["deployment_name"])
        service_name = f"{deployment_name}-service"
        
        # Build service ports
        ports = []
        for port_config in service_ports:
            port_spec = {
                "port": port_config["port"],
                "targetPort": port_config["target_port"],
                "protocol": port_config.get("protocol", "TCP")
            }
            # Add port name if we can generate a meaningful one
            if len(service_ports) > 1:
                port_spec["name"] = f"port-{port_config['port']}"
            ports.append(port_spec)
        
        # Selector to match the deployment pods
        selector = {
            "app": deployment_name
        }
        
        # Build metadata labels
        # Start with config labels, then ensure app label uses sanitized name
        metadata_labels = (config_dict.get("labels") or {}).copy()
        metadata_labels["app"] = deployment_name  # Always use sanitized deployment name
        
        # Add tag only if it's not empty
        if config_dict.get("tag"):
            metadata_labels["tag"] = config_dict["tag"]
        
        service_spec = {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": service_name,
                "namespace": config_dict["namespace"],
                "labels": metadata_labels,
                "annotations": {
                    "deployment.kubernetes.io/managed-by": "cloud-ops",
                    **(config_dict.get("annotations") or {})
                }
            },
            "spec": {
                "selector": selector,
                "ports": ports,
                "type": "ClusterIP"  # Default service type, can be made configurable
            }
        }
        
        # Add pr_url annotation if present
        if config_dict.get("pr_url"):
            service_spec["metadata"]["annotations"]["pr_url"] = config_dict["pr_url"]
            
        # Add jira annotation if present
        if config_dict.get("jira"):
            service_spec["metadata"]["annotations"]["jira"] = config_dict["jira"]
        
        return service_spec 

    def delete_deployment_and_service(self, name: str, namespace: str) -> Dict[str, Any]:
        """
        Delete a deployment and its associated service from both DB and Kubernetes.
        """
        try:
            # Delete from database
            config_obj = self.session.exec(select(DeploymentConfig).where(
                DeploymentConfig.deployment_name == name,
                DeploymentConfig.namespace == namespace
            )).first()
            if config_obj:
                delete_deployment_config(self.session, config_obj.id)
            
            # Delete from Kubernetes
            k8s_helper = KubernetesResourceHelper()
            
            # Sanitize name for Kubernetes compatibility
            deployment_name = self.validate_and_sanitize_name(name)
            service_name = f"{deployment_name}-service"
            
            result_messages = []
            
            try:
                # Delete deployment
                deployment_manifest = {
                    "apiVersion": "apps/v1",
                    "kind": "Deployment",
                    "metadata": {
                        "name": deployment_name,
                        "namespace": namespace
                    }
                }
                k8s_helper.delete_resource(deployment_manifest)
                result_messages.append(f"Deployment {deployment_name} deleted")
            except Exception as e:
                result_messages.append(f"Deployment deletion failed: {str(e)}")
            
            try:
                # Delete service
                service_manifest = {
                    "apiVersion": "v1",
                    "kind": "Service",
                    "metadata": {
                        "name": service_name,
                        "namespace": namespace
                    }
                }
                k8s_helper.delete_resource(service_manifest)
                result_messages.append(f"Service {service_name} deleted")
            except Exception as e:
                result_messages.append(f"Service deletion failed: {str(e)}")
            
            return {"message": "; ".join(result_messages)}
        except Exception as e:
            raise Exception(f"Unexpected error deleting deployment and service: {str(e)}")

    def import_from_yaml(self, yaml_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Parses a Kubernetes Deployment or Service YAML and creates DB entries.
        """
        kind = yaml_data.get("kind")
        if not kind:
            raise ValueError("YAML data must contain a 'kind' field")

        if kind in ["Deployment", "StatefulSet", "ReplicaSet"]:
            return self._import_deployment(yaml_data)
        elif kind == "Service":
            return self._import_service(yaml_data)
        else:
            raise ValueError(f"Unsupported resource kind: {kind}")

    def _import_deployment(self, yaml: Dict[str, Any]) -> Dict[str, Any]:
        metadata = yaml.get("metadata", {})
        spec = yaml.get("spec", {})
        template = spec.get("template", {})
        pod_metadata = template.get("metadata", {})
        pod_spec = template.get("spec", {})

        namespace = metadata.get("namespace", "default")
        name = metadata.get("name")
        if not name:
            raise ValueError("Deployment must have a name in metadata")

        # 1. Create Pod Metadata Profile
        pod_meta_config = {
            "labels": pod_metadata.get("labels", {}),
            "annotations": pod_metadata.get("annotations", {})
        }
        pod_meta_profile = K8sPodMetaDataProfile(
            name=f"{name}-pod-meta",
            namespace=namespace,
            type="pod_metadata",
            config=pod_meta_config
        )
        self.session.add(pod_meta_profile)
        self.session.flush()

        # 2. Create Container Profiles
        container_ids = []
        for c_data in pod_spec.get("containers", []):
            c_name = c_data.get("name")
            
            # Define explicit columns that map directly to K8sContainerProfile fields
            # These will be skipped in dynamic_attr loop
            exclude_cols = {
                "name", "image", "imagePullPolicy", "command", "args", 
                "workingDir", "tty", "stdin"
            }
            
            # Additional mappings for camelCase -> snake_case transformation in model
            # We handle these explicitly in the model creation, so we skip them in dynamic_attr
            # Note: image_pull_policy is handled via .get("imagePullPolicy")
            
            dynamic_attr = {}
            normalized_ports = []

            # Helper to create EntityProfile
            def create_entity(key, config):
                # EntityProfile config must be a dict (JSONB object)
                # Wrap primitives (str, int, bool) to ensure they are stored correctly
                final_config = config
                if not isinstance(config, (dict, list)):
                    final_config = {"__wrapped_primitive__": config}
                
                profile = K8sEntityProfile(
                    name=f"{name}-{c_name}-{key}",
                    namespace=namespace,
                    type=key,
                    config=final_config
                )
                self.session.add(profile)
                self.session.flush()
                return profile.id
            
            # Iterate over ALL keys in container spec to catch everything
            for key, value in c_data.items():
                if key in exclude_cols:
                    continue
                
                # Special handling for ports to normalize them
                if key == "ports":
                    for p in value:
                        p_entry = {
                            "containerPort": p.get("containerPort"),
                            "protocol": p.get("protocol", "TCP")
                        }
                        if p.get("name"):
                            p_entry["name"] = p["name"]
                        normalized_ports.append(p_entry)
                    dynamic_attr["ports"] = create_entity("ports", normalized_ports)
                
                # Special handling: map keys that need to be preserved exactly as is
                else:
                    # Create generic entity profile for this attribute (env, resources, securityContext, etc.)
                    dynamic_attr[key] = create_entity(key, value)

            c_profile = K8sContainerProfile(
                name=c_name,
                namespace=namespace,
                image="imported-placeholder", 
                image_pull_policy=c_data.get("imagePullPolicy", "IfNotPresent"),
                command=c_data.get("command"),
                args=c_data.get("args"),
                working_dir=c_data.get("workingDir"),
                tty=c_data.get("tty", False),
                stdin=c_data.get("stdin", False),
                dynamic_attr=dynamic_attr
            )
            self.session.add(c_profile)
            self.session.flush()
            container_ids.append(c_profile.id)

        # 3. Create Pod Profile (for other generic pod attributes)
        pod_dynamic_attr = {}
        
        # Explicit pod columns to exclude from dynamic attr
        pod_exclude_cols = {
             "metadata", "spec", "containers", "serviceAccountName", 
             "terminationGracePeriodSeconds", "volumes" # volumes handled explicitly below
        }

        # 3a. Handle Volumes explicitly as it maps to a specific EntityProfile
        if pod_spec.get("volumes"):
            vol_profile = K8sEntityProfile(
                name=f"{name}-volumes",
                namespace=namespace,
                type="volumes",
                config=pod_spec["volumes"]
            )
            self.session.add(vol_profile)
            self.session.flush()
            pod_dynamic_attr["volumes"] = vol_profile.id

        # 3b. Handle all other pod spec attributes (nodeSelector, affinity, restartPolicy, etc.)
        for key, value in pod_spec.items():
            if key not in pod_exclude_cols:
                final_config = value
                if not isinstance(value, (dict, list)):
                    final_config = {"__wrapped_primitive__": value}

                profile = K8sEntityProfile(
                    name=f"{name}-pod-{key}",
                    namespace=namespace,
                    type=key,
                    config=final_config
                )
                self.session.add(profile)
                self.session.flush()
                pod_dynamic_attr[key] = profile.id

        # 4. Create Pod
        pod = K8sPod(
            name=f"{name}-pod",
            namespace=namespace,
            service_account_name=pod_spec.get("serviceAccountName"),
            termination_grace_period_seconds=pod_spec.get("terminationGracePeriodSeconds"),
            metadata_profile_id=pod_meta_profile.id,
            containers=container_ids,
            dynamic_attr=pod_dynamic_attr
        )
        self.session.add(pod)
        self.session.flush()

        # 5. Create Selector Profile
        selector_data = spec.get("selector", {"matchLabels": {"app": name}})
        selector_profile = K8sDeploymentSelectorProfile(
            name=f"{name}-selector",
            namespace=namespace,
            config=selector_data
        )
        self.session.add(selector_profile)
        self.session.flush()

        # 6. Create K8sDeployment (Library)
        lib_deployment = K8sDeployment(
            name=name,
            namespace=namespace,
            kind=yaml.get("kind", "Deployment"),
            replicas=spec.get("replicas", 1),
            pod_id=pod.id,
            selector_id=selector_profile.id
        )
        self.session.add(lib_deployment)
        self.session.flush()
        self.session.commit()

        return {
            "status": "success",
            "message": f"Deployment '{name}' imported successfully",
            "data": {
                "library_deployment_id": lib_deployment.id
            }
        }

    def _import_service(self, yaml: Dict[str, Any]) -> Dict[str, Any]:
        metadata = yaml.get("metadata", {})
        spec = yaml.get("spec", {})

        namespace = metadata.get("namespace", "default")
        name = metadata.get("name")
        if not name:
            raise ValueError("Service must have a name in metadata")

        # 1. Create Service Metadata Profile
        meta_config = {
            "labels": metadata.get("labels", {}),
            "annotations": metadata.get("annotations", {})
        }
        meta_profile = K8sServiceMetadataProfile(
            name=f"{name}-meta",
            namespace=namespace,
            type="service_metadata",
            config=meta_config
        )
        self.session.add(meta_profile)
        self.session.flush()

        # 2. Create Service Selector Profile
        selector_profile = K8sServiceSelectorProfile(
            name=f"{name}-selector",
            namespace=namespace,
            selector=spec.get("selector", {})
        )
        self.session.add(selector_profile)
        self.session.flush()

        # 3. Create Service Profile for ports and spec-level attributes
        # Capture all spec fields that aren't mapped to specific columns
        svc_profile_config = {}
        
        # Columns mapped to K8sService model
        exclude_service_cols = {
            "selector", # Handled in Selector Profile
            "type", "clusterIP", "ipFamilyPolicy", "sessionAffinity", 
            "internalTrafficPolicy", "externalTrafficPolicy", 
            "publishNotReadyAddresses", "loadBalancerIP", "healthCheckNodePort",
            "allocateLoadBalancerNodePorts", "loadBalancerClass", "externalName"
        }
        
        for key, value in spec.items():
            if key not in exclude_service_cols:
                svc_profile_config[key] = value
        
        svc_profile = K8sServiceProfile(
            name=f"{name}-spec",
            namespace=namespace,
            type="service_spec",
            config=svc_profile_config
        )
        self.session.add(svc_profile)
        self.session.flush()

        # 4. Create K8sService
        # Map advanced fields from spec to model fields
        service = K8sService(
            name=name,
            namespace=namespace,
            metadata_profile_id=meta_profile.id,
            selector_profile_id=selector_profile.id,
            dynamic_attr={"spec": svc_profile.id},
            type=spec.get("type", "ClusterIP"),
            cluster_ip=spec.get("clusterIP"),
            ip_family_policy=spec.get("ipFamilyPolicy"),
            session_affinity=spec.get("sessionAffinity"),
            internal_traffic_policy=spec.get("internalTrafficPolicy"),
            external_traffic_policy=spec.get("externalTrafficPolicy"),
            publish_not_ready_addresses=spec.get("publishNotReadyAddresses"),
            load_balancer_ip=spec.get("loadBalancerIP"),
            health_check_node_port=spec.get("healthCheckNodePort"),
            allocate_load_balancer_node_ports=spec.get("allocateLoadBalancerNodePorts"),
            load_balancer_class=spec.get("loadBalancerClass"),
            external_name=spec.get("externalName")
        )
        self.session.add(service)
        self.session.commit()

        return {
            "status": "success",
            "message": f"Service '{name}' imported successfully",
            "data": {
                "service_id": service.id
            }
        }