import os
import time
import json
import docker
from fastapi import Request
from bullmq import Queue

from pydantic import BaseModel
from typing import Dict
from app.docker_client import clientContext

client = clientContext.client

class RunQueue(BaseModel):
    queueName: str
    prefix: str
    processFileName: str
    queueProps:Dict=None


class StopQueue(BaseModel):
    containerName: str

# Store container names globally to track containers started by POST
container_names = []

def run_containers(queueName="dynamicWorkQueue1",prefix="bull",processFileName="test.ts",queueProps=None):
    """Run Deno containers."""
    try:
        # Start the Deno container
        print("Starting Deno container...")
        # Start the Deno container with a unique name
        unique_container_name = f"deno_{queueName}_{prefix}_{processFileName}_{int(time.time())}"
        
        client.containers.run(
            "denoland/deno",
            name=unique_container_name,
            volumes={
                "/Users/ai/Documents/node_hooks/explore/bull/worker.ts":{"bind": "/worker/worker.ts", "mode": "ro"},
                "/Users/ai/Documents/node_hooks/explore/bull/utils":{"bind": "/worker/utils", "mode": "ro"},
                f"/Users/ai/Documents/node_hooks/explore/bull/Queues/processList/{processFileName}":{"bind": f"/worker/Queues/processList/{processFileName}", "mode": "ro"},
                "/Users/ai/Documents/node_hooks/explore/bull/Queues/index.ts":{"bind": "/worker/Queues/index.ts", "mode": "ro"},
                "/Users/ai/Documents/node_hooks/explore/bull/Queues/queueContext.ts":{"bind": "/worker/Queues/queueContext.ts", "mode": "ro"},
                "/Users/ai/Documents/node_hooks/explore/bull/Queues/type.ts":{"bind": "/worker/Queues/type.ts", "mode": "ro"},
            },
            network_mode="host",
            command=f"deno run --allow-all --unstable-worker-options  /worker/worker.ts --queueName={queueName} --prefix={prefix} --processFileName={processFileName}",
            detach=True,
            cpu_shares=1024,
            mem_limit="512m",
            mem_reservation="256m",
            memswap_limit="768m",
            labels={
                "queueProps":json.dumps(queueProps),
            }
        )
        # Track the container name
        container_names.append(unique_container_name)
        # Wait for containers to be running (you can adjust the wait time as needed)
        print("Containers are now running.")
        return unique_container_name
    except Exception as e:
        print(f"Error while starting containers: {e}")
        return False


def create_queue_connection(queue_name, all_queue_configs):
    queue_config = next((config for config in all_queue_configs if config['name'] == queue_name), None)
    if not queue_config:
        raise ValueError(f"No configuration found for queue: {queue_name}")
    
    array_name = queue_name.split(":")
    queue = Queue(":".join(array_name[1:]), {
        'prefix': array_name[0],
        'connection': {
            "host": "localhost",
            "port": 6379,
            "db": 0,
            "password": None,
            "username": None,
        }
    })
    return queue

async def GET(request:Request):
    containers = client.containers.list(all=True)  # Get all containers (running or stopped)
    
    container_info = []
    
    for container in containers:
        if container.name.startswith("deno_"):  # Filter only containers started by the POST method
            try:
                print(container.labels)
                # Fetch container details
                name_list = container.name.split("deno_")[1].split("_")
                name = name_list[0]
                prefix = name_list[1]
                processor = name_list[2]
                container_details = {
                    "name": container.name,
                    "prefix":prefix,
                    "queueName":name,
                    "processor": f"{processor}",
                    "id": container.id,
                    "status": container.status,
                    "created": container.attrs['Created'],
                    "logs": container.logs(stdout=True, stderr=True, tail=10).decode('utf-8'),
                    "finishedAt":container.attrs['State']["FinishedAt"],
                    "queueProps":json.loads(container.labels["queueProps"])
                }
                
                container_info.append(container_details)
            except Exception as e:
                print(f"Error retrieving info for container {container.name}: {e}")
    
    return {"containers": container_info}

async def POST(request:Request,body: RunQueue):
    queueName = body.queueName
    prefix = body.prefix
    processFileName = body.processFileName
    queueProps = body.queueProps
    isRunning = run_containers(queueName,prefix,processFileName,queueProps)
    if isRunning:
        return {"message":"done","container_name":isRunning}
    return {"message":"failed"}

async def PUT(request:Request):
    
    return {"message":"done"}

async def DELETE(request:Request,body:StopQueue):

    # Get all containers that are running and match the stored names
    containers_to_remove = []
    container_name = body.containerName

    try:
        container = client.containers.get(container_name)
        if container.status == 'running':
            # Stop and remove the container
            container.stop()
            container.remove()
            containers_to_remove.append(container_name)
            print(f"Container {container_name} stopped and removed.")
    except docker.errors.NotFound:
        print(f"Container {container_name} not found or already removed.")
    
    # Remove the names from the tracking list
    container_names[:] = [name for name in container_names if name not in containers_to_remove]
    
    return {"message": "done", "removed_containers": containers_to_remove}