from app.k8s_helper import KubernetesResourceHelper
from typing import Optional,Dict

async def GET():
    try:
        k8s_helper = KubernetesResourceHelper()
        metrics = k8s_helper.get_cluster_metrics()

        return {
            "status":"success",
            "data":metrics
        }
    except Exception as e:
        return {
            "status":"error",
            "message":str(e)
        }
