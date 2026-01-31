from fastapi import Request
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
from app.k8s_helper.monitoring.stack import get_prometheus_manifests, get_grafana_manifests, get_node_exporter_manifests, get_alertmanager_manifests, get_kube_state_metrics_manifests
from app.k8s_helper.monitoring.metrics_server import get_metrics_server_manifests
from app.k8s_helper.monitoring.loki import get_loki_manifests, get_promtail_manifests
import logging

logger = logging.getLogger(__name__)

async def GET(request: Request, component: str = "prometheus") -> dict:
    """
    Check if a specific monitoring component is installed in the 'monitoring' namespace.
    """
    try:
        # Determine namespace based on component
        if component == "metrics-server":
            namespace = "kube-system"
            deploy_name = "metrics-server"
        elif component == "alertmanager":
            namespace = "alerting"
            deploy_name = "alertmanager"
        elif component in ["loki", "promtail"]:
            namespace = "logging"
            deploy_name = component # loki is deployment, promtail is daemonset (handled by list check below)
        else:
            namespace = "monitoring"
            if component == "prometheus":
                deploy_name = "prometheus-deployment"
            elif component == "grafana":
                deploy_name = "grafana"
            else:
                deploy_name = "prometheus-deployment"

        k8s_helper = KubernetesResourceHelper()
        
        # Only check if custom namespace exists (kube-system always exists)
        if namespace != "kube-system":
            namespaces = k8s_helper.get_namespaces()
            ns_exists = any(ns.get("metadata", {}).get("name") == namespace for ns in namespaces)
            
            if not ns_exists:
                return {"installed": False, "namespace": namespace}
        
        # Check specific resource (Deployment for most, DaemonSet for NodeExporter/Promtail)
        target = None
        if component in ["node-exporter", "promtail"]:
            daemonsets = k8s_helper.get_resource_details("daemonsets", namespace=namespace)
            target = next((d for d in daemonsets if d.get("metadata", {}).get("name") == deploy_name), None)
        else:
            deployments = k8s_helper.get_resource_details("deployments", namespace=namespace)
            target = next((d for d in deployments if d.get("metadata", {}).get("name") == deploy_name), None)
        
        is_installed = target is not None
        is_deleting = False
        if target:
            is_deleting = target.get("metadata", {}).get("deletionTimestamp") is not None
        
        return {
            "installed": is_installed and not is_deleting, 
            "deleting": is_deleting,
            "namespace": namespace, 
            "component": component
        }
    except Exception as e:
        logger.error(f"Error checking {component} status: {str(e)}")
        return {"installed": False, "error": str(e)}

async def POST(request: Request, component: str = "prometheus") -> dict:
    """
    Deploy monitoring components.
    """
    try:
        k8s_helper = KubernetesResourceHelper()
        
        if component == "metrics-server":
            namespace = "kube-system"
            manifests = get_metrics_server_manifests(namespace)
        elif component == "alertmanager":
            namespace = "alerting"
            manifests = get_alertmanager_manifests(namespace)
        elif component == "loki":
            namespace = "logging"
            manifests = get_loki_manifests(namespace)
        elif component == "promtail":
            namespace = "logging"
            manifests = get_promtail_manifests(namespace)
        else:
            namespace = "monitoring"
            if component == "prometheus":
                manifests = get_prometheus_manifests(namespace) + get_node_exporter_manifests(namespace) + get_kube_state_metrics_manifests(namespace)
            elif component == "grafana":
                manifests = get_grafana_manifests(namespace)
            else:
                return {"success": False, "message": f"Unknown component: {component}"}
        
        # 1. Create namespace if it doesn't exist
        try:
            k8s_helper.create_namespace(namespace)
        except ValueError: # Already exists
            pass
            
        # 2. Apply manifests
        results = []
        for manifest in manifests:
            kind = manifest.get("kind")
            name = manifest.get("metadata", {}).get("name")
            try:
                k8s_helper.apply_resource(manifest)
                results.append({"kind": kind, "name": name, "status": "success"})
            except Exception as e:
                logger.error(f"Failed to apply {kind}/{name}: {str(e)}")
                results.append({"kind": kind, "name": name, "status": "failed", "error": str(e)})
            
        return {"success": True, "message": f"{component.capitalize()} deployment initiated", "results": results}
    except Exception as e:
        logger.error(f"Error installing {component}: {str(e)}")
        return {"success": False, "message": str(e)}

async def DELETE(request: Request, component: str = "prometheus") -> dict:
    """
    Delete resources for a specific component.
    """
    try:
        k8s_helper = KubernetesResourceHelper()
        
        if component == "metrics-server":
            namespace = "kube-system"
            manifests = get_metrics_server_manifests(namespace)
        elif component == "alertmanager":
            namespace = "alerting"
            manifests = get_alertmanager_manifests(namespace)
        elif component == "loki":
            namespace = "logging"
            manifests = get_loki_manifests(namespace)
        elif component == "promtail":
            namespace = "logging"
            manifests = get_promtail_manifests(namespace)
        else:
            namespace = "monitoring"
            if component == "prometheus":
                manifests = get_prometheus_manifests(namespace) + get_node_exporter_manifests(namespace) + get_kube_state_metrics_manifests(namespace)
            elif component == "grafana":
                manifests = get_grafana_manifests(namespace)
            else:
                return {"success": False, "message": f"Unknown component: {component}"}
            
        results = []
        for manifest in manifests:
            try:
                k8s_helper.delete_resource(manifest)
                results.append({"kind": manifest["kind"], "name": manifest["metadata"]["name"], "status": "deleted"})
            except Exception as e:
                logger.warning(f"Failed to delete {manifest['kind']}: {str(e)}")
                results.append({"kind": manifest["kind"], "name": manifest["metadata"]["name"], "status": "failed", "error": str(e)})

        # Explicitly delete dedicated namespaces to cleanup PVCs
        if component == "alertmanager":
            try:
                k8s_helper.delete_namespace("alerting")
                results.append({"kind": "Namespace", "name": "alerting", "status": "deleted"})
            except Exception as e:
                logger.warning(f"Failed to delete namespace 'alerting': {str(e)}")
        
        if component == "loki":
             # Only delete logging namespace if we are deleting Loki (primary component)
             # Promtail might be deleted independently, but Loki owns the storage so it acts as the namespace anchor
            try:
                k8s_helper.delete_namespace("logging")
                results.append({"kind": "Namespace", "name": "logging", "status": "deleted"})
            except Exception as e:
                logger.warning(f"Failed to delete namespace 'logging': {str(e)}")

        return {"success": True, "details": results}
    except Exception as e:
        logger.error(f"Error deleting {component}: {str(e)}")
        return {"success": False, "message": str(e)}
