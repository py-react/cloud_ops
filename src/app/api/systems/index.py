import docker
from fastapi import Request
from pydantic import BaseModel
from app.docker_client import clientContext

client = clientContext.client

class SystemInfo(BaseModel):
    action:str


def bytes_to_human_readable(byte_value):
    return byte_value
    """Convert byte value to human-readable format (KB, MB, GB, etc.)."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if byte_value < 1024:
            return f"{byte_value:.2f} {unit}"
        byte_value /= 1024

def get_system_stats():
    # Initialize the Docker client
    # Get system-wide information using docker.info()
    system_info = client.info()
    total_bytes_sent = 0
    total_bytes_recv = 0
    total_memory_usage = 0
    total_memory_allocated = 0
    total_memory_allocated_docker = system_info["MemTotal"]

    # Loop through each container and sum the network and memory stats
    for container in client.containers.list():
        stats = container.stats(stream=False)
        
        # Get network statistics for the container
        print(stats)
        network_stats = stats['networks']
        for network in network_stats.values():
            total_bytes_sent += network.get('tx_bytes', 0)
            total_bytes_recv += network.get('rx_bytes', 0)
        
        # Get memory statistics for the container
        memory_usage = stats['memory_stats']['usage']
        memory_limit = stats['memory_stats']['limit']
        
        total_memory_usage += memory_usage
        total_memory_allocated += memory_limit

    system_info["system_stats"] = {
        "network":{
            "total_bytes_sent": bytes_to_human_readable(total_bytes_sent),
            "total_bytes_recv": bytes_to_human_readable(total_bytes_recv),
        },
        "memory":{
            "total_memory_usage": bytes_to_human_readable(total_memory_usage),
            "total_memory_allocated": bytes_to_human_readable(total_memory_allocated),
            "total_memory_allocated_docker": bytes_to_human_readable(total_memory_allocated_docker)
        }
    }
    return system_info



async def POST(request:Request,body: SystemInfo):
    actionType = body.action
    try:
        if actionType == "info":
            return {"error":False, "info": get_system_stats()}
        else:
            print({"error":True,"message":f"Invalid action: {actionType}. Allowed actions are 'run' and 'remove'."})
        
    except Exception as e:
        return {"error": True, "message": e.__dict__["explanation"]}

    return {"error":True, "message": "Action not found"}
