import docker
from typing import List, Dict, Optional
from pydantic import BaseModel


# --- Pydantic Models ---
class SwarmInitParams(BaseModel):
    advertise_addr: Optional[str] = "eth0"  # Default to eth0 interface
    listen_addr: Optional[str] = "0.0.0.0:2377"  # Default listen address
    force_new_cluster: Optional[bool] = False  # Default to not forcing a new cluster
    default_addr_pool: Optional[list[str]] = ["10.0.0.0/8"]  # Default subnet pool
    subnet_size: Optional[int] = 24  # Default subnet size for pools
    data_path_addr: Optional[str] = "192.168.1.1"  # Default data path address
    data_path_port: Optional[int] = None  # Default None for data path port
    task_history_retention_limit: Optional[int] = 100  # Default history retention
    snapshot_interval: Optional[int] = 5000  # Default snapshot interval
    keep_old_snapshots: Optional[int] = 3  # Default number of snapshots to keep
    log_entries_for_slow_followers: Optional[int] = 1200  # Default slow follower logs
    heartbeat_tick: Optional[int] = 1  # Default heartbeat tick
    election_tick: Optional[int] = 3  # Default election tick
    dispatcher_heartbeat_period: Optional[int] = 5  # Default heartbeat period for dispatcher
    node_cert_expiry: Optional[int] = 0  # Default to no expiry
    external_ca: Optional[Dict] = None  # No external CA by default
    name: Optional[str] = "default-swarm"  # Default name for the swarm
    labels: Optional[Dict[str, str]] = {}  # Default empty labels
    signing_ca_cert: Optional[str] = None  # Default to no signing cert
    signing_ca_key: Optional[str] = None  # Default to no signing key
    ca_force_rotate: Optional[int] = 0  # Default not to rotate CA
    autolock_managers: Optional[bool] = False  # Default not to autolock managers
    log_driver: Optional[str] = "json-file"  # Default log driver for tasks

async def POST(params: SwarmInitParams):
    # Initialize Docker client
    try:
        client = docker.from_env()
        # Initialize swarm with given parameters
        swarm = client.swarm.init(
            advertise_addr=params.advertise_addr,
            listen_addr=params.listen_addr,
            force_new_cluster=params.force_new_cluster,
            default_addr_pool=params.default_addr_pool,
            subnet_size=params.subnet_size,
            data_path_addr=params.data_path_addr,
            data_path_port=params.data_path_port,
            task_history_retention_limit=params.task_history_retention_limit,
            snapshot_interval=params.snapshot_interval,
            keep_old_snapshots=params.keep_old_snapshots,
            log_entries_for_slow_followers=params.log_entries_for_slow_followers,
            heartbeat_tick=params.heartbeat_tick,
            election_tick=params.election_tick,
            dispatcher_heartbeat_period=params.dispatcher_heartbeat_period,
            node_cert_expiry=params.node_cert_expiry,
            external_ca=params.external_ca,
            name=params.name,
            labels=params.labels,
            signing_ca_cert=params.signing_ca_cert,
            signing_ca_key=params.signing_ca_key,
            ca_force_rotate=params.ca_force_rotate,
            autolock_managers=params.autolock_managers,
            log_driver=params.log_driver
        )
        return {"status": "Swarm initialized successfully", "swarm": swarm.attrs}
    except docker.errors.APIError as e:
        return {"error":True,"message": f"Error initializing swarm: {e}"}