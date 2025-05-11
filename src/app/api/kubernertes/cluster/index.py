from fastapi import Request
from app.k8s_helper import KubernetesResourceHelper



async def GET(request:Request):
    try:
        k8s_helper = KubernetesResourceHelper()
        cluster_info = k8s_helper.get_cluster_info()

        return {
            "status":"success",
            "data":cluster_info
        }
    except Exception as e:
        return {
            "status":"error",
            "message":str(e)
        }