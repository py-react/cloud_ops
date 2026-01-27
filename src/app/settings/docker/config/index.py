from app.docker_client import clientContext
from fastapi import Request

async def index(request: Request):
    client = clientContext.client
    try:
        info = client.info()
        reduced_info = {
            "ServerVersion": info.get("ServerVersion", "N/A"),
            "DockerRootDir": info.get("DockerRootDir", "N/A"),
            "Architecture": info.get("Architecture", "N/A")
        }
    except:
        reduced_info = {
            "ServerVersion": "Disconnected",
            "DockerRootDir": "N/A",
            "Architecture": "N/A"
        }
    return {"engineInfo": reduced_info}
