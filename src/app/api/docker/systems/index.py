import docker
from fastapi import Request
from pydantic import BaseModel
from app.docker_client import clientContext

client = clientContext.client

class SystemInfo(BaseModel):
    action:str

async def meta_data():
    return {
        "title": "Docker",
    }

def bytes_to_human_readable(byte_value):
    """Convert byte value to human-readable format (KB, MB, GB, etc.)."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if byte_value < 1024:
            return f"{byte_value:.2f} {unit}"
        byte_value /= 1024
    return f"{byte_value:.2f} PB"

# --- Helper Functions ---

def get_docker_info():
    """Fetches the full docker info."""
    return client.info()

def extract_general_info(info):
    return {
        "ID": info.get("ID"),
        "Name": info.get("Name"),
        "OSType": info.get("OSType"),
        "KernelVersion": info.get("KernelVersion"),
        "Architecture": info.get("Architecture"),
        "ServerVersion": info.get("ServerVersion"),
    }

def extract_resources_info(info):
    return {
        "NCPU": info.get("NCPU"),
        "MemTotal": info.get("MemTotal"),
        "Driver": info.get("Driver"),
        "MemoryLimit": info.get("MemoryLimit"),
        "SwapLimit": info.get("SwapLimit"),
    }

def extract_containers_info(info):
    return {
        "Containers": info.get("Containers"),
        "ContainersRunning": info.get("ContainersRunning"),
        "ContainersPaused": info.get("ContainersPaused"),
        "ContainersStopped": info.get("ContainersStopped"),
    }

def extract_images_info(info):
    return {
        "Images": info.get("Images"),
        "DockerRootDir": info.get("DockerRootDir"),
    }

def extract_network_config(info):
    return {
        "HttpProxy": info.get("HttpProxy"),
        "HttpsProxy": info.get("HttpsProxy"),
        "NoProxy": info.get("NoProxy"),
    }

def extract_security_info(info):
    return {
        "SecurityOptions": info.get("SecurityOptions"),
    }

def extract_drivers_info(info):
    return {
        "DriverStatus": info.get("DriverStatus"),
    }

def extract_plugins_info(info):
    return {
        "Plugins": info.get("Plugins"),
    }

def calculate_network_io():
    """Calculates total network I/O from all containers (Heavy)."""
    total_bytes_sent = 0
    total_bytes_recv = 0
    
    for container in client.containers.list():
        try:
            stats = container.stats(stream=False)
            network_stats = stats.get('networks', {})
            for network in network_stats.values():
                total_bytes_sent += network.get('tx_bytes', 0)
                total_bytes_recv += network.get('rx_bytes', 0)
        except Exception:
            continue
            
    return {
        "total_bytes_sent": total_bytes_sent,
        "total_bytes_recv": total_bytes_recv
    }

def calculate_memory_usage():
    """Calculates total memory usage from all containers (Heavy)."""
    total_memory_usage = 0
    total_memory_allocated = 0
    
    # We can get total system memory from info() to provide context if needed,
    # but for now we just sum container usage.
    # To get MemTotal for the % calculation, the frontend might need 'resources' info too.
    
    for container in client.containers.list():
        try:
            stats = container.stats(stream=False)
            mem_stats = stats.get('memory_stats', {})
            total_memory_usage += mem_stats.get('usage', 0)
            total_memory_allocated += mem_stats.get('limit', 0)
        except Exception:
            continue
            
    return {
        "total_memory_usage": total_memory_usage,
        "total_memory_allocated": total_memory_allocated,
    }

# --- Main Handler ---

async def POST(request:Request, body: SystemInfo):
    actionType = body.action
    try:
        # Fast Info Actions (Single docker.info() call split up)
        if actionType in ["general", "resources", "containers", "images", "network_config", "security", "drivers", "plugins"]:
            info = get_docker_info()
            
            if actionType == "general":
                return {"error": False, "data": extract_general_info(info)}
            elif actionType == "resources":
                return {"error": False, "data": extract_resources_info(info)}
            elif actionType == "containers":
                return {"error": False, "data": extract_containers_info(info)}
            elif actionType == "images":
                return {"error": False, "data": extract_images_info(info)}
            elif actionType == "network_config":
                return {"error": False, "data": extract_network_config(info)}
            elif actionType == "security":
                return {"error": False, "data": extract_security_info(info)}
            elif actionType == "drivers":
                return {"error": False, "data": extract_drivers_info(info)}
            elif actionType == "plugins":
                return {"error": False, "data": extract_plugins_info(info)}

        # Heavy Stat Actions
        elif actionType == "network_io":
            return {"error": False, "data": calculate_network_io()}
        elif actionType == "memory_usage":
            # We might want to include the system MemTotal here for the chart
            mem_data = calculate_memory_usage()
            # Optional: Fetch info() just for MemTotal if strictly needed in this payload,
            # but usually frontend can combine data from 'resources'.
            # Let's verify if `get_basic_info` previously returned `total_memory_allocated_docker` (MemTotal).
            # Yes it did. Let's add it for convenience/completeness.
            info = client.info()
            mem_data["total_memory_allocated_docker"] = info.get("MemTotal", 0)
            return {"error": False, "data": mem_data}
            
        else:
            return {"error": True, "message": f"Invalid action: {actionType}"}
        
    except Exception as e:
        return {"error": True, "message": str(e)}

# --- Initial Load (Optional, can just be empty or return basic set) ---
# Kept for backward compatibility if needed, but frontend should switch to granular.
async def index(request:Request):
    return {"error": False, "message": "Use POST with specific actions for data."}
