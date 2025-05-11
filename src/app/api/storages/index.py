import docker
from fastapi import Request
from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from app.docker_client import clientContext

client = clientContext.client

class VolumeActionEnum(str, Enum):
    PRUNE = 'prune'
    REMOVE = 'remove'
    ADD = 'add'

class AddVolumeData(BaseModel):
    name : str
    driver : str
    driverOpts : dict
    labels : dict 

class VolumeActionRequest(BaseModel):
    action: VolumeActionEnum
    volume_id: str = None
    add_data:AddVolumeData = None


async def create_volume(data):
    name = data.name
    driver = data.driver
    driver_opts = data.driverOpts
    labels = data.labels
    new_volume = client.volumes.create(
        name=name,
        driver=driver,
        driver_opts=driver_opts,
        labels=labels,
    )
    volume_details = {
        'name': new_volume.attrs.get("Name","N/A"),
        "driver":new_volume.attrs.get("Driver","N/A"),
        "labels":new_volume.attrs.get("Labels",{}),
        "options":new_volume.attrs.get("Options","N/A"),
        "mountPoint":new_volume.attrs.get("Mountpoint","N/A"),
        'created': new_volume.attrs.get('CreatedAt', 'N/A'),
        'scope': new_volume.attrs.get('Scope', 'N/A'),
        'inUse': False
    }
    return volume_details


# Function to list all volumes
async def list_volumes():

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

# Function to prune unused volumes
async def prune_volumes():
    unused_volumes = []

    # First, list all volumes
    volumes = client.volumes.list()

    for volume in volumes:
        in_use = False
        for container in client.containers.list(all=True):
            for mount in container.attrs.get('Mounts', []):
                if mount.get('Type') == 'volume' and mount.get('Name') == volume.name:
                    in_use = True
                    break
        
        if not in_use:
            unused_volumes.append(volume.name)

    # Remove unused volumes
    if unused_volumes:
        client.volumes.prune()  # This removes all unused volumes
        return {"message": "Unused volumes pruned successfully.", "volumes": unused_volumes}
    else:
        return {"message": "No unused volumes found to prune."}

# Function to remove a volume by ID
async def remove_volume(volume_id: str):
    
    try:
        # Check if the volume exists
        volume = client.volumes.get(volume_id)
        in_use = False

        # Check if any container is using the volume
        for container in client.containers.list(all=True):
            for mount in container.attrs.get('Mounts', []):
                if mount.get('Type') == 'volume' and mount.get('Name') == volume.name:
                    in_use = True
                    break

        if in_use:
            ex = Exception(f"Volume {volume_id} in use.")
            ex.__dict__["explanation"] = f"Volume {volume_id} is in use by one or more containers and cannot be removed."
            raise ex
        
        # Remove the volume if it's not in use
        volume.remove()
        return {"message": f"Volume {volume_id} removed successfully."}
    
    except docker.errors.NotFound:
        # Raise custom error if the volume doesn't exist
        ex = Exception(f"Volume {volume_id} not found.")
        ex.__dict__["explanation"] = f"Volume {volume_id} does not exist. Please check the volume ID."
        raise ex

async def GET(request:Request):
    try:
        volumes = await list_volumes()
        return {"storages": sorted(volumes, key=lambda x: datetime.fromisoformat(x['created'].replace('Z', '+00:00')),reverse=True)}
    except Exception as e:
        # Return a custom error if listing volumes fails
        return {"error": True, "message": e.__dict__["explanation"]}

async def POST(request: VolumeActionRequest):
    action = request.action

    try:
        if action == VolumeActionEnum.PRUNE:
            await prune_volumes()
            return {"error":False,"message":f"Removed All"}
        
        elif action == VolumeActionEnum.REMOVE and request.volume_id:
            await remove_volume(request.volume_id)
            return {"error":False,"message":f"Removed {request.volume_id}"}
        elif action == VolumeActionEnum.ADD:
            new_volume = await create_volume(request.add_data)
            return {"error":False,"message":f"Volume Create {new_volume['name']}","volume":new_volume}
        else:
            raise Exception("Invalid action. Use 'prune' or 'remove'.")
    
    except Exception as e:
        # Handle the custom exception
        return {"error": True, "message": e.__dict__["explanation"]}

