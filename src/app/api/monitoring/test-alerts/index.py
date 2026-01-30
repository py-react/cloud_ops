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
        try:
            am_url = "http://alertmanager-service.monitoring.svc.cluster.local/api/v2/alerts"
            
            immediate_alerts = [
                {
                    "labels": {
                        "alertname": "DeterministicCritical",
                        "severity": "critical",
                        "instance": "ui-tester",
                        "job": "manual-test"
                    },
                    "annotations": {
                        "summary": "INSTANT CRITICAL: Webhook routing verified",
                        "description": "Deterministic critical alert for stakeholder demonstration."
                    }
                }
            ]
            
            am_resp = requests.post(am_url, json=immediate_alerts, timeout=2)
            results["api_alerts"] = "success" if am_resp.status_code < 300 else f"error {am_resp.status_code}"
        except Exception as api_e:
            results["api_alerts"] = f"skipped/unreachable: {str(api_e)}"

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
                    k8s_helper.delete_resource("Pod", name, namespace)
                except Exception:
                    pass
            
            # Give it a tiny moment to delete
            import time
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
                            "image": "busybox",
                            "command": ["sh", "-c", "exit 1"]
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
                            "image": "busybox",
                            "command": ["sh", "-c", "echo 'Warning trigger' && exit 1"],
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
                            "image": "busybox",
                            "command": ["sh", "-c", "sleep 3600"]
                        }]
                    }
                }
            ]
            
            for manifest in manifests:
                k8s_helper.apply_resource(manifest)
            
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
