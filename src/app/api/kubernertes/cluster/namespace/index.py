from app.k8s_helper import KubernetesResourceHelper
from typing import Optional,Dict
from pydantic import BaseModel


async def GET(label_selector: Optional[str] = None):
    try:
        k8s_helper = KubernetesResourceHelper()
        namespaces = k8s_helper.get_namespaces(label_selector=label_selector)

        return {
            "status":"success",
            "data":namespaces
        }
    except Exception as e:
        return {
            "status":"error",
            "message":str(e)
        }


class CreateNamespacePayload(BaseModel):
    name: str
    labels: Optional[Dict[str, str]]=None

async def POST(body:CreateNamespacePayload):
    try:
        k8s_helper = KubernetesResourceHelper()
        namespace = k8s_helper.create_namespace(name=body.name,labels=body.labels)

        return {
            "status":"success",
            "data":namespace
        }
    except Exception as e:
        return {
            "status":"error",
            "message":str(e)
        }
    

async def DELETE(name:str):
    try:
        k8s_helper = KubernetesResourceHelper()
        namespace = k8s_helper.delete_namespace(name=name)

        return {
            "status":"success",
            "deleted":namespace
        }
    except Exception as e:
        return {
            "status":"error",
            "message":str(e)
        }