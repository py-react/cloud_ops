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
            return config_obj.dict()
        except Exception as e:
            raise Exception(f"Unexpected error getting deployment from DB: {str(e)}")

    def list_deployments(self, namespace: Optional[str] = None) -> list:
        """
        List all deployment configs from the DB, optionally filtered by namespace.
        """
        try:
            print("findMe")
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
        # 2. Fetch the deployment config
        config_obj = self.session.get(DeploymentConfig, run_data.deployment_config_id)
        if not config_obj:
            raise Exception(f"DeploymentConfig with id={run_data.deployment_config_id} not found")
        config_dict = config_obj.dict()
        # 3. Merge run fields into config_dict
        if getattr(run_data, "pr_url", None):
            config_dict["pr_url"] = run_data.pr_url
        if getattr(run_data, "jira", None):
            config_dict["jira"] = run_data.jira
        if getattr(run_data, "environment", None):
            config_dict["labels"] = config_dict.get("labels", {}) or {}
            config_dict["labels"]["environment"] = run_data.environment
        # Override image in containers
        if getattr(run_data, "image_name", None) and config_dict.get("containers"):
            for c in config_dict["containers"]:
                c["image"] = run_data.image_name
        # 4. Build K8s deployment spec from dict
        deployment_spec = self._build_k8s_deployment_spec(config_dict)
        # 5. Create the deployment in Kubernetes
        k8s_helper = KubernetesResourceHelper()
        k8s_helper.apply_resource(deployment_spec)
        # 6. Optionally update run status
        self.update_deployment_run_status(run_obj.id, "running")
        return {"run": run_obj, "deployment_result": "Deployment created in Kubernetes"}

    def _build_k8s_deployment_spec(self, config_dict) -> dict:
        """
        Build a Kubernetes deployment spec (dict) from a config dict.
        """
        containers = []
        for container in config_dict["containers"]:
            container_spec = {
                "name": container["name"],
                "image": container["image"],
            }
            ports = container.get("ports")
            if ports:
                container_spec["ports"] = [
                    {"containerPort": p["target_port"], "protocol": p.get("protocol", "TCP")}
                    for p in ports
                ]
            resources = container.get("resources")
            if resources:
                container_spec["resources"] = {
                    "requests": resources.get("requests"),
                    "limits": resources.get("limits")
                }
            env = container.get("env")
            if env:
                container_spec["env"] = [
                    {
                        "name": e["name"],
                        "value": e.get("value"),
                        "valueFrom": e.get("value_from")
                    } for e in env if e.get("value") or e.get("value_from")
                ]
            command = container.get("command")
            if command:
                container_spec["command"] = command
            args = container.get("args")
            if args:
                container_spec["args"] = args
            containers.append(container_spec)
        metadata_labels = {
            "app": config_dict["deployment_name"],
            "tag": config_dict["tag"],
            **(config_dict.get("labels") or {})
        }
        deployment_spec = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": config_dict["deployment_name"],
                "namespace": config_dict["namespace"],
                "labels": metadata_labels,
                "annotations": {
                    "pr_url": config_dict["pr_url"],
                    **(config_dict.get("annotations") or {})
                }
            },
            "spec": {
                "replicas": config_dict.get("replicas", 1),
                "selector": {
                    "matchLabels": {
                        "app": config_dict["deployment_name"]
                    }
                },
                "template": {
                    "metadata": {
                        "labels": metadata_labels
                    },
                    "spec": {
                        "containers": containers
                    }
                }
            }
        }
        if config_dict.get("jira"):
            deployment_spec["metadata"]["annotations"]["jira"] = config_dict["jira"]
        # Apply strategy if needed
        deployment_spec = StrategyHandler.apply_strategy(
            deployment_spec,
            config_dict["deployment_strategy_id"]
        )
        return deployment_spec 