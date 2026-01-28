from fastapi import Body
import yaml
from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
from app.db_client.db import get_session
from fastapi.responses import JSONResponse
from pydantic import BaseModel

class YAMLImportRequest(BaseModel):
    manifest: str

async def POST(payload: YAMLImportRequest = Body(...)):
    """
    Import Kubernetes resources from a YAML manifest.
    Expected body: { "manifest": "..." }
    """
    try:
        manifest_text = payload.manifest
            
        data = yaml.safe_load(manifest_text)
        
        with get_session() as session:
            manager = DeploymentManager(session)
            result = manager.import_from_yaml(data)
            
        return result
    except yaml.YAMLError as e:
        return JSONResponse(status_code=400, content={"detail": f"Invalid YAML: {str(e)}"})
    except ValueError as e:
        return JSONResponse(status_code=400, content={"detail": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": f"Internal server error: {str(e)}"})
