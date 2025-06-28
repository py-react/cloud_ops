from fastapi import Request, HTTPException
from app.db_client.models.deployment_config.types import DeploymentConfigType, ContainerConfig, ServicePortConfig, EnvVar
from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
from fastapi.responses import JSONResponse
from typing import Optional

def validate_deployment_config(config: DeploymentConfigType) -> None:
    """
    Validate the deployment configuration.
    Raises HTTPException if validation fails.
    """
    if not config.containers:
        raise HTTPException(status_code=400, detail="At least one container configuration is required")
    
    # Validate container configurations
    for container in config.containers:
        if not container.name:
            raise HTTPException(status_code=400, detail="Container name is required")
        
        # Validate ports if specified
        if container.ports:
            port_numbers = set()
            for port in container.ports:
                if port.target_port in port_numbers:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Duplicate target port {port.target_port} in container {container.name}"
                    )
                port_numbers.add(port.target_port)

async def POST(request: Request, body: DeploymentConfigType):
    """
    Create a new deployment with the specified configuration.
    """
    try:
        # Validate deployment configuration
        validate_deployment_config(body)
        
        manager = DeploymentManager()
        result = manager.create_deployment(body)
        return {
                "status": "success",
                "message": "Deployment created successfully",
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
    Update an existing deployment with new configuration.
    """
    try:
        # Validate deployment configuration
        validate_deployment_config(body)
        
        manager = DeploymentManager()
        result = manager.update_deployment(body)
        return {
                "status": "success",
                "message": "Deployment updated successfully",
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
    Get deployment details.
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