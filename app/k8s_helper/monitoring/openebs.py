import requests
import yaml
import logging

logger = logging.getLogger(__name__)

def get_openebs_manifests():
    """
    Fetches the OpenEBS Operator manifests and appends a standard StorageClass.
    """
    # OpenEBS Operator
    operator_url = "https://openebs.github.io/charts/openebs-operator.yaml"
    
    try:
        response = requests.get(operator_url, timeout=30)
        response.raise_for_status()
        manifests = [m for m in yaml.safe_load_all(response.content) if m is not None]
        
        # Add LocalPV Hostpath as 'standard' StorageClass
        # LocalPV is reliable and doesn't require iSCSI initiators on nodes
        standard_sc = {
            "apiVersion": "storage.k8s.io/v1",
            "kind": "StorageClass",
            "metadata": {
                "name": "standard",
                "annotations": {
                    "storageclass.kubernetes.io/is-default-class": "true"
                }
            },
            "provisioner": "openebs.io/local",
            "volumeBindingMode": "WaitForFirstConsumer",
            "reclaimPolicy": "Delete"
        }
        
        # Also add a regular openebs-jiva for documentation
        jiva_sc = {
            "apiVersion": "storage.k8s.io/v1",
            "kind": "StorageClass",
            "metadata": {
                "name": "openebs-jiva",
            },
            "provisioner": "openebs.io/provisioner-iscsi",
            "parameters": {
                "openebs.io/cas-type": "jiva",
                "cas.openebs.io/config": yaml.dump([
                    {"name": "ReplicaCount", "value": "2"}
                ])
            }
        }

        # Add a LocalPV Hostpath for high performance but no replication
        local_sc = {
            "apiVersion": "storage.k8s.io/v1",
            "kind": "StorageClass",
            "metadata": {
                "name": "local-device",
            },
            "provisioner": "openebs.io/local",
            "volumeBindingMode": "WaitForFirstConsumer",
            "reclaimPolicy": "Delete"
        }

        manifests.extend([standard_sc, jiva_sc, local_sc])
        return manifests
    except Exception as e:
        logger.error(f"Failed to fetch OpenEBS manifests: {str(e)}")
        return []
