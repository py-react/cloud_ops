from kubernetes import client, config
import requests
from requests.exceptions import HTTPError

def access_registry_via_api_proxy(namespace="image-registry", service_name="docker", service_port=5000):
    """
    Access Docker registry via Kubernetes API proxy - no port forwarding needed
    """
    try:
        config.load_config()
        
        configuration = client.Configuration.get_default_copy()
        
        # Construct the proxy URL through Kubernetes API
        api_server = configuration.host
        proxy_path = f"/api/v1/namespaces/{namespace}/services/{service_name}:{service_port}/proxy/v2/_catalog"
        
        full_url = f"{api_server}{proxy_path}"
        
        # Use the same auth headers as the kubernetes client
        headers = {}
        if configuration.api_key:
            for key, value in configuration.api_key.items():
                headers[key] = value
        
        if configuration.api_key_prefix:
            for key, value in configuration.api_key_prefix.items():
                if key in headers:
                    headers[key] = f"{value} {headers[key]}"
        try:
            # Make the request
            response = requests.get(
                full_url,
                headers=headers,
                verify=configuration.ssl_ca_cert or not configuration.verify_ssl,
                cert=(configuration.cert_file, configuration.key_file) if configuration.cert_file else None
            )
            
            response.raise_for_status()
            return response.json()
        except HTTPError as api_e:
            if api_e.response.status_code in [404, 503, 502]:
                return {
                    "status": "error",
                    "message": "registry not init",
                    "details": f"Registry service not responding on {service_name}:{service_port}",
                    "namespace": namespace,
                    "service": service_name
                }
            else:
                raise api_e
    except Exception as e:
        print(f"Error accessing registry via API proxy: {e}")
        return None
