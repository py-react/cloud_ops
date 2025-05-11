from fastapi import Request, HTTPException
from kubernetes import config

import subprocess
from typing import Optional, Literal
from pydantic import BaseModel
from app.k8s_helper.core.context_ops import ContextOperations, CreateContextData
from render_relay.utils import load_settings
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
        raise HTTPException(status_code=500, detail=f"Error running kubectl: {e.stderr}")

async def GET(action:Literal["all","current"]):
    settings = load_settings()
    context_ops = ContextOperations(path=settings.get("KUBECONFIG","~/.kube/config"))
    if action == "all":
        return context_ops.load_kubeconfig()[0]

    return {"current_context": context_ops.get_current_contex()}

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
    settings = load_settings()
    if data.type == ContextPostType.SWITCH:
        command = [
            "kubectl", "config", "use-context", data.payload.switch, "--kubeconfig", settings.get("KUBECONFIG","~/.kube/config")
        ]
        output = run_kubectl_command(command)
        return {"message": f"Context '{data.payload.switch}' set successfully", "output": output}
    
    context_ops = ContextOperations(path=data.payload.create.config_file)
    return context_ops.create_context(data=data.payload.create)
