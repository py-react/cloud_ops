from fastapi import Request
from fastapi.responses import JSONResponse
from kubernetes import config

import subprocess
from typing import Optional, Literal
from pydantic import BaseModel
from app.k8s_helper.core.context_ops import ContextOperations, CreateContextData
from kiwijs.utils import load_settings
from enum import Enum


class KubernetesContext(BaseModel):
    name: str
    namespace: Optional[str] = "default"

class GetKubernetesContext(BaseModel):
    action: Literal["all","current"]

def run_kubectl_command(command: list[str]) -> str:
    try:
        result = subprocess.run(command, text=True, capture_output=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return JSONResponse(status_code=500, content={"error": f"Error running kubectl: {e.stderr}, command: {command}"})

async def GET(request: Request):
    try:
        action = request.query_params.get("action", "current")
        # Use ContextOperations without path to trigger DB/Dynamic loading
        context_ops = ContextOperations()
        if action == "all":
            return context_ops.load_kubeconfig()[0]

        return {"current_context": context_ops.get_current_contex()}
    except ValueError as e:
        return JSONResponse(status_code=403, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

class ContextPostType(Enum):
    SWITCH = "switch"
    CREATE = "create"

class ContextPostPayload(BaseModel):
    switch: Optional[str]=None
    create: Optional[CreateContextData] = None
class ContextPostData(BaseModel):
    type: ContextPostType
    payload: ContextPostPayload


async def POST(request:Request,data: ContextPostData):
    """Set a new Kubernetes context."""
    try:
        # Use ContextOperations without path to trigger DB/Dynamic loading
        context_ops = ContextOperations()
        
        if data.type == ContextPostType.SWITCH:
            # Load, modify current-context, and save
            config_dict, _ = context_ops.load_kubeconfig()
            config_dict['current-context'] = data.payload.switch
            context_ops.save_kubeconfig(config_dict)
            
            return {"message": f"Context '{data.payload.switch}' set successfully"}
        
        # For creation, use the provided config file path if any, otherwise default
        create_path = data.payload.create.config_file if data.payload.create else None
        context_ops_create = ContextOperations(path=create_path)
        return context_ops_create.create_context(data=data.payload.create)
    except ValueError as e:
        return JSONResponse(status_code=403, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
