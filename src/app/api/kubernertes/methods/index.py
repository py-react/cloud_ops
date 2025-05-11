from app.k8s_helper import KubernetesResourceHelper

async def GET(type:str):
    k8s_helper = KubernetesResourceHelper()
    return k8s_helper.list_operations()
    
    
    