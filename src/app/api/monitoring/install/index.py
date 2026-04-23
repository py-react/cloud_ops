from fastapi import Request
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
from app.db_client.addon_defaults import get_gateway_api_manifests
import logging
import traceback

logger = logging.getLogger(__name__)

async def GET(request: Request, component: str = "gateway-api") -> dict:
    """
    Check if a specific monitoring component is installed.
    """
    try:
        if component != "gateway-api":
            return {"installed": False, "error": f"Legacy component {component} was migrated to helm."}
            
        namespace, deploy_name, resource_type = "monitoring", "main-gateway", "gateways"

        k8s_helper = KubernetesResourceHelper()
        if namespace != "kube-system":
            namespaces = k8s_helper.get_namespaces()
            if not any(ns.get("metadata", {}).get("name") == namespace for ns in namespaces):
                return {"installed": False, "namespace": namespace}

        api_version = "gateway.networking.k8s.io/v1"
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

async def POST(request: Request, component: str = "gateway-api") -> dict:
    """
    Deploy monitoring components.
    """
    try:
        k8s_helper = KubernetesResourceHelper()
        if component == "gateway-api":
            namespace, manifests = "monitoring", get_gateway_api_manifests()
        else:
            return {"success": False, "message": f"Unknown or migrated component: {component}"}

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

async def DELETE(request: Request, component: str = "gateway-api") -> dict:
    """
    Delete resources for a specific component.
    """
    try:
        k8s_helper = KubernetesResourceHelper()
        if component == "gateway-api":
            namespace, manifests = "monitoring", get_gateway_api_manifests()
        else:
            return {"success": False, "message": f"Unknown or migrated component: {component}"}

        results = []
        for manifest in manifests:
            try:
                k8s_helper.delete_resource(manifest)
                results.append({"kind": manifest["kind"], "name": manifest["metadata"]["name"], "status": "deleted"})
            except Exception as e:
                logger.warning(f"Failed to delete {manifest['kind']}: {str(e)}")
                results.append({"kind": manifest["kind"], "name": manifest["metadata"]["name"], "status": "failed", "error": str(e)})

        return {"success": True, "details": results}
    except Exception as e:
        logger.error(f"Error deleting {component}: {str(e)}")
        return {"success": False, "message": str(e)}
