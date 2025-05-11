from fastapi import Request
from bullmq import Queue
import asyncio
from app.docker_client import clientContext

client = clientContext.client


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

async def get_job_counts_by_status(queue:Queue):
    counts = await queue.getJobCounts()
    return counts

async def get_queue_jobs_by_status(queue:Queue, *statuses):
    fetched_jobs = {}
    for status in statuses:
        jobs = []
        if status == 'all':
            jobs = await queue.getJobs([
            'active',
            'completed',
            'delayed',
            'failed',
            'paused',
            'waiting',
            'waiting-children'
        ])
            fetched_jobs['all'] = jobs
        elif status == 'completed':
            jobs = await queue.getCompleted()
            fetched_jobs['completed'] = jobs
        elif status == 'failed':
            jobs = await queue.getFailed()
            fetched_jobs['failed'] = jobs
        elif status == 'active':
            jobs = await queue.getActive()
            fetched_jobs['active'] = jobs
        elif status == 'delayed':
            jobs = await queue.getDelayed()
            fetched_jobs['delayed'] = jobs
        elif status == 'waiting':
            jobs = await queue.getWaiting()
            fetched_jobs['waiting'] = jobs
    return fetched_jobs

async def get_jobs_details(jobs, queueName:str,state='all'):
    async def get_job_details(job):
        job_state = await job.getState() if state == 'all' else state
        return {
            "queueName":queueName,
            'parent':job.parent,
            'job_id': job.id,
            'progress': job.progress,
            'timestamps': {
                'added': job.timestamp,
                'processed': job.processedOn  if job.processedOn else None,
                'finished': job.finishedOn if job.finishedOn else None
            },
            'attempts': job.attemptsMade + 1,
            'data': job.data,
            'job_state': job_state,
            'return_value': job.returnvalue,
            'failed_reason': job.failedReason,
            'stacktrace': job.stacktrace
        }

    jobs_details = await asyncio.gather(*(get_job_details(job) for job in jobs))
    return jobs_details


async def get_sorted_jobs(queue:Queue,queueName:str):
    """
    Fetches all jobs in the queue and returns a list of jobs sorted in ascending order of their creation timestamps.

    Args:
        queue (Queue): An instance of the queue.

    Returns:
        List[Dict]: A list of job details sorted by creation time.
    """
    # Fetch all jobs from the queue
    all_jobs = await get_queue_jobs_by_status(queue,"all")
    # Fetch detailed job information
    jobs_details = await get_jobs_details(all_jobs["all"],queueName)
    # Sort the jobs by their 'timestamps.added' value (job creation time)
    sorted_jobs = sorted(jobs_details, key=lambda job: job['timestamps']['added'])
    
    return sorted_jobs

async def meta_data():
    return {
        "title": "Queue UI",
    }


async def index(request:Request):

    all_queues_item = await get_queues()
    total_queues_connected = len(all_queues_item["containers"])
    total_active_jobs = 0
    total_completed_jobs = 0
    total_failed_jobs = 0
    total_waiting_jobs = 0
    total_delayed_jobs = 0
    all_queues=[]
    errorMessage = ""
    try:
        async def process_queue(queue_config):
            queue = create_queue_connection(queue_config['name'], all_queues_item["containers"])
            queue_overview = await get_job_counts_by_status(queue)
            nonlocal total_active_jobs, total_completed_jobs, total_failed_jobs, total_waiting_jobs, total_delayed_jobs
            total_active_jobs += queue_overview['active']
            total_completed_jobs += queue_overview['completed']
            total_failed_jobs += queue_overview['failed']
            total_waiting_jobs += queue_overview['waiting']
            total_delayed_jobs += queue_overview['delayed']
            try:
                jobs = await get_sorted_jobs(queue,queue_config['name'])
            except Exception as e:
                jobs = []
            await queue.close()
            return {'name': queue_config['name'], 'queueOverview': queue_overview,'jobs':jobs}
        
        all_queues = await asyncio.gather(*([process_queue(queue_config) for queue_config in all_queues_item["containers"]]))
    except Exception as e:
        pass

    # all_queues = await asyncio.gather(*(process_queue(queue_config) for queue_config in monitoroQueues))
    print(all_queues)

    return {
        'totalQueuesConnected': total_queues_connected,
        'totalActiveJobs': total_active_jobs,
        'totalCompletedJobs': total_completed_jobs,
        'totalFailedJobs': total_failed_jobs,
        'totalWaitingJobs': total_waiting_jobs,
        'totalDelayedJobs': total_delayed_jobs,
        'allQueues': all_queues
    }