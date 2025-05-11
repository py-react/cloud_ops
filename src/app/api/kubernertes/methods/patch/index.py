from fastapi import Request
from typing import Dict, Any
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
import yaml

from pydantic import BaseModel
class ApplyBody(BaseModel):
    manifest: str
    op_name: str
    data: Dict[str, Any]

async def POST(request: Request, body: ApplyBody):
    try:
        # Initialize Kubernetes helper
        k8s_helper = KubernetesResourceHelper()
        
        try:
            manifest_dict = yaml.safe_load(body.manifest)
            kind = manifest_dict.get('kind', '<Unknown>')
            op_name = body.op_name
            data = body.data
            # Apply the manifest
            result = k8s_helper.run_op(resource=manifest_dict, op_name=op_name, kind=kind, data=data)
            
            return {
                "success": True,
                "data": {
                    "message": f"Successfully patched {manifest_dict.get('kind')}/{manifest_dict.get('metadata', {}).get('name')}",
                    "resource": result
                }
            }
        except yaml.YAMLError as e:
            return {
                "success": False,
                "error": f"Invalid YAML format: {str(e)}",
                "processed_yaml": body  # For debugging
            }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

