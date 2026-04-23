import docker

async def GET():
    try:
        # Initialize Docker client
        client = docker.from_env()
        # Fetch the unlock key for this swarm manager
        unlock_key = client.swarm.get_unlock_key()
        return {"UnlockKey": unlock_key["UnlockKey"]}
    except docker.errors.APIError as e:
        return {"error":True,"message": f"Error fetching unlock key: {e}"}