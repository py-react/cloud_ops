from app.k8s_helper import KubernetesResourceHelper

from fastapi import Request

async def GET(request: Request):
    k8s_helper = KubernetesResourceHelper()
    return k8s_helper.list_operations()
    
    
    