import docker

async def GET(service_id: str):
    try:
        # Initialize Docker client
        client = docker.from_env()
        # Get details of a service by ID
        service = client.services.get(service_id)
        return {"service_id": service.id, "service_details": service.attrs}
    except docker.errors.NotFound:
        {"error":True,"message": f"Service with ID {service_id} not found."}
    except docker.errors.APIError as e:
        return {"error":True,"message": f"Error fetching service details: {e}"}
    