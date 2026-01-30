import yaml
import requests
import io
from copy import deepcopy

def get_metrics_server_manifests(namespace="kube-system"):
    """
    Fetches the latest compatible Metrics Server manifests from the official repository,
    patches them with required arguments, and returns a list of resource dictionaries.
    
    Target URL: https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    """
    manifest_url = "https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml"
    
    try:
        response = requests.get(manifest_url, timeout=30)
        response.raise_for_status()
        
        # Parse multi-document YAML
        manifests = list(yaml.safe_load_all(response.content))
        
        patched_manifests = []
        
        for doc in manifests:
            if not doc:
                continue
                
            # Deep copy to avoid modifying original if we were caching (good practice)
            resource = deepcopy(doc)
            
            # Patch Deployment
            if resource.get("kind") == "Deployment" and resource.get("metadata", {}).get("name") == "metrics-server":
                spec = resource.get("spec", {}).get("template", {}).get("spec", {})
                containers = spec.get("containers", [])
                
                if containers:
                    # Find metrics-server container
                    container = next((c for c in containers if c["name"] == "metrics-server"), None)
                    if container:
                        # Replace args completely as requested
                        # Default args are usually: --cert-dir, --secure-port, --kubelet-preferred-address-types, --metric-resolution
                        # We are overriding to ensure custom flags are present
                        container["args"].append("--kubelet-insecure-tls")
            
            patched_manifests.append(resource)
            
        return patched_manifests
        
    except Exception as e:
        # Fallback or re-raise? For now, we return empty or raise. 
        # Raising is better so the UI shows an error.
        raise RuntimeError(f"Failed to fetch metrics-server manifests: {str(e)}")
