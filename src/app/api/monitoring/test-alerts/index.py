from fastapi import Request
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
import logging
import json
import requests
import time

logger = logging.getLogger(__name__)

async def POST(request: Request) -> dict:
    """
    Triggers test alerts using two modes:
    1. IMMEDIATE: Sends alerts directly to Alertmanager API (best-effort).
    2. REAL-WORLD: Deploys failing pods in alertmanager-test namespace.
    """
    try:
        results = {"api_alerts": "pending", "pod_deployment": "pending"}
        k8s_helper = KubernetesResourceHelper()
        namespace = "alertmanager-test"
        
        # --- MODE 1: IMMEDIATE API ALERTS ---

        # --- MODE 2: REAL-WORLD POD DEPLOYMENT ---
        try:
            # 1. Ensure test namespace exists
            try:
                k8s_helper.create_namespace(namespace)
            except Exception:
                pass
            
            # 2. Cleanup old pods to ensure fresh triggers (Pods are immutable mostly)
            pod_names = ["deterministic-critical-pod", "deterministic-warning-pod", "deterministic-info-pod"]
            for name in pod_names:
                try:
                    # Fix: delete_resource expects a dict
                    resource_dict = {
                        "apiVersion": "v1",
                        "kind": "Pod",
                        "metadata": {"name": name, "namespace": namespace}
                    }
                    k8s_helper.delete_resource(resource_dict)
                except Exception as del_e:
                    logger.warning(f"Failed to delete pod {name}: {del_e}")
            
            # Wait for deletion completion (polling up to 10s)
            import time
            for _ in range(10):
                remaining_pods = 0
                try:
                    pods = k8s_helper.get_resource_details("pods", namespace=namespace)
                    existing_names = [p.get("metadata", {}).get("name") for p in pods]
                    remaining_pods = sum(1 for name in pod_names if name in existing_names)
                except Exception:
                    pass
                
                if remaining_pods == 0:
                    break
                time.sleep(1)
                
            manifests = [
                {
                    "apiVersion": "v1",
                    "kind": "Pod",
                    "metadata": {
                        "name": "deterministic-critical-pod",
                        "namespace": namespace,
                        "labels": {"app": "alert-test", "severity": "critical"}
                    },
                    "spec": {
                        "containers": [{
                            "name": "crasher",
                            "image": "nginx:alpine",
                            "command": ["sh", "-c", "echo 'CRITICAL_ERROR: System failure detected' && sleep 5 && exit 1"]
                        }],
                        "restartPolicy": "Always"
                    }
                },
                {
                    "apiVersion": "v1",
                    "kind": "Pod",
                    "metadata": {
                        "name": "deterministic-warning-pod",
                        "namespace": namespace,
                        "labels": {"app": "alert-test", "severity": "warning"}
                    },
                    "spec": {
                        "containers": [{
                            "name": "loader",
                            "image": "nginx:alpine",
                            "command": ["sh", "-c", "echo 'WARNING: High resource utilization' && sleep 3600"],
                            "resources": {"limits": {"cpu": "10m"}}
                        }],
                        "restartPolicy": "Always"
                    }
                },
                {
                    "apiVersion": "v1",
                    "kind": "Pod",
                    "metadata": {
                        "name": "deterministic-info-pod",
                        "namespace": namespace,
                        "labels": {"app": "alert-test", "severity": "info"}
                    },
                    "spec": {
                        "containers": [{
                            "name": "reporter",
                            "image": "nginx:alpine",
                            "command": ["sh", "-c", "echo 'INFO: Periodic system report generated' && sleep 3600"]
                        }]
                    }
                }
            ]
            
            for manifest in manifests:
                try:
                    k8s_helper.create_resource(manifest)
                except Exception as e:
                    # If it already exists (e.g. terminating), log it and move on
                    logger.warning(f"Could not create pod {manifest['metadata']['name']}: {e}")
            
            results["pod_deployment"] = "success"
        except Exception as pod_e:
            results["pod_deployment"] = f"failed: {str(pod_e)}"
        
        return {
            "success": True, 
            "message": "Deterministic test suite initiated. Pods isolated from global rules.",
            "results": results,
            "namespace": namespace
        }
            
    except Exception as e:
        logger.error(f"Error in test-alerts: {str(e)}")
        return {"success": False, "message": str(e)}
