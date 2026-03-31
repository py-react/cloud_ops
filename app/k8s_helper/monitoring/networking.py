import requests
import yaml
import logging

logger = logging.getLogger(__name__)

def get_flannel_manifests():
    """
    Fetches the latest Flannel manifests from the official repository.
    """
    manifest_url = "https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml"
    
    try:
        response = requests.get(manifest_url, timeout=30)
        response.raise_for_status()
        manifests = list(yaml.safe_load_all(response.content))
        return manifests
    except Exception as e:
        logger.error(f"Failed to fetch Flannel manifests: {str(e)}")
        return []
