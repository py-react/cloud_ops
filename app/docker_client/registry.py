import logging
import asyncio
import requests
from typing import List, Any
from docker.errors import APIError
from app.github_client.config.registry_config import RegistryConfig
from app.utils.crypto import decrypt
from app.k8s_helper.core import access_registry_via_api_proxy

logger = logging.getLogger(__name__)


class RegistryManager:
    """Manage Docker registry operations for multiple registries."""
    
    def __init__(self, registries: List[RegistryConfig], docker_client=None):
        self.registries = registries
        self._docker_client = docker_client

    @property
    def docker_client(self):
        from app.docker_client import clientContext
        return self._docker_client or clientContext.get_client()
    
    def _get_repo_and_tag(self, image_name: str) -> tuple[str, str]:
        """
        Robustly extract repository name and tag from image name.
        Handles registry prefixes and namespaced paths.
        
        Example: 
        - "registry.com/my-repo:latest" -> ("my-repo", "latest")
        - "127.0.0.1:5001/svc/ns/repo:v1" -> ("repo", "v1")
        - "alpine" -> ("alpine", "latest")
        """
        # 1. Handle tag
        if ':' in image_name:
            base, tag = image_name.rsplit(':', 1)
        else:
            base, tag = image_name, "latest"
            
        # 2. Handle registry/namespacing
        # The repository name in the registry's internal catalog is usually the last component
        # after all slashes when pushing via a proxy/bridge.
        if '/' in base:
            repo = base.split('/')[-1]
        else:
            repo = base
            
        return repo, tag

    async def _start_registry_proxy(self, service: str, namespace: str, service_port: int = 80) -> int:
        """
        Start a dedicated lightweight proxy server on a free port that forwards
        Docker registry requests to the K8s API.
        """
        import socket
        import threading
        import uvicorn
        from starlette.applications import Starlette
        from starlette.routing import Route
        from app.main import cluster_proxy

        # Find a free port
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(('', 0))
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            local_port = s.getsockname()[1]

        # Build a minimal starlette proxy app that delegates to cluster_proxy
        async def _registry_handler(request):
            path = request.path_params.get("path", "")
            full_path = f"/v2/{path}" if path else "/v2/"
            return await cluster_proxy(
                request=request,
                service=service,
                namespace=namespace,
                path=full_path,
                service_port=service_port,
                rewrite_v2_location=False
            )

        async def _v2_root_handler(request):
            """Handle GET/HEAD /v2/ which Docker uses for discovery."""
            from starlette.responses import Response
            headers = {
                "Docker-Distribution-API-Version": "registry/2.0",
                "X-Content-Type-Options": "nosniff",
                "Content-Type": "application/json"
            }
            return Response(content="{}", status_code=200, headers=headers)

        proxy_app = Starlette(routes=[
            Route("/v2/{path:path}", _registry_handler, methods=["GET", "POST", "PUT", "DELETE", "HEAD", "PATCH"]),
            Route("/v2/", _v2_root_handler, methods=["GET", "HEAD"]),
        ])

        # Run the server in its own thread + event loop
        server_config = uvicorn.Config(proxy_app, host="0.0.0.0", port=local_port, log_level="warning")
        self._proxy_server = uvicorn.Server(server_config)

        def _run_isolated():
            import asyncio as _asyncio
            loop = _asyncio.new_event_loop()
            _asyncio.set_event_loop(loop)
            loop.run_until_complete(self._proxy_server.serve())
            loop.close()

        self._proxy_thread = threading.Thread(target=_run_isolated, daemon=True)
        self._proxy_thread.start()

        # Give the server time to bind and start accepting connections
        await asyncio.sleep(1.5)
        logger.info(f"Registry proxy started on dedicated port {local_port} for {service}:{service_port}")
        return local_port

    async def _stop_registry_proxy(self):
        """Stop the dedicated registry proxy server and its thread."""
        server = getattr(self, '_proxy_server', None)
        thread = getattr(self, '_proxy_thread', None)
        if server:
            server.should_exit = True
            self._proxy_server = None
        if thread and thread.is_alive():
            thread.join(timeout=5.0)
            self._proxy_thread = None
        logger.info("Registry proxy stopped")

    async def _manage_socat_bridge(self, local_port: int, start: bool = True):
        """
        Manage a socat bridge container so the Docker daemon (inside VM) can reach
        the host's dedicated registry proxy port via 127.0.0.1.
        """
        bridge_name = "registry-pf-bridge"
        try:
            if start:
                logger.info(f"Starting socat bridge on port {local_port}...")
                try:
                    old = await asyncio.to_thread(self.docker_client.containers.get, bridge_name)
                    await asyncio.to_thread(old.remove, force=True)
                except Exception:
                    pass

                await asyncio.to_thread(
                    self.docker_client.containers.run,
                    "alpine/socat",
                    command=f"tcp-listen:{local_port},fork,reuseaddr tcp-connect:host.docker.internal:{local_port}",
                    name=bridge_name,
                    network_mode="host",
                    detach=True
                )
                logger.info(f"Socat bridge started (VM:{local_port} → host:{local_port})")
            else:
                logger.info("Stopping socat bridge...")
                try:
                    container = await asyncio.to_thread(self.docker_client.containers.get, bridge_name)
                    await asyncio.to_thread(container.stop, timeout=2)
                    try:
                        await asyncio.to_thread(container.remove)
                    except Exception:
                        pass
                    logger.info("Socat bridge stopped")
                except Exception:
                    pass
        except Exception as e:
            logger.error(f"Failed to manage socat bridge: {e}")

    def get_primary_registry(self) -> RegistryConfig | None:
        """Get highest priority registry."""
        return self.registries[0] if self.registries else None


    async def push_image(
        self,
        image: Any,
        image_name: str,
        registry_config: RegistryConfig
    ) -> List[str]:
        """
        Push image to specified registry.

        For K8s (non-remote) registries: starts a dedicated proxy server on a free
        port that proxies to the K8s API — same logic as cluster_proxy but on its own
        port so Docker push traffic never hits our main app server (port 5001).

        Args:
            image: Docker image object
            image_name: Image name with tag (e.g., "repo_branch:tag")
            registry_config: Registry configuration

        Returns:
            List of push log strings

        Raises:
            APIError: If push fails
        """
        local_port = None
        try:
            logger.info(f"Pushing image to registry: {registry_config.url}")

            repo_name, tag = self._get_repo_and_tag(image_name)

            if not registry_config.is_remote:
                namespace = registry_config.config.get("namespace", "image-registry")
                service_name = registry_config.config.get("service_name", registry_config.url.split('.')[0])
                
                # Parse port from URL if present, otherwise default to 80
                service_port = 80
                if ":" in registry_config.url:
                    try:
                        service_port = int(registry_config.url.split(":")[-1])
                        # If port was present, service_name should exclude it
                        if service_name and ":" in service_name:
                            service_name = service_name.split(":")[0]
                    except (ValueError, IndexError):
                        pass

                # Start dedicated proxy server on a free port (NOT 5001)
                local_port = await self._start_registry_proxy(service_name, namespace, service_port=service_port)

                # Socat bridge: Docker VM 127.0.0.1:{local_port} → host:{local_port}
                await self._manage_socat_bridge(local_port, start=True)

                # Direct tag — no service/namespace prefix needed since our proxy handles routing
                target_repo = f"127.0.0.1:{local_port}/{repo_name}"
            else:
                target_repo = f"{registry_config.url}/{repo_name}"

            await asyncio.to_thread(image.tag, target_repo, tag=tag)


            def _do_push():
                push_logs = []
                push_stream = self.docker_client.images.push(
                    repository=target_repo,
                    tag=tag,
                    stream=True,
                    decode=True,
                )
                for line in push_stream:
                    if 'status' in line:
                        layer_id = line.get('id', '')
                        status = line['status']
                        push_logs.append(f"{layer_id[:12]}: {status}" if layer_id else status)
                    if 'error' in line:
                        raise APIError(line['error'])
                return push_logs

            push_logs = await asyncio.to_thread(_do_push)

            logger.info(f"Successfully pushed image to {registry_config.url}")
            return push_logs

        except Exception as e:
            logger.error(f"Failed to push image to {registry_config.url}: {e}")
            raise
        finally:
            if not registry_config.is_remote:
                await self._manage_socat_bridge(local_port or 0, start=False)
                await self._stop_registry_proxy()

    
    async def verify_push(
        self, 
        registry_config: RegistryConfig, 
        repo_name: str, 
        tag: str
    ) -> tuple[bool, str]:
        """
        Verify image was successfully pushed to registry.
        """
        try:
            if not registry_config.is_remote:
                logger.info(f"Verifying push to K8s registry via proxy for {registry_config.url}")
                namespace = registry_config.config.get("namespace", "image-registry")
                service_name = registry_config.config.get("service_name", registry_config.url.split('.')[0])
                
                # Parse port from URL if present
                service_port = 80
                if ":" in registry_config.url:
                    try:
                        service_port = int(registry_config.url.split(":")[-1])
                        if service_name and ":" in service_name:
                            service_name = service_name.split(":")[0]
                    except (ValueError, IndexError):
                        pass

                # Verify repository
                catalog = await asyncio.to_thread(
                    access_registry_via_api_proxy,
                    namespace=namespace, 
                    service_name=service_name,
                    service_port=service_port
                )
                
                repositories = catalog.get('repositories', []) if catalog else []
                logger.info(f"Registry catalog via proxy: {repositories}")
                
                if repo_name not in repositories:
                    return False, f"Repository '{repo_name}' not found in registry catalog (found: {repositories})"
                
                # Verify tag
                tags_info = await asyncio.to_thread(
                    access_registry_via_api_proxy,
                    namespace=namespace, 
                    service_name=service_name,
                    service_port=5000,
                    image_name=repo_name
                )
                
                available_tags = tags_info.get('tags', []) if tags_info else []
                logger.info(f"Available tags for {repo_name} via proxy: {available_tags}")
                
                if tag not in available_tags:
                    return False, f"Tag '{tag}' not found in available tags for {repo_name} (found: {available_tags})"
                
                return True, f"Image {repo_name}:{tag} successfully verified in registry (via proxy)"

            # Remote registry verification
            auth = None
            if registry_config.username and registry_config.password:
                auth = requests.auth.HTTPBasicAuth(registry_config.username, decrypt(registry_config.password))

            catalog_url = f"http://{registry_config.url}/v2/_catalog"
            response = await asyncio.to_thread(requests.get, catalog_url, auth=auth, timeout=10, verify=False)
            
            if response.status_code != 200:
                return False, f"Cannot access registry catalog ({response.status_code})"
            
            repositories = response.json().get('repositories', [])
            if repo_name not in repositories:
                return False, f"Repository '{repo_name}' not found in registry"
            
            tags_url = f"http://{registry_config.url}/v2/{repo_name}/tags/list"
            tags_response = await asyncio.to_thread(requests.get, tags_url, auth=auth, timeout=10, verify=False)
            
            if tags_response.status_code != 200:
                return False, "Cannot retrieve tags"
            
            available_tags = tags_response.json().get('tags', [])
            if tag not in available_tags:
                return False, f"Tag '{tag}' not found in available tags"
            
            return True, "Image successfully verified in registry"
        
        except Exception as e:
            return False, f"Verification failed: {str(e)}"
    
