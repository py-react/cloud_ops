import requests
import yaml
import logging

logger = logging.getLogger(__name__)

def get_local_path_provisioner_manifests():
    """
    Fetches the latest Local Path Provisioner manifests from the official repository.
    """
    manifest_url = "https://raw.githubusercontent.com/rancher/local-path-provisioner/master/deploy/local-path-storage.yaml"
    
    try:
        response = requests.get(manifest_url, timeout=30)
        response.raise_for_status()
        manifests = list(yaml.safe_load_all(response.content))
        return manifests
    except Exception as e:
        logger.error(f"Failed to fetch Local Path Provisioner manifests: {str(e)}")
        return []
