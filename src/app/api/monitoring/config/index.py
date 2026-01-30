from fastapi import Request, HTTPException, Query
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
import yaml
import logging
import requests
from pydantic import BaseModel
from app.k8s_helper.monitoring.stack import (
    DEFAULT_ALERTMANAGER_CONFIG, 
    DEFAULT_PROMETHEUS_CONFIG,
    DEFAULT_GRAFANA_DATASOURCES,
    DEFAULT_NODE_EXPORTER_CONFIG,
    DEFAULT_METRICS_SERVER_CONFIG
)

logger = logging.getLogger(__name__)

# Mapping component to (ConfigMap name, data key, default config, namespace)
COMPONENT_MAP = {
    "alertmanager": ("alertmanager-config", "alertmanager.yml", DEFAULT_ALERTMANAGER_CONFIG, "monitoring"),
    "prometheus": ("prometheus-server-conf", "prometheus.yml", DEFAULT_PROMETHEUS_CONFIG, "monitoring"),
    "grafana": ("grafana-datasources", "datasources.yaml", DEFAULT_GRAFANA_DATASOURCES, "monitoring"),
    "node-exporter": ("node-exporter-conf", "config.yml", DEFAULT_NODE_EXPORTER_CONFIG, "monitoring"),
    "metrics-server": ("metrics-server-config", "config.yml", DEFAULT_METRICS_SERVER_CONFIG, "kube-system"),
}
async def GET(request: Request, component: str = Query("alertmanager")) -> dict:
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
        
        # 5. Hot-reload is now handled automatically by internal config-reloader sidecars
        # We no longer need to trigger it via external requests, which avoids DNS issues.
        logger.info(f"{component} configuration updated; internal sidecar will trigger hot-reload")
        
        return {"success": True, "message": f"{component.capitalize()} configuration updated successfully"}
    except Exception as e:
        logger.error(f"Error updating {component} config: {str(e)}")
        return {"success": False, "message": str(e)}
