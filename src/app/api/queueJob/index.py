from fastapi import Request
from bullmq import Queue
import json
from pydantic import BaseModel
from typing import  Dict,Optional
from app.docker_client import clientContext
import time

client = clientContext.client

class CreateQueueJobMeta(BaseModel):
    id:Optional[str]=None
    name:str=""
    delay:int=0
    attempts:int=0
    repeat:Dict=None

class CreateQueueJob(BaseModel):
    queueName:str
    meta: CreateQueueJobMeta
    data: Dict

async def get_queues():
    containers = client.containers.list(all=True)  # Get all containers (running or stopped)
    container_info = []
    for container in containers:
        if container.name.startswith("deno_"):  # Filter only containers started by the POST method
            try:
                # Fetch container details
                name_list = container.name.split("deno_")[1].split("_")
                name = name_list[0]
                prefix = name_list[1]
                container_details = {
                    "name": f"{prefix}:{name}", 
                    "hostId": "redis",
                    "url": "redis://localhost:6379" 
                }
                
                container_info.append(container_details)
            except Exception as e:
                print(f"Error retrieving info for container {container.name}: {e}")
    return {"containers": container_info}


def create_queue_connection(queue_name, all_queue_configs):
    queue_config = next((config for config in all_queue_configs if config['name'] == queue_name), None)
    if not queue_config:
        raise ValueError(f"No configuration found for queue: {queue_name}")
    
    array_name = queue_name.split(":")
    # print(isinstance(r, redis.Redis))
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
    return {"user":"1"}

async def POST(request:Request,body:CreateQueueJob):
    print(body)
    queueName = body.queueName
    data = body.data
    meta = body.meta
    all_queue_configs = await get_queues()
    queue = create_queue_connection(queueName,all_queue_configs["containers"])
    job_data = {
        "obj":{
            "meta": {"id":meta.id or "1","name":meta.name},
            "data": data
        }
    }

    if meta.repeat:
        job_data["repeat"] = meta.repeat,
        print(job_data,"findMe")
        job = await queue.add("add_repeat_job",job_data,{
            "delay":meta.delay,
            "attempts":meta.attempts,
            # "removeOnComplete":True

        })
    else:
        job = await queue.add("__default__",job_data,{
            "delay":meta.delay,
            "attempts":meta.attempts,
        })

    to_return = {
        "id":job.id,"state":await job.getState() ,"data":job.data
    }
    await queue.close()
    return to_return

async def PUT(request:Request):
    jobId = json.loads(await request.body())["id"]
    queueName = json.loads(await request.body())["queueName"]
    all_queue_configs = await get_queues()

    queue = create_queue_connection(queueName, all_queue_configs["containers"])
    jobs = await queue.getJobs(["failed"])
    for job in jobs:
        if(job.id == jobId):
            await job.retry()
            break
    return {"message":"done"}

async def DELETE(request:Request):
    jobId = json.loads(await request.body())["id"]
    queueName = json.loads(await request.body())["queueName"]
    all_queue_configs = await get_queues()

    queue = create_queue_connection(queueName, all_queue_configs["containers"])
    await queue.remove(jobId)
    return {"message":"done"}