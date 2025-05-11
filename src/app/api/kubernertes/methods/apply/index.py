from fastapi import Request
from typing import Dict
from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
import yaml

from pydantic import BaseModel
class ApplyBody(BaseModel):
    manifest: str

async def POST(request: Request, body: ApplyBody):
    try:
        # Initialize Kubernetes helper
        k8s_helper = KubernetesResourceHelper()
        
        # Preprocess and parse YAML string to dict
        
        try:
            manifest_dict = yaml.safe_load(body.manifest)
            # Apply the manifest
            result = k8s_helper.apply_resource(manifest_dict)
             
            return {
                "success": True,
                "data": {
                    "message": f"Successfully applied {manifest_dict.get('kind')}/{manifest_dict.get('metadata', {}).get('name')}",
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
