from fastapi import Request, HTTPException, Query
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
import yaml
import logging
import requests
from pydantic import BaseModel


logger = logging.getLogger(__name__)

# Mapping component to (ConfigMap name, data key, default config, namespace)
COMPONENT_MAP = {
    "gateway-api": ("gateway-api-config", "gateway.yaml", 'apiVersion: gateway.networking.k8s.io/v1\nkind: Gateway\nmetadata:\n  name: main-gateway\n  namespace: monitoring\nspec:\n  gatewayClassName: nginx\n  listeners:\n  - name: http\n    port: 80\n    protocol: HTTP\n    hostname: "*.example.com"', "monitoring"),
}

async def GET(request: Request, component: str = Query("gateway-api")) -> dict:
    """
    Fetch the configuration for a specific component.
    """
    # Robust parameter detection: prefer query params explicitly for transparency
    comp = request.query_params.get("component") or component
    
    logger.info(f"Config GET requested for component: {comp} (raw component arg: {component})")
    try:
        if comp not in COMPONENT_MAP:
            logger.warning(f"Unsupported component requested: {comp}")
            return {"success": False, "message": f"Unsupported component: {comp}"}
            
        cm_name, data_key, default_config, namespace = COMPONENT_MAP[comp]
        logger.info(f"Using ConfigMap: {cm_name}, Key: {data_key}, Namespace: {namespace}")
        k8s_helper = KubernetesResourceHelper()
        
        # Get ConfigMap
        config_maps = k8s_helper.get_resource_details("configmaps", namespace=namespace)
        cm = next((c for c in config_maps if c.get("metadata", {}).get("name") == cm_name), None)
        
        if not cm:
            logger.info(f"ConfigMap {cm_name} not found, returning default configuration.")
            return {
                "success": True, 
                "config": default_config,
                "isOpinionated": True,
                "isDeployed": False
            }
            
        current_config = cm.get("data", {}).get(data_key, "")
        
        # Strict comparison (ignore whitespace for robustness)
        is_opinionated = current_config.strip() == default_config.strip()
        
        return {
            "success": True, 
            "config": current_config,
            "isOpinionated": is_opinionated,
            "isDeployed": True
        }
    except Exception as e:
        logger.error(f"Error fetching {component} config: {str(e)}")
        return {"success": False, "message": str(e)}

class ConfigUpdate(BaseModel):
    config: str
    component: str = "alertmanager"

async def POST(request: Request, body: ConfigUpdate) -> dict:
    """
    Update the configuration for a specific component.
    """
    try:
        config = body.config
        component = body.component
        
        if component not in COMPONENT_MAP:
            return {"success": False, "message": f"Unsupported component: {component}"}
            
        if not config:
            return {"success": False, "message": "No configuration provided"}
            
        # 1. Validate YAML
        try:
            yaml.safe_load(config)
        except Exception as ye:
            return {"success": False, "message": f"Invalid YAML: {str(ye)}"}
            
        cm_name, data_key, _, namespace = COMPONENT_MAP[component]
        k8s_helper = KubernetesResourceHelper()
        
        # 2. Get existing ConfigMap
        config_maps = k8s_helper.get_resource_details("configmaps", namespace=namespace)
        cm = next((c for c in config_maps if c.get("metadata", {}).get("name") == cm_name), None)
        
        if not cm:
            return {"success": False, "message": f"ConfigMap {cm_name} not found"}
            
        # 3. Update data
        if "data" not in cm:
            cm["data"] = {}
        cm["data"][data_key] = config
        
        # 4. Apply update
        k8s_helper.apply_resource(cm)
        
        # 5. Trigger Rollout Restart to ensure immediate reflection
        # This bypasses the Kubelet volume sync delay (~60s) which confuses users.
        await restart_rollout(k8s_helper, component, namespace)
        
        logger.info(f"{component} configuration updated; triggered rollout restart for immediate effect.")
        
        return {"success": True, "message": f"{component.capitalize()} configuration updated. Pods are restarting to apply changes immediately."}
    except Exception as e:
        logger.error(f"Error updating {component} config: {str(e)}")
        return {"success": False, "message": str(e)}

async def restart_rollout(k8s_helper, component: str, namespace: str):
    """
    Triggers a rollout restart by patching the deployment's annotations with a timestamp.
    """
    try:
        from datetime import datetime
        
        # Map component to deployment info
        deployment_map = {
            "gateway-api": ("gateway", "main-gateway")
        }
        
        if component not in deployment_map:
            return

        kind, name = deployment_map[component]
        logger.info(f"Triggering {kind} restart for {name} in {namespace}")

        if kind == "gateway":
            api_version, kind_cap = "gateway.networking.k8s.io/v1", "Gateway"
        else:
            api_version, kind_cap = "apps/v1", kind.capitalize()

        # Use the dynamic client for generic patching
        resource_client = k8s_helper.dyn_client.resources.get(api_version=api_version, kind=kind_cap)
        
        # Patch body: update annotation
        patch = {
            "spec": {
                "template": {
                    "metadata": {
                        "annotations": {
                            "kubectl.kubernetes.io/restartedAt": datetime.now().isoformat()
                        }
                    }
                }
            }
        }
        
        resource_client.patch(name=name, namespace=namespace, body=patch)
        
    except Exception as e:
        logger.error(f"Failed to trigger rollout restart for {component}: {e}")
