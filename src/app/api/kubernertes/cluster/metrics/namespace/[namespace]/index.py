from app.k8s_helper import KubernetesResourceHelper
from typing import Optional

async def GET(namespace: str):
    try:
        k8s_helper = KubernetesResourceHelper()
        metrics = k8s_helper.get_namespace_metrics(namespace)
        return {
            "status": "success",
            "data": metrics
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
