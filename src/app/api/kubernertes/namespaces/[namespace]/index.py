from app.k8s_helper import KubernetesResourceHelper

async def GET(namespace: str):
    try:
        k8s_helper = KubernetesResourceHelper()
        details = k8s_helper.get_namespace_details(namespace)
        return {
            "status": "success",
            "data": details
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
