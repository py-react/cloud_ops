from fastapi import Request, HTTPException
from app.db_client.models.deployment_config.types import DeploymentConfigType, ContainerConfig, ServicePortConfig, EnvVar
from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
from fastapi.responses import JSONResponse
from typing import Optional

async def POST(request: Request, body: DeploymentConfigType):
    """
    Create a new release configuration.
    """
    try:
        manager = DeploymentManager()
        result = manager.create_deployment(body)
        return {
                "status": "success",
                "message": "Release configuration created successfully",
                "data": result
            }
    except HTTPException as he:
        return JSONResponse(
            content={"status": "error", "message": he.detail},
            status_code=he.status_code
        )
    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500
        )

async def PUT(request: Request, body: DeploymentConfigType):
    """
    Update an existing release configuration.
    """
    try:
        manager = DeploymentManager()
        result = manager.update_deployment(body)
        return {
                "status": "success",
                "message": "Release configuration updated successfully",
                "data": result
            }
    except HTTPException as he:
        return JSONResponse(
            content={"status": "error", "message": he.detail},
            status_code=he.status_code
        )
    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500
        )

async def DELETE(request: Request, namespace: str, name: str):
    """
    Delete a deployment and its associated service.
    """
    try:
        manager = DeploymentManager()
        result = manager.delete_deployment(name=name, namespace=namespace)
        return {
                "status": "success",
                "message": "Deployment deleted successfully",
                "data": result
            }
    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500
        )

async def GET(request: Request, namespace: Optional[str]="default", name: Optional[str]=None):
    """
    Get deployment details. Returns all non-hard-deleted items.
    Frontend handles filtering by status/soft_delete.
    """
    try:
        manager = DeploymentManager()
        if not name:
            result = manager.list_deployments(namespace=namespace)
        else:
            result = manager.get_deployment(name=name, namespace=namespace)
        return {
            "status": "success",
            "data": result
        }
    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": str(e)},
            status_code=500
        )