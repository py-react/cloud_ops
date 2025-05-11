import docker
from typing import Optional
from pydantic import BaseModel


class SwarmUpdateSpec(BaseModel):
    rotate_worker_token: Optional[bool] = False
    rotate_manager_token: Optional[bool] = False
    rotate_manager_unlock_key: Optional[bool] = False
    force_new_cluster: Optional[bool] = False
    advertise_addr: Optional[str] = None
    listen_addr: Optional[str] = '0.0.0.0:2377'
    default_addr_pool: Optional[list] = None
    subnet_size: Optional[int] = None
    task_history_retention_limit: Optional[int] = 0
    snapshot_interval: Optional[int] = 5000
    keep_old_snapshots: Optional[int] = None
    heartbeat_tick: Optional[int] = 1
    election_tick: Optional[int] = 3
    autolock_managers: Optional[bool] = False
    log_driver: Optional[str] = None


async def PUT(params: SwarmUpdateSpec):
    try:
        # Initialize Docker client
        client = docker.from_env()
        # Update swarm configuration with the provided parameters
        success = client.swarm.update(**params.model_dump(exclude_unset=True))
        return {"status": "Swarm updated successfully", "result": success}
    except docker.errors.APIError as e:
        return {"error":True,"message": f"Error updating swarm: {e}"}