from app.k8s_helper import KubernetesResourceHelper

async def GET(namespace: str):
    try:
        k8s_helper = KubernetesResourceHelper()
        details = k8s_helper.get_namespace_details(namespace)
        return {
            "status": "success",
            "data": details
        }
    except ValueError:
        raise
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"error": str(e)})
