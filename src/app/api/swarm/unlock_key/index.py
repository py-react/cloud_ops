from app.docker_client import clientContext
import docker

async def GET():
    try:
        # Initialize Docker client
        client = clientContext.get_client()
        # Fetch the unlock key for this swarm manager
        unlock_key = client.swarm.get_unlock_key()
        return {"UnlockKey": unlock_key["UnlockKey"]}
    except (ValueError, docker.errors.APIError, Exception) as e:
        return {"error":True,"message": f"Error fetching unlock key: {str(e)}"}