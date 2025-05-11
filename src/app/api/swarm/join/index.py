import docker
from typing import List, Optional
from pydantic import BaseModel

class SwarmJoinParams(BaseModel):
    remote_addrs: List[str]  # List of manager node addresses (required)
    join_token: str  # Token required to join the swarm (required)
    listen_addr: str = "0.0.0.0:2377"  # Default listen address
    advertise_addr: Optional[str] = None  # Default is None, will auto-detect
    data_path_addr: str = "eth0"  # Default data path address


async def POST(params: SwarmJoinParams):
    try:
        client = docker.from_env()
        # Join the swarm with given parameters
        success = client.swarm.join(
            remote_addrs=params.remote_addrs,
            join_token=params.join_token,
            listen_addr=params.listen_addr,
            advertise_addr=params.advertise_addr,
            data_path_addr=params.data_path_addr
        )
        return {"status": "Node joined swarm successfully", "result": success}
    except docker.errors.APIError as e:
        return {"error":True,"message": f"Error joining swarm: {e}"}