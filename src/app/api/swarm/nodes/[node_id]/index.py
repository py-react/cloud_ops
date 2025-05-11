import docker
from fastapi import FastAPI, HTTPException, Body

from typing import Dict, Optional
from pydantic import BaseModel


class NodeSpec(BaseModel):
    Availability: Optional[str] = "active"  # Default: active
    Role: Optional[str] = "worker"  # Default: worker
    Labels: Optional[Dict[str, str]] = None  # Default: None
    Constraints: Optional[list] = None  # Default: None
    Hostname: Optional[str] = None  # Default: None (hostname of the Docker host)

async def GET(node_id: str):
    try:
        # Initialize Docker client
        client = docker.from_env()
        # Retrieve node details by ID
        node = client.nodes.get(node_id)
        return {"node_id": node.id, "node_details": node.attrs}
    except docker.errors.APIError as e:
        return {"message": f"Error fetching node details: {e}"}
    

async def PUT(node_id: str, spec: NodeSpec):
    try:
        # Initialize Docker client
        client = docker.from_env()
        node = client.nodes.get(node_id)
        node_spec_dict = spec.model_dump(exclude_unset=True)
        # Update node with provided spec
        result = node.update(node_spec_dict)
        return {"status": "Node updated successfully", "result": result}
    except docker.errors.APIError as e:
        return {"error":True,"message": f"Error updating node: {e}"}