from fastapi import Request
from app.k8s_helper import KubernetesResourceHelper
from typing import Optional,Dict
from pydantic import BaseModel


async def GET(label_selector: Optional[str] = None):
    try:
        k8s_helper = KubernetesResourceHelper()
        namespaces = k8s_helper.get_namespaces(label_selector=label_selector)

        return {
            "status": "success",
            "data": namespaces
        }
    except ValueError:
        raise
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": str(e)
        })


class CreateNamespacePayload(BaseModel):
    name: str
    labels: Optional[Dict[str, str]]=None

async def POST(request: Request):
    try:
        data = await request.json()
        name = data.get("name")
        labels = data.get("labels")
        
        if not name:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=400, content={"error": "Missing namespace name"})
            
        k8s_helper = KubernetesResourceHelper()
        namespace = k8s_helper.create_namespace(name=name, labels=labels)

        return {
            "status": "success",
            "data": namespace
        }
    except ValueError:
        raise
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": str(e)
        })
    

async def DELETE(name: Optional[str] = None):
    if not name:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=400, content={"error": "Missing namespace name"})
        
    try:
        k8s_helper = KubernetesResourceHelper()
        namespace = k8s_helper.delete_namespace(name=name)

        return {
            "status": "success",
            "deleted": namespace
        }
    except ValueError:
        raise
    except Exception as e:
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": str(e)
        })