from fastapi import Request
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
from app.k8s_helper.monitoring.stack import get_prometheus_manifests, get_grafana_manifests, get_node_exporter_manifests, get_alertmanager_manifests, get_kube_state_metrics_manifests
from app.k8s_helper.monitoring.metrics_server import get_metrics_server_manifests
from app.k8s_helper.monitoring.loki import get_loki_manifests, get_otel_collector_manifests, get_promtail_manifests
from app.k8s_helper.monitoring.gateway_api import get_gateway_api_manifests
from app.k8s_helper.monitoring.openebs import get_openebs_manifests
from app.k8s_helper.monitoring.networking import get_flannel_manifests
import logging
import traceback

logger = logging.getLogger(__name__)

async def GET(request: Request, component: str = "prometheus") -> dict:
    """
    Check if a specific monitoring component is installed.
    """
    try:
        k8s_helper = KubernetesResourceHelper()
        # Determine namespace and name for status check
        if component == "metrics-server":
            namespace, deploy_name, resource_type = "kube-system", "metrics-server", "deployments"
        elif component == "alertmanager":
            namespace, deploy_name, resource_type = "alerting", "alertmanager", "deployments"
        elif component == "loki":
            namespace, deploy_name, resource_type = "logging", "loki", "deployments"
        elif component == "otel-collector":
            namespace, deploy_name, resource_type = "logging", "otel-collector", "daemonsets"
        elif component == "promtail":
            namespace, deploy_name, resource_type = "logging", "promtail", "daemonsets"
        elif component == "node-exporter":
            namespace, deploy_name, resource_type = "monitoring", "node-exporter", "daemonsets"
        elif component == "gateway-api":
            namespace, deploy_name, resource_type = "monitoring", "main-gateway", "gateways"
        elif component == "openebs":
            namespace, deploy_name, resource_type = "openebs", "openebs-localpv-provisioner", "deployments"
        elif component == "flannel":
            namespace, deploy_name, resource_type = "kube-flannel", "kube-flannel-ds", "daemonsets"
        else:
            namespace, deploy_name, resource_type = "monitoring", component, "deployments"
            if component == "prometheus": deploy_name = "prometheus-deployment"

        k8s_helper = KubernetesResourceHelper()
        if namespace != "kube-system":
            namespaces = k8s_helper.get_namespaces()
            if not any(ns.get("metadata", {}).get("name") == namespace for ns in namespaces):
                return {"installed": False, "namespace": namespace}

        api_version = "gateway.networking.k8s.io/v1" if component == "gateway-api" else None
        resources = k8s_helper.get_resource_details(resource_type, namespace=namespace, api_version=api_version)
        target = next((r for r in resources if r.get("metadata", {}).get("name") == deploy_name), None)
        
        is_installed = target is not None
        is_deleting = target.get("metadata", {}).get("deletionTimestamp") is not None if target else False
        
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
            namespace, manifests = "kube-system", get_metrics_server_manifests("kube-system")
        elif component == "alertmanager":
            namespace, manifests = "alerting", get_alertmanager_manifests("alerting")
        elif component == "loki":
            namespace, manifests = "logging", get_loki_manifests("logging")
        elif component == "otel-collector":
            namespace, manifests = "logging", get_otel_collector_manifests("logging")
        elif component == "promtail":
            namespace, manifests = "logging", get_promtail_manifests("logging")
        elif component == "prometheus":
            namespace, manifests = "monitoring", get_prometheus_manifests("monitoring") + get_node_exporter_manifests("monitoring") + get_kube_state_metrics_manifests("monitoring")
        elif component == "grafana":
            namespace, manifests = "monitoring", get_grafana_manifests("monitoring")
        elif component == "gateway-api":
            namespace, manifests = "monitoring", get_gateway_api_manifests()
        elif component == "openebs":
            namespace, manifests = "openebs", get_openebs_manifests()
        elif component == "flannel":
            namespace, manifests = "kube-flannel", get_flannel_manifests()
        else:
            return {"success": False, "message": f"Unknown component: {component}"}

        try: k8s_helper.create_namespace(namespace)
        except ValueError: pass
            
        results = []
        for manifest in manifests:
            if not isinstance(manifest, dict):
                logger.warning(f"Skipping invalid manifest type in {component}: {type(manifest)}")
                continue
            try:
                k8s_helper.apply_resource(manifest)
                results.append({"kind": manifest.get("kind", "Unknown"), "name": manifest.get("metadata", {}).get("name", "Unknown"), "status": "success"})
            except Exception as e:
                kind = manifest.get("kind", "Unknown")
                name = manifest.get("metadata", {}).get("name", "Unknown")
                logger.error(f"Failed to apply {kind}/{name}: {str(e)}")
                results.append({"kind": kind, "name": name, "status": "failed", "error": str(e)})
            
        return {"success": True, "message": f"{component.capitalize()} deployment initiated", "results": results}
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"Error installing {component}: {str(e)}\n{error_trace}")
        return {"success": False, "message": str(e), "trace": error_trace}

async def DELETE(request: Request, component: str = "prometheus") -> dict:
    """
    Delete resources for a specific component.
    """
    try:
        k8s_helper = KubernetesResourceHelper()
        if component == "metrics-server":
            namespace, manifests = "kube-system", get_metrics_server_manifests("kube-system")
        elif component == "alertmanager":
            namespace, manifests = "alerting", get_alertmanager_manifests("alerting")
        elif component == "loki":
            namespace, manifests = "logging", get_loki_manifests("logging")
        elif component == "otel-collector":
            namespace, manifests = "logging", get_otel_collector_manifests("logging")
        elif component == "promtail":
            namespace, manifests = "logging", get_promtail_manifests("logging")
        elif component == "prometheus":
            namespace, manifests = "monitoring", get_prometheus_manifests("monitoring") + get_node_exporter_manifests("monitoring") + get_kube_state_metrics_manifests("monitoring")
        elif component == "grafana":
            namespace, manifests = "monitoring", get_grafana_manifests("monitoring")
        elif component == "gateway-api":
            namespace, manifests = "monitoring", get_gateway_api_manifests()
        elif component == "openebs":
            namespace, manifests = "openebs", get_openebs_manifests()
        elif component == "flannel":
            namespace, manifests = "kube-flannel", get_flannel_manifests()
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

        # Conditional namespace cleanup
        if component == "alertmanager":
            try: k8s_helper.delete_namespace("alerting"); results.append({"kind": "Namespace", "name": "alerting", "status": "deleted"})
            except: pass
        
        # We don't auto-delete 'logging' namespace here to allow Loki/OTel/Promtail to exist independently 
        # unless specifically requested or if it's the last component (optional enhancement)

        return {"success": True, "details": results}
    except Exception as e:
        logger.error(f"Error deleting {component}: {str(e)}")
        return {"success": False, "message": str(e)}
