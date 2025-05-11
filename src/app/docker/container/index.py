import docker
from fastapi import Request

from app.docker_client import clientContext

client = clientContext.client
async def meta_data():
    return {
        "title": "Docker (Containers)",
    }

async def layout(request:Request):
    return {
        "some":"data"
    }


async def index(request:Request):
    # containers = client.containers.list(all=True)  # Get all containers (running or stopped)
    
    # container_info = []
    
    # for container in containers:
    # # if container.name.startswith("deno_"):  # Filter only containers started by the POST method
    #     try:
    #         # Fetch container details
    #         host_Config = container.attrs['HostConfig']
    #         container_details = {
    #             "name": container.name,
    #             "id": container.id,
    #             "status": container.status,
    #             "created": container.attrs['Created'],
    #             "image": container.attrs['Config']['Image'],
    #             "ports": container.attrs['NetworkSettings']['Ports'],
    #             "command": container.attrs['Config']['Cmd'],
    #             # "logs": container.logs(stdout=True, stderr=True, tail=10).decode('utf-8'),
    #             "state": container.attrs['State'],
    #             "exit_code": container.attrs['State'].get('ExitCode', None),
    #             "network": container.attrs['NetworkSettings']['Networks'],
    #             "volumes": container.attrs['Mounts'],
    #             "labels": container.attrs['Config'].get('Labels', {}),
    #             "env_vars": container.attrs['Config'].get('Env', []),
    #             "stats":container.stats(stream=False),
    #             "host_config":host_Config
    #         }
            
    #         container_info.append(container_details)
    #     except Exception as e:
    #         print(f"Error retrieving info for container {container.name}: {e}")
    
    return {}