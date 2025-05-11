import docker
from fastapi import Query

async def GET(filters=Query(None)):
    try:
         # Initialize Docker client
        client = docker.from_env()
        # List all services with optional filters
        services = client.services.list(filters=filters)
        return {"status": "Services listed successfully", "services": [service.attrs for service in services]}
    except docker.errors.APIError as e:
        return {"error":True,"message": f"Error listing services: {e}"}