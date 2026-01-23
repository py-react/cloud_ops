from fastapi import Request, APIRouter
from pydantic import BaseModel
from typing import Optional,Literal,List, Dict,Any
from enum import Enum
from fastapi.responses import JSONResponse
from app.docker_client import clientContext

client = clientContext.client

class HostConfig(BaseModel):
    CpuShares: Optional[int]
    Memory: Optional[int]
    MemoryReservation: Optional[int]
    MemorySwap: Optional[int]
    PortBindings: Optional[Dict[str, Any]]

class ContainerInfo(BaseModel):
    name: str
    id: str
    status: str
    created: str
    image: str
    ports: Optional[Dict[str, Any]]
    command: Optional[List[str]]
    state: Dict[str, Any]
    exit_code: Optional[int]
    network: Dict[str, Any]
    volumes: List[Dict[str, Any]]
    labels: Dict[str, Any]
    env_vars: List[str]
    host_config: HostConfig

class GetContainerResponse(BaseModel):
   containers:List[ContainerInfo]
   length:int

class ActionTypeEnum(str, Enum):
    RUN = 'run'
    RERUN = 'rerun'
    STOP = 'stop'
    PAUSE = 'pause'
    REMOVE = 'remove'
    LOGS = 'logs'
    FILES = 'files'
    COMMAND = 'command'
    UPDATE = 'update'

class DockerRequest(BaseModel):
    command: str = ''
    directory: str = '/'

class HealthCheck(BaseModel):
    test: List[str] = []  # Default to empty list if not provided
    interval: int = 30000000000  # Default interval (30 seconds)
    timeout: int = 3000000000  # Default timeout (3 seconds)
    retries: int = 3  # Default retries (3)
    startPeriod: int = 1000000000  # Default start period (1 second)

class DockerConfig(BaseModel):
    image: str
    detach: bool = True  # Default to True (run container in background)
    remove: bool = False  # Default to False (do not remove on exit)
    privileged: bool = True  # Default to True (run with extended privileges)
    init: bool = False  # Default to False (do not run init inside the container)
    tty: bool = False  # Default to False (no pseudo-TTY)
    stdinOpen: bool = False  # Default to False (do not keep STDIN open)
    readOnly: bool = False  # Default to False (container filesystem is not read-only)
    ports:Dict = {}  # Default to an empty dictionary
    volumes: List[Dict] = []  # Default to an empty list
    healthcheck: Optional[HealthCheck] = None  # Healthcheck is optional and defaults to None
    command: str = ""  # Default to an empty string (no command)
    name: str
    auto_remove: bool = False  # Default to True (automatically remove the container when it exits)
    cpuShares: str = ""
    memory: str = ""
    memoryReservation: str = ""
    memorySwap: str = ""

class UpdateDockerConfig(BaseModel):
    cpuShares: str = ""
    memory: str = ""
    memoryReservation: str = ""
    memorySwap: str = ""

class RunContainer(BaseModel):
    action: Literal[ActionTypeEnum.RUN,ActionTypeEnum.UPDATE, ActionTypeEnum.RERUN, ActionTypeEnum.PAUSE,ActionTypeEnum.REMOVE,ActionTypeEnum.STOP,ActionTypeEnum.LOGS,ActionTypeEnum.FILES,ActionTypeEnum.COMMAND]
    containerId: Optional[str] = None
    image:Optional[str] = None
    dir:Optional[DockerRequest] = None
    instanceConfig: Optional[DockerConfig] = None
    updateInstanceConfig: Optional[UpdateDockerConfig] = None

async def GET(request:Request)->GetContainerResponse:
    print("Getting containers")
    containers = client.containers.list(all=True)  # Get all containers (running or stopped)
    
    container_info = []
    
    for container in containers:
        try:
            # Fetch container details
            host_Config = container.attrs['HostConfig']
            container_details = {
                "name": container.name,
                "id": container.id,
                "status": container.status,
                "created": container.attrs['Created'],
                "image": container.attrs['Config']['Image'],
                "ports": container.attrs['NetworkSettings']['Ports'],
                "command": container.attrs['Config']['Cmd'],
                "state": container.attrs['State'],
                "exit_code": container.attrs['State'].get('ExitCode', None),
                "network": container.attrs['NetworkSettings']['Networks'],
                "volumes": container.attrs['Mounts'],
                "labels": container.attrs['Config'].get('Labels', {}),
                "env_vars": container.attrs['Config'].get('Env', []),
                "host_config": {
                    "CpuShares": host_Config["CpuShares"],
                    "Memory": host_Config["Memory"],
                    "MemoryReservation": host_Config["MemoryReservation"],
                    "MemorySwap": host_Config["MemorySwap"],
                    "PortBindings": host_Config["PortBindings"] if host_Config["PortBindings"] else container.attrs['NetworkSettings']['Ports']
                }
            }
            
            container_info.append(container_details)
        except Exception as e:
            print(f"Error retrieving info for container {container.name}: {e}")
    
    return {"containers": container_info, "length": len(container_info)}

async def POST(request:Request,body: RunContainer):
    actionType = body.action
    # Get all containers that are running and match the stored names

    try:
        if actionType == ActionTypeEnum.RUN:
            config = body.instanceConfig

            # Prepare healthcheck details with defaults
            healthcheck = {
                "test": config.healthcheck.test if config.healthcheck else [],
                "interval": config.healthcheck.interval if config.healthcheck else 30000000000,
                "timeout": config.healthcheck.timeout if config.healthcheck else 3000000000,
                "retries": config.healthcheck.retries if config.healthcheck else 3,
                "startPeriod": config.healthcheck.startPeriod if config.healthcheck else 1000000000,
            } if config.healthcheck else None

            # Handle ports mapping (expose ports inside container to the host)
            mapped_ports = {}
            for obj_id, host_port_config in config.ports.items():
                mapped_ports[str(host_port_config["containerPort"])] = host_port_config["hostPort"]  # Explicitly map container port to host port

            # Use a lambda function to transform the list into the required dictionary format
            volume_dict = dict(map(lambda item: (item["source"], {"bind": item["target"], "mode": item["mode"]}), config.volumes))

            # Build the parameters dynamically from the parsed config
            # Start the container with the provided or default configuration
            container = client.containers.create(
                image=config.image,
                detach=config.detach,
                privileged=config.privileged,
                init=config.init,
                tty=config.tty,
                stdin_open=config.stdinOpen,
                read_only=config.readOnly,
                ports=mapped_ports,
                volumes=volume_dict,
                healthcheck=healthcheck,
                command=config.command,
                name=config.name,
                auto_remove=config.auto_remove,
                mem_limit = config.memory if config.memory else None,
                mem_reservation = config.memoryReservation if config.memoryReservation else None,
                memswap_limit = config.memorySwap,
                cpu_shares =  int(config.cpuShares) if config.cpuShares else None
            )
            container.start()
            host_Config = container.attrs['HostConfig']
            container_details = {
                "name": container.name,
                "id": container.id,
                "status": container.status,
                "created": container.attrs['Created'],
                "image": container.attrs['Config']['Image'],
                "ports": container.attrs['NetworkSettings']['Ports'],
                "command": container.attrs['Config']['Cmd'],
                "state": container.attrs['State'],
                "exit_code": container.attrs['State'].get('ExitCode', None),
                "network": container.attrs['NetworkSettings']['Networks'],
                "volumes": container.attrs['Mounts'],
                "labels": container.attrs['Config'].get('Labels', {}),
                "env_vars": container.attrs['Config'].get('Env', []),
                "host_config": {
                    "CpuShares": host_Config["CpuShares"],
                    "Memory": host_Config["Memory"],
                    "MemoryReservation": host_Config["MemoryReservation"],
                    "MemorySwap": host_Config["MemorySwap"],
                    "PortBindings": host_Config["PortBindings"] if host_Config["PortBindings"] else container.attrs['NetworkSettings']['Ports']
                }
            }
            
            return {"container":container_details,"message": f"Container started successfully ({container.id})"}
        
        elif actionType == ActionTypeEnum.UPDATE:
            container = client.containers.get(body.containerId)
            config = body.updateInstanceConfig
            
            update_kwargs = {}
            if config.cpuShares:
                update_kwargs['cpu_shares'] = int(config.cpuShares)
            if config.memory:
                update_kwargs['mem_limit'] = config.memory
            if config.memoryReservation:
                update_kwargs['mem_reservation'] = config.memoryReservation
            if config.memorySwap:
                update_kwargs['memswap_limit'] = config.memorySwap
            
            container.update(**update_kwargs)
            return {"message": "Container updated successfully"}

        elif actionType == ActionTypeEnum.RERUN:
            container = client.containers.get(body.containerId)
            container.restart()
            return {"message": "Container restarted successfully"}

        elif actionType == ActionTypeEnum.PAUSE:
            container = client.containers.get(body.containerId)
            container.pause()
            return {"message": "Container paused successfully"}

        elif actionType == ActionTypeEnum.STOP:
            container = client.containers.get(body.containerId)
            container.stop()
            return {"message": "Container stopped successfully"}

        elif actionType == ActionTypeEnum.REMOVE:
            container = client.containers.get(body.containerId)
            container.remove(force=True)
            return {"message": "Container removed successfully"}

        elif actionType == ActionTypeEnum.LOGS:
            container = client.containers.get(body.containerId)
            logs = container.logs(tail=100).decode('utf-8')
            return {"logs": logs}

        elif actionType == ActionTypeEnum.FILES:
            container = client.containers.get(body.containerId)
            if not body.dir:
                return {"message": "Directory path is required"}
            
            # Execute ls command in the container
            exec_command = container.exec_run(f"ls -la {body.dir.directory}")
            files = exec_command.output.decode('utf-8')
            if "exec failed" in files:
                return JSONResponse(
                    status_code=500,
                    content={"message": f"Error: {str(files)}"}
                )
            return {"files": files}

        elif actionType == ActionTypeEnum.COMMAND:
            container = client.containers.get(body.containerId)
            if not body.dir or not body.dir.command:
                return {"message": "Command is required"}
            
            # Execute the specified command in the container
            exec_command = container.exec_run(body.dir.command)
            output = exec_command.output.decode('utf-8')
            if "exec failed" in output:
                return JSONResponse(
                    status_code=500,
                    content={"message": f"Error: {str(output)}"}
                )
            return {"output": output}

    except Exception as e:
        print(f"Error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"message": f"Error: {str(e)}"}
        )
