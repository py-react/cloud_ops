from fastapi import Request, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging
import subprocess
import asyncio
import random
import socket
import sys
from contextlib import asynccontextmanager

from app.k8s_helper.core.context_ops import ContextOperations
from kiwijs.utils import load_settings
from app.docker_client import clientContext
from app.github_client.config.registry_config import load_registries
from app.docker_client.registry import RegistryManager

logger = logging.getLogger(__name__)

class LoadImageRequest(BaseModel):
    image: str
    tag: str
    registry_id: Optional[int] = None
    pull_source_override: Optional[str] = None


class AsyncPortForwarder:
    def __init__(self, resource: str, remote_port: int, namespace: str = "default"):
        self.resource = resource
        self.remote_port = remote_port
        self.namespace = namespace
        self.local_port = self._get_free_port()
        self.process = None

    def _get_free_port(self):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            return s.getsockname()[1]

    async def start(self):
        cmd = [
            "kubectl", "port-forward", 
            "--address", "0.0.0.0",
            self.resource, 
            f"{self.local_port}:{self.remote_port}", 
            "-n", self.namespace
        ]
        logger.info(f"Starting port-forward: {' '.join(cmd)}")
        self.process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Wait a bit for it to be ready
        for _ in range(20):
            if await self._check_port_open():
                logger.info(f"Port-forward established on {self.local_port}")
                return
            await asyncio.sleep(0.5)
        
        # If we get here, it failed to start listening
        await self.stop()
        raise Exception(f"Failed to establish port-forward to {self.resource}")

    async def _check_port_open(self):
        try:
            _, writer = await asyncio.open_connection("127.0.0.1", self.local_port)
            writer.close()
            await writer.wait_closed()
            return True
        except:
            return False

    async def stop(self):
        if self.process:
            if self.process.returncode is None:
                self.process.terminate()
                try:
                    await asyncio.wait_for(self.process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    self.process.kill()
            self.process = None

@asynccontextmanager
async def port_forward_context(resource: str, remote_port: int, namespace: str = "default"):
    pf = AsyncPortForwarder(resource, remote_port, namespace)
    try:
        await pf.start()
        yield pf.local_port
    finally:
        await pf.stop()


class DockerDesktopBridge:
    def __init__(self, host_port: int, bridge_port: int = None):
        self.host_port = host_port
        # If no bridge port provided, find a free one (not perfect as it's on Host, but unlikely VM collision)
        self.bridge_port = bridge_port or self._get_free_port()
        self.container_name = f"registry-bridge-{random.randint(1000,9999)}"
        self.client = clientContext.get_client()

    def _get_free_port(self):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            return s.getsockname()[1]

    async def start(self):
        logger.info(f"Starting Docker Desktop Bridge: VM:127.0.0.1:{self.bridge_port} -> Host:{self.host_port}")
        # Run alpine/socat
        # network_mode="host" on Mac puts it in VM network namespace.
        # We listen on VM localhost, and forward to host.docker.internal (Host)
        command = f"tcp-listen:{self.bridge_port},fork,reuseaddr tcp-connect:host.docker.internal:{self.host_port}"
        
        try:
            await asyncio.to_thread(
                self.client.containers.run,
                "alpine/socat",
                command=command,
                name=self.container_name,
                network_mode="host",
                detach=True,
                remove=True # Auto-remove on stop if possible, but we manually remove usually
            )
        except Exception as e:
            logger.error(f"Failed to start bridge container: {e}")
            raise e
            
        # Give it a sec
        await asyncio.sleep(1)

    async def stop(self):
        try:
            container = await asyncio.to_thread(self.client.containers.get, self.container_name)
            await asyncio.to_thread(container.stop, timeout=1)
            # Remove handled by auto-remove or force
        except Exception:
            pass
        logger.info("Docker Desktop Bridge stopped")

@asynccontextmanager
async def bridge_context(host_port: int):
    # Only applicable on Darwin (and maybe Windows) for Docker Desktop
    use_bridge = sys.platform == "darwin" # Simplify for now
    
    if use_bridge:
        bridge = DockerDesktopBridge(host_port)
        try:
            await bridge.start()
            yield bridge.bridge_port
        finally:
            await bridge.stop()
    else:
        # On Linux, 127.0.0.1 works directly, no bridge needed.
        # So "bridge_port" is just the "host_port" (local_port from port-forward)
        yield host_port


async def POST(request: Request, body: LoadImageRequest):
    """
    Load a docker image into the current Kind or Minikube cluster.
    """
    try:
        settings = load_settings()
        kubeconfig_path = settings.get("KUBECONFIG", "~/.kube/config")
        
        # 1. Provide Context & Cluster Detection
        context_ops = ContextOperations(kubeconfig_path)
        try:
            current_context = context_ops.get_current_contex()
        except:
            raise HTTPException(status_code=400, detail="Could not determine current Kubernetes context")

        is_kind = current_context.startswith("kind-")
        is_minikube = current_context == "minikube"
        is_docker_desktop = current_context == "docker-desktop"

        if not (is_kind or is_minikube or is_docker_desktop):
            raise HTTPException(
                status_code=400, 
                detail=f"Current context '{current_context}' is not supported. Only 'kind-*' and 'minikube' contexts are supported for direct loading."
            )

        # 2. Logic to Pull Image to Host
        docker_client = clientContext.get_client()
        
        pull_source = f"{body.image}:{body.tag}"
        requires_retag = False
        original_pull_source = pull_source
        
        registries = load_registries(settings)
        registry = next((r for r in registries if r.id == body.registry_id), None) if body.registry_id else None
        
        # Determine how to pull
        if body.pull_source_override:
            pull_source = body.pull_source_override
            requires_retag = True
            original_pull_source = f"{body.image}:{body.tag}"
            
        elif registry:
             full_image_name = body.image
             if not body.image.startswith(registry.url):
                 full_image_name = f"{registry.url}/{body.image}"
             
             original_pull_source = f"{full_image_name}:{body.tag}"
             pull_source = original_pull_source

             if not registry.is_remote:
                 # Internal Registry! Need Port Forwarding + Bridge (if Mac).
                 namespace = registry.config.get("namespace", "image-registry")
                 service_name = registry.config.get("service_name", f"{registry.name}-service")
                 service_port = 5000 
                 
                 logger.info(f"Registry is internal. Pipeline: Host-PF -> (Bridge) -> Pull")
                 
                 async with port_forward_context(f"svc/{service_name}", service_port, namespace) as local_port:
                     # local_port is on Host.
                     # create bridge if needed
                     async with bridge_context(local_port) as pull_port:
                         # pull_port is the port to use with 127.0.0.1
                         # If bridge used, pull_port is VM's localhost port.
                         # If no bridge, pull_port is Host's localhost port (same as local_port).
                         
                         localhost_pull_source = f"127.0.0.1:{pull_port}/{body.image}:{body.tag}"
                         logger.info(f"Pulling from {localhost_pull_source} (mapped to k8s service)...")
                         
                         try:
                             await asyncio.to_thread(docker_client.images.pull, localhost_pull_source)
                             
                             # Retag
                             logger.info(f"Retagging {localhost_pull_source} -> {original_pull_source}")
                             img = docker_client.images.get(localhost_pull_source)
                             img.tag(original_pull_source)
                             
                             pull_source = original_pull_source 
                             
                             # Cleanup local tag
                             try:
                                 docker_client.images.remove(localhost_pull_source)
                             except:
                                 pass
                                 
                         except Exception as e:
                              logger.error(f"Failed to pull/tag via port-forward/bridge: {e}")
                              raise HTTPException(status_code=500, detail=f"Failed to pull from internal registry: {e}")
                 
                 # Logic continues
             else:
                 pass

        # Ensure we have the image (Standard pull fallback)
        try:
            image_obj = docker_client.images.get(original_pull_source)
            logger.info(f"Image {original_pull_source} found locally.")
        except:
             if not (registry and not registry.is_remote):
                 logger.info(f"Pulling image {pull_source} to host...")
                 try:
                    await asyncio.to_thread(docker_client.images.pull, pull_source)
                    if requires_retag:
                        img = docker_client.images.get(pull_source)
                        img.tag(original_pull_source)
                        pull_source = original_pull_source
                 except Exception as e:
                    logger.error(f"Failed to pull image {pull_source}: {e}")
                    raise HTTPException(status_code=500, detail=f"Failed to pull image to host: {str(e)}")

        # 4. Load into Cluster
        if is_docker_desktop:
             return {
                "success": True,
                "message": f"Image pulled to host. For Docker Desktop, this is usually sufficient.",
                "logs": "Skipped load step for Docker Desktop."
            }
            
        cmd = []
        if is_kind:
            cluster_name = current_context[5:]
            cmd = ["kind", "load", "docker-image", original_pull_source, "--name", cluster_name]
        elif is_minikube:
            cmd = ["minikube", "image", "load", original_pull_source]

        logger.info(f"Loading image into cluster with command: {' '.join(cmd)}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            error_msg = stderr.decode().strip()
            logger.error(f"Cluster load failed: {error_msg}")
            raise HTTPException(status_code=500, detail=f"Failed to load image into cluster: {error_msg}")

        return {
            "success": True,
            "message": f"Successfully loaded {original_pull_source} into {current_context}",
            "logs": stdout.decode().strip()
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception("Unexpected error during image load")
        raise HTTPException(status_code=500, detail=str(e))
