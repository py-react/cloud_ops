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
    except ValueError:
        raise
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": str(e)
        })
