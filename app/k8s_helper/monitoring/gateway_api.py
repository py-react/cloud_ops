import yaml
import requests
import logging

logger = logging.getLogger(__name__)

GATEWAY_API_URL = "https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.0.0/standard-install.yaml"

DEFAULT_GATEWAY_CONFIG = """apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: main-gateway
  namespace: monitoring
spec:
  gatewayClassName: nginx
  listeners:
  - name: http
    port: 80
    protocol: HTTP
    hostname: "*.example.com"
"""

def get_gateway_api_manifests():
    """
    Fetches the standard Kubernetes Gateway API v1.0.0 CRDs and returns them as a list of manifests.
    Includes the default main-gateway and a ConfigMap for UI configuration.
    """
    try:
        response = requests.get(GATEWAY_API_URL, timeout=30)
        response.raise_for_status()
        manifests = list(yaml.safe_load_all(response.content))
    except Exception as e:
        logger.error(f"Failed to fetch Gateway API manifests: {str(e)}")
        manifests = []
    
    # ConfigMap for the Gateway (allowing UI configuration)
    config_map = {
        "apiVersion": "v1",
        "kind": "ConfigMap",
        "metadata": {"name": "gateway-api-config", "namespace": "monitoring"},
        "data": {
            "gateway.yaml": DEFAULT_GATEWAY_CONFIG
        }
    }

    # Default Gateway resource
    gateway_resource = {
        "apiVersion": "gateway.networking.k8s.io/v1",
        "kind": "Gateway",
        "metadata": {
            "name": "main-gateway",
            "namespace": "monitoring"
        },
        "spec": {
            "gatewayClassName": "nginx",
            "listeners": [
                {
                    "name": "http",
                    "protocol": "HTTP",
                    "port": 80,
                    "hostname": "*.example.com"
                }
            ]
        }
    }
    
    return manifests + [config_map, gateway_resource]
