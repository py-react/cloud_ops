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


class DeploymentManager:
    """Manages deployment configs in the database only (no Kubernetes logic)"""
    
    def __init__(self, session: Optional[Session] = None):
        if session is None:
            self.session_ctx = get_session()
            self.session = next(self.session_ctx)
        else:
            self.session = session
            self.session_ctx = None

    def __del__(self):
        if hasattr(self, 'session_ctx') and self.session_ctx:
            self.session_ctx.close()

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
        """
        try:
            config_obj = self.session.exec(select(DeploymentConfig).where(
                DeploymentConfig.deployment_name == name,
                DeploymentConfig.namespace == namespace
            )).first()
            if not config_obj:
                raise Exception(f"Deployment config not found for name={name}, namespace={namespace}")
            
            result = config_obj.dict()
            # Enrich with profile IDs for frontend forms
            result["container_profile_ids"] = [c.id for c in config_obj.containers]
            result["volume_profile_ids"] = [v.id for v in config_obj.volumes]
            
            return result
        except Exception as e:
            raise Exception(f"Unexpected error getting deployment from DB: {str(e)}")

    def list_deployments(self, namespace: Optional[str] = None) -> list:
        """
        List all deployment configs from the DB, optionally filtered by namespace.
        """
        try:
            result = list_deployment_configs(self.session,namespace)
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
            # 2. Fetch the deployment config
            config_obj = self.session.get(DeploymentConfig, run_data.deployment_config_id)
            if not config_obj:
                raise Exception(f"DeploymentConfig with id={run_data.deployment_config_id} not found")
            
            # 3. Generate deployment spec using DeploymentGenerator
            generator = {}
            deployment_spec = generator.generate(config_obj.id)
            
            # 4. Apply run-time overrides (pr_url, jira, environment, image)
            if getattr(run_data, "pr_url", None):
                deployment_spec.setdefault("metadata", {}).setdefault("annotations", {})["pr_url"] = run_data.pr_url
            if getattr(run_data, "jira", None):
                deployment_spec.setdefault("metadata", {}).setdefault("annotations", {})["jira"] = run_data.jira
            if getattr(run_data, "environment", None):
                deployment_spec.setdefault("metadata", {}).setdefault("labels", {})["environment"] = run_data.environment
                deployment_spec.get("spec", {}).get("template", {}).setdefault("metadata", {}).setdefault("labels", {})["environment"] = run_data.environment
            
            # Override image in all containers if image_name is provided
            if getattr(run_data, "image_name", None):
                containers = deployment_spec.get("spec", {}).get("template", {}).get("spec", {}).get("containers", [])
                for container in containers:
                    container["image"] = run_data.image_name
            
            # 5. Apply deployment strategy
            deployment_spec = StrategyHandler.apply_strategy(
                deployment_spec,
                config_obj.deployment_strategy_id
            )
            
            # 6. Build K8s service spec (if service_ports are defined)
            service_spec = None
            if config_obj.service_ports:
                service_spec = self._build_k8s_service_spec({
                    "deployment_name": config_obj.deployment_name,
                    "namespace": config_obj.namespace,
                    "service_ports": config_obj.service_ports,
                    "labels": deployment_spec.get("metadata", {}).get("labels", {}),
                    "annotations": deployment_spec.get("metadata", {}).get("annotations", {}),
                    "tag": config_obj.tag,
                    "pr_url": getattr(run_data, "pr_url", None),
                    "jira": getattr(run_data, "jira", None)
                })
            
            # 7. Create the deployment and service in Kubernetes
            k8s_helper = KubernetesResourceHelper()
            k8s_helper.apply_resource(deployment_spec)
            
            result_messages = ["Deployment created in Kubernetes"]
            
            # Apply service if it was built
            if service_spec:
                k8s_helper.apply_resource(service_spec)
                result_messages.append("Service created in Kubernetes")
            
            # 8. Update run status
            self.update_deployment_run_status(run_obj.id, "deployed")
            return {"run": run_obj, "deployment_result": "; ".join(result_messages)}
        except Exception as e:
            print(str(e))
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