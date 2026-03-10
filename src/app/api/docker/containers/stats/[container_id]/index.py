from fastapi import Request
from app.docker_client import clientContext


async def GET(request: Request,container_id: str):
    try:
        client = clientContext.get_client()
        container = client.containers.get(container_id)
        if container.status == 'running':
            stats = container.stats(stream=False)
            return {"stats": stats}
        return {"stats": None}
    except Exception as e:
        print(f"Error retrieving stats for container {container_id}: {e}")
        return {"stats": None} 