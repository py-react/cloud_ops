from app.docker_client import clientContext
from fastapi import Request, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any
import docker

client = clientContext.client

# Request Models
class NetworkCreateParams(BaseModel):
    name: str = Field(..., description="Name of the network to create")
    driver: Optional[str] = Field(default="bridge", description="Network driver to use")
    options: Optional[Dict[str, str]] = Field(default=None, description="Network driver options")
    ipam: Optional[Dict] = Field(default=None, description="IPAM configuration")
    check_duplicate: Optional[bool] = Field(default=True, description="Check for duplicate networks")
    internal: Optional[bool] = Field(default=False, description="Create an internal network")
    labels: Optional[Dict[str, str]] = Field(default=None, description="Network labels")
    enable_ipv6: Optional[bool] = Field(default=False, description="Enable IPv6")
    attachable: Optional[bool] = Field(default=False, description="Make network attachable")
    scope: Optional[str] = Field(default=None, description="Network scope")
    ingress: Optional[bool] = Field(default=False, description="Create an ingress network")

class NetworkDeleteParams(BaseModel):
    network_id: str = Field(..., description="ID of the network to delete")

class NetworkUpdateParams(BaseModel):
    network_id: str = Field(..., description="ID of the network to update")
    name: Optional[str] = None
    driver: Optional[str] = None
    scope: Optional[str] = None
    options: Optional[dict] = None
    ipam: Optional[dict] = None
    internal: Optional[bool] = None
    labels: Optional[dict] = None
    enable_ipv6: Optional[bool] = None
    attachable: Optional[bool] = None
    ingress: Optional[bool] = None

# Response Models
class NetworkInfo(BaseModel):
    Name: str
    Id: str
    Created: str
    Scope: str
    Driver: str
    EnableIPv6: bool = False
    IPAM: Dict[str, Any] = Field(default_factory=lambda: {
        "Driver": "default",
        "Options": None,
        "Config": []
    })
    Internal: bool = False
    Attachable: bool = False
    Ingress: bool = False
    ConfigFrom: Dict[str, str] = Field(default_factory=lambda: {"Network": ""})
    ConfigOnly: bool = False
    Containers: Dict[str, Any] = Field(default_factory=dict)
    Options: Dict[str, str] = Field(default_factory=dict)
    Labels: Dict[str, str] = Field(default_factory=dict)

class NetworkListResponse(BaseModel):
    items: List[NetworkInfo]

class NetworkCreateResponse(BaseModel):
    status: str
    network: NetworkInfo

class NetworkDeleteResponse(BaseModel):
    status: str
    network_id: str

class ErrorResponse(BaseModel):
    error: bool = True
    message: str

async def GET(request: Request) -> NetworkListResponse:
    """
    List all Docker networks.
    
    Returns:
        NetworkListResponse: List of network information
    """
    try:
        networks = client.networks.list()
        network_info = []
        for network in networks:
            try:
                # Map Docker SDK response to our NetworkInfo model
                attrs = network.attrs
                network_info.append(NetworkInfo(
                    Name=attrs.get('Name', ''),
                    Id=attrs.get('Id', ''),
                    Created=attrs.get('Created', ''),
                    Scope=attrs.get('Scope', ''),
                    Driver=attrs.get('Driver', ''),
                    EnableIPv6=attrs.get('EnableIPv6', False),
                    IPAM=attrs.get('IPAM', {
                        "Driver": "default",
                        "Options": None,
                        "Config": []
                    }),
                    Internal=attrs.get('Internal', False),
                    Attachable=attrs.get('Attachable', False),
                    Ingress=attrs.get('Ingress', False),
                    ConfigFrom=attrs.get('ConfigFrom', {"Network": ""}),
                    ConfigOnly=attrs.get('ConfigOnly', False),
                    Containers=attrs.get('Containers', {}),
                    Options=attrs.get('Options', {}),
                    Labels=attrs.get('Labels', {})
                ))
            except Exception as e:
                print(f"Error processing network info: {e}")
        return NetworkListResponse(items=network_info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list networks: {str(e)}")

async def POST(request: Request, params: NetworkCreateParams) -> NetworkCreateResponse:
    """
    Create a new Docker network.
    
    Args:
        params: Network creation parameters
        
    Returns:
        NetworkCreateResponse: Created network information
        
    Raises:
        HTTPException: If network creation fails
    """
    try:
        network = client.networks.create(
            name=params.name,
            driver=params.driver,
            options=params.options,
            ipam=params.ipam,
            check_duplicate=params.check_duplicate,
            internal=params.internal,
            labels=params.labels,
            enable_ipv6=params.enable_ipv6,
            attachable=params.attachable,
            scope=params.scope,
            ingress=params.ingress
        )
        
        # Map Docker SDK response to our NetworkInfo model
        attrs = network.attrs
        network_info = NetworkInfo(
            Name=attrs.get('Name', ''),
            Id=attrs.get('Id', ''),
            Created=attrs.get('Created', ''),
            Scope=attrs.get('Scope', ''),
            Driver=attrs.get('Driver', ''),
            EnableIPv6=attrs.get('EnableIPv6', False),
            IPAM=attrs.get('IPAM', {
                "Driver": "default",
                "Options": None,
                "Config": []
            }),
            Internal=attrs.get('Internal', False),
            Attachable=attrs.get('Attachable', False),
            Ingress=attrs.get('Ingress', False),
            ConfigFrom=attrs.get('ConfigFrom', {"Network": ""}),
            ConfigOnly=attrs.get('ConfigOnly', False),
            Containers=attrs.get('Containers', {}),
            Options=attrs.get('Options', {}),
            Labels=attrs.get('Labels', {})
        )
        
        return NetworkCreateResponse(
            status="Network created successfully",
            network=network_info
        )
    except docker.errors.APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create network: {str(e)}")

async def PUT(request: Request, params: NetworkUpdateParams) -> NetworkCreateResponse:
    """
    Update an existing Docker network by creating a new one with updated attributes
    and removing the old one.
    
    Args:
        request: Request object
        params: Network update parameters
        
    Returns:
        NetworkCreateResponse: Updated network information
        
    Raises:
        HTTPException: If network update fails
    """
    try:
        # Get the old network
        old_network = client.networks.get(params.network_id)
        old_attrs = old_network.attrs
        
        # Prepare new network attributes
        new_attrs = {
            'name': params.name or old_attrs['Name'],
            'driver': params.driver or old_attrs['Driver'],
            'options': params.options or old_attrs.get('Options', {}),
            'ipam': params.ipam or old_attrs.get('IPAM', {
                "driver": "default",
                "config": []
            }),
            'internal': params.internal if params.internal is not None else old_attrs['Internal'],
            'labels': params.labels or old_attrs.get('Labels', {}),
            'enable_ipv6': params.enable_ipv6 if params.enable_ipv6 is not None else old_attrs.get('EnableIPv6', False),
            'attachable': params.attachable if params.attachable is not None else old_attrs.get('Attachable', False),
            'ingress': params.ingress if params.ingress is not None else old_attrs.get('Ingress', False)
        }
        
        
        try:
            # Try to remove old network
            old_network.remove()
        except docker.errors.APIError as e:
            # If removal fails, clean up the new network and raise appropriate error
            if "network has active endpoints" in str(e):
                # Extract container names from the error message
                error_msg = str(e)
                container_names = error_msg.split("(")[-1].rstrip(")").split(", ")
                raise HTTPException(
                    status_code=409,
                    detail=f"Cannot update network while it has active endpoints. Connected containers: {', '.join(container_names)}"
                )
            raise HTTPException(status_code=500, detail=f"Failed to remove old network: {str(e)}")
        
        # Create new network first
        new_network = client.networks.create(**new_attrs)
        
        return NetworkCreateResponse(
            status="Network updated successfully",
            network=NetworkInfo(**new_network.attrs)
        )
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail=f"Network with ID {params.network_id} not found")
    except docker.errors.APIError as e:
        if "network is in use" in str(e):
            raise HTTPException(status_code=409, detail="Cannot update network that is in use")
        raise HTTPException(status_code=500, detail=f"Failed to update network: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update network: {str(e)}")

async def DELETE(request: Request, params: NetworkDeleteParams) -> NetworkDeleteResponse:
    """
    Delete a Docker network.
    
    Args:
        params: Network deletion parameters
        
    Returns:
        NetworkDeleteResponse: Deletion confirmation
        
    Raises:
        HTTPException: If network deletion fails
    """
    try:
        network = client.networks.get(params.network_id)
        network.remove()
        
        return NetworkDeleteResponse(
            status="Network deleted successfully",
            network_id=params.network_id
        )
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail=f"Network with ID {params.network_id} not found")
    except docker.errors.APIError as e:
        if "network is in use" in str(e):
            raise HTTPException(
                status_code=409,
                detail="Network is in use. Disconnect all containers before deleting."
            )
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete network: {str(e)}")