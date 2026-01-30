import yaml
import requests
import io
from copy import deepcopy

def get_metrics_server_manifests(namespace="kube-system"):
    """
    Fetches the latest compatible Metrics Server manifests from the official repository,
    patches them with required arguments, and returns a list of resource dictionaries.
    """
    from app.k8s_helper.monitoring.stack import DEFAULT_METRICS_SERVER_CONFIG
    manifest_url = "https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
    
    try:
        response = requests.get(manifest_url, timeout=30)
        response.raise_for_status()
        manifests = list(yaml.safe_load_all(response.content))
    except Exception as e:
        logger.warning(f"Failed to fetch remote metrics-server manifests: {str(e)}")
        manifests = []
        
    patched_manifests = [
        {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {"name": "metrics-server-config", "namespace": namespace},
            "data": {
                "config.yml": DEFAULT_METRICS_SERVER_CONFIG
            }
        }
    ]
    
    for doc in manifests:
        if not doc:
            continue
            
        resource = deepcopy(doc)
        
        # Patch Deployment
        if resource.get("kind") == "Deployment" and resource.get("metadata", {}).get("name") == "metrics-server":
            spec = resource.get("spec", {}).get("template", {}).get("spec", {})
            containers = spec.get("containers", [])
            
            if containers:
                container = next((c for c in containers if c["name"] == "metrics-server"), None)
                if container:
                    if "--kubelet-insecure-tls" not in container["args"]:
                        container["args"].append("--kubelet-insecure-tls")
        
        patched_manifests.append(resource)
        
    return patched_manifests
