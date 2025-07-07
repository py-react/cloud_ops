from fastapi import Request, HTTPException
from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
from app.db_client.models.deployment_run.types import DeploymentRunType
from fastapi.responses import JSONResponse
from typing import Optional

def validate_deployment_run(run: DeploymentRunType) -> None:
    if not run.image_name:
        raise HTTPException(status_code=400, detail="Image name is required")
    if not run.deployment_config_id:
        raise HTTPException(status_code=400, detail="deployment_config_id is required")

async def POST(request: Request, body: DeploymentRunType):
    try:
        validate_deployment_run(body)
        manager = DeploymentManager()
        result = manager.run_deployment_from_run(body)
        return {
            "status": "success",
            "message": result["deployment_result"],
            "data": result["run"]
        }
    except HTTPException as he:
        return JSONResponse(content={"status": "error", "message": he.detail}, status_code=he.status_code)
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

async def GET(request: Request,config_id: int, id: Optional[int] = None):
    try:
        manager = DeploymentManager()
        if id:
            result = manager.get_deployment_run(id)
        else:
            result = manager.list_deployment_runs(id=config_id)
        return {
            "status": "success",
            "data": result or []
        }
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

async def PUT(request: Request, id: int, body: DeploymentRunType):
    try:
        validate_deployment_run(body)
        manager = DeploymentManager()
        result = manager.update_deployment_run(id, body)
        return {
            "status": "success",
            "message": "Deployment run updated successfully",
            "data": result
        }
    except HTTPException as he:
        return JSONResponse(content={"status": "error", "message": he.detail}, status_code=he.status_code)
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

async def DELETE(request: Request, id: int):
    try:
        manager = DeploymentManager()
        result = manager.get_deployment_run(id)
        if not result:
            return JSONResponse(content={"status": "error", "message": "Deployment run not found"}, status_code=404)
        deleted = manager.delete_deployment_run(id)
        return {
            "status": "success",
            "message": "Deployment run deleted successfully",
            "data": deleted
        }
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

async def PATCH(request: Request, id: int, status: str):
    """
    Update only the status of a deployment run.
    """
    try:
        manager = DeploymentManager()
        result = manager.update_deployment_run_status(id, status)
        return {
            "status": "success",
            "message": "Deployment run status updated successfully",
            "data": result
        }
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)
