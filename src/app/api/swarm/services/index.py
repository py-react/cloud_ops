from app.docker_client import clientContext
import docker
from fastapi import Query

async def GET(filters=Query(None)):
    try:
        # Initialize Docker client from context
        client = clientContext.get_client()
        # List all services with optional filters
        services = client.services.list(filters=filters)
        return {"status": "Services listed successfully", "services": [service.attrs for service in services]}
    except (ValueError, Exception) as e:
        return {"error":True,"message": f"Error listing services: {str(e)}"}