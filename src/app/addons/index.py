from fastapi import Request
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper

async def meta_data():
    return {
        "title": "Monitoring Essentials",
    }

async def index(request: Request):
    try:
        k8s_helper = KubernetesResourceHelper()
        namespaces = k8s_helper.get_namespaces()
        installed = any(ns.get("metadata", {}).get("name") == "monitoring" for ns in namespaces)
        
        # Optionally list the pods if installed
        pods = []
        if installed:
            pods = k8s_helper.get_resource_details("pods", namespace="monitoring")
            
        return {
            "isInstalled": installed,
            "pods": pods
        }
    except Exception as e:
        return {
            "isInstalled": False,
            "error": str(e)
        }
