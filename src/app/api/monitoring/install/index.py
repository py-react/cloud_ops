from fastapi import Request
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
from app.k8s_helper.monitoring.stack import get_prometheus_manifests, get_grafana_manifests, get_node_exporter_manifests
from app.k8s_helper.monitoring.metrics_server import get_metrics_server_manifests
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
        else:
            namespace = "monitoring"
            deploy_name = "prometheus-deployment" if component == "prometheus" else "grafana"

        k8s_helper = KubernetesResourceHelper()
        
        # Only check if custom namespace exists (kube-system always exists)
        if namespace != "kube-system":
            namespaces = k8s_helper.get_namespaces()
            ns_exists = any(ns.get("metadata", {}).get("name") == namespace for ns in namespaces)
            
            if not ns_exists:
                return {"installed": False, "namespace": namespace}
        
        # Check specific deployment
        deployments = k8s_helper.get_resource_details("deployments", namespace=namespace)
        target = next((d for d in deployments if d.get("metadata", {}).get("name") == deploy_name), None)
        
        is_installed = target is not None
        is_deleting = False
        if target:
            is_deleting = target.get("metadata", {}).get("deletionTimestamp") is not None
            # If it's deleting, we should treat it as 'not fully installed' for the main toggle
            # but the frontend can use the 'deleting' flag for specific UI feedback.
        
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
    Deploy either Prometheus or Grafana.
    """
    try:
        namespace = "monitoring"
        k8s_helper = KubernetesResourceHelper()
        
        if component == "prometheus":
            manifests = get_prometheus_manifests(namespace) + get_node_exporter_manifests(namespace)
        elif component == "grafana":
            manifests = get_grafana_manifests(namespace)
        else:
            manifests = get_metrics_server_manifests("kube-system")
        
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
        namespace = "monitoring"
        k8s_helper = KubernetesResourceHelper()
        
        if component == "prometheus":
            manifests = get_prometheus_manifests(namespace) + get_node_exporter_manifests(namespace)
        elif component == "grafana":
            manifests = get_grafana_manifests(namespace)
        else:
            manifests = get_metrics_server_manifests("kube-system")
            
        results = []
        for manifest in manifests:
            try:
                # Use namespace from manifest if present, otherwise default to "monitoring"
                # DELETE operation in resource_helper typically requires correct metadata
                k8s_helper.delete_resource(manifest)
                results.append({"kind": manifest["kind"], "name": manifest["metadata"]["name"], "status": "deleted"})
            except Exception as e:
                logger.warning(f"Failed to delete {manifest['kind']}: {str(e)}")
                results.append({"kind": manifest["kind"], "name": manifest["metadata"]["name"], "status": "failed", "error": str(e)})

        return {"success": True, "details": results}
    except Exception as e:
        logger.error(f"Error deleting {component}: {str(e)}")
        return {"success": False, "message": str(e)}
