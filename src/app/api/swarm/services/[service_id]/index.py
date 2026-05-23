from app.docker_client import clientContext
import docker

async def GET(service_id: str):
    try:
        # Initialize Docker client
        client = clientContext.get_client()
        # Get details of a service by ID
        service = client.services.get(service_id)
        return {"service_id": service.id, "service_details": service.attrs}
    except docker.errors.NotFound:
        return {"error":True,"message": f"Service with ID {service_id} not found."}
    except (ValueError, docker.errors.APIError, Exception) as e:
        return {"error":True,"message": f"Error fetching service details: {str(e)}"}

    