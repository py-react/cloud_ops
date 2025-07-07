import docker
from fastapi import Request
from datetime import datetime
from app.docker_client import clientContext

async def meta_data():
    return {
        "title": "Docker (Storages)",
    }


# Function to list all volumes
async def list_volumes():
    client = clientContext.client
    volumes = client.volumes.list()  # Get all volumes
    volume_info = []

    for volume in volumes:
        volume_details = {
            'name': volume.attrs.get("Name","N/A"),
            "driver":volume.attrs.get("Driver","N/A"),
            "labels":volume.attrs.get("Labels",{}),
            "options":volume.attrs.get("Options","N/A"),
            "mountPoint":volume.attrs.get("Mountpoint","N/A"),
            'created': volume.attrs.get('CreatedAt', 'N/A'),
            'scope': volume.attrs.get('Scope', 'N/A'),
            'inUse': False
        }

        # Check if the volume is in use
        for container in client.containers.list(all=True):
            for mount in container.attrs.get('Mounts', []):
                if mount.get('Type') == 'volume' and mount.get('Name') == volume.name:
                    volume_details['inUse'] = True
                    break

        volume_info.append(volume_details)
    
    return volume_info



async def index(request:Request):
    try:
        volumes = await list_volumes()
        return {"error": False,"storageInfo": sorted(volumes, key=lambda x: datetime.fromisoformat(x['created'].replace('Z', '+00:00')),reverse=True)}
    except Exception as e:
        # Return a custom error if listing volumes fails
        return {"error": True, "message": e.__dict__["explanation"]}