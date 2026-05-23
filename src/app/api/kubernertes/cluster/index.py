from fastapi import Request
from fastapi.responses import JSONResponse
from app.k8s_helper import KubernetesResourceHelper



async def GET(request:Request):
    try:
        k8s_helper = KubernetesResourceHelper()
        cluster_info = k8s_helper.get_cluster_info()

        return {
            "status":"success",
            "data":cluster_info
        }
    except ValueError:
        raise
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})