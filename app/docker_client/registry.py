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
    
    def __init__(self, registries: List[RegistryConfig], docker_client):
        self.registries = registries
        self.docker_client = docker_client
    
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

    async def _manage_registry_bridge(self, start=True):
        """
        Start or stop a socat bridge container to allow Docker daemon inside VM
        to reach the host's 5001 port via 127.0.0.1.
        """
        bridge_name = "registry-proxy-bridge"
        try:
            if start:
                logger.info("Starting registry bridge container...")
                # Try to remove existing one first just in case
                try:
                    old = await asyncio.to_thread(self.docker_client.containers.get, bridge_name)
                    await asyncio.to_thread(old.remove, force=True)
                except:
                    pass
                
                # Alpine socat to bridge 127.0.0.1:5001 (VM) -> host.docker.internal:5001 (Host)
                # Network mode 'host' puts it in the VM's main network namespace
                await asyncio.to_thread(
                    self.docker_client.containers.run,
                    "alpine/socat",
                    command=f"tcp-listen:5001,fork,reuseaddr tcp-connect:host.docker.internal:5001",
                    name=bridge_name,
                    network_mode="host",
                    detach=True
                )
                logger.info("Registry bridge container started successfully")
            else:
                logger.info("Stopping registry bridge container...")
                try:
                    container = await asyncio.to_thread(self.docker_client.containers.get, bridge_name)
                    await asyncio.to_thread(container.stop, timeout=2)
                    logger.info("Registry bridge container stopped")
                except:
                    pass
        except Exception as e:
            logger.error(f"Failed to manage registry bridge: {e}")

    def get_primary_registry(self) -> RegistryConfig | None:
        """Get highest priority registry."""
        return self.registries[0] if self.registries else None
    
    async def check_connectivity(self, registry_config: RegistryConfig) -> bool:
        """Test registry connectivity."""
        try:
            # If it is a K8s registry, we might need to use proxy
            if not registry_config.is_remote:
                logger.info(f"Checking K8s registry connectivity via proxy for {registry_config.url}")
                namespace = registry_config.config.get("namespace", "image-registry")
                # Derive service name from name + "-service" as per user instructions
                service_name = registry_config.config.get("service_name", f"{registry_config.name}-service")
                
                # Registries run on 5000
                result = await asyncio.to_thread(
                    access_registry_via_api_proxy,
                    namespace=namespace, 
                    service_name=service_name,
                    service_port=5000
                )
                return result is not None and "repositories" in result
            
            # For remote registries, direct access
            registry_api_url = f"http://{registry_config.url}/v2/_catalog"
            # decrypt password if needed
            auth = None
            if registry_config.username and registry_config.password:
                plain_password = decrypt(registry_config.password)
                auth = requests.auth.HTTPBasicAuth(registry_config.username, plain_password)
                
            response = await asyncio.to_thread(requests.get, registry_api_url, auth=auth, timeout=10, verify=False)
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Registry connectivity check failed for {registry_config.url}: {e}")
            return False
    
    async def push_image(
        self, 
        image: Any, 
        image_name: str, 
        registry_config: RegistryConfig
    ) -> List[str]:
        """
        Push image to specified registry.
        
        Args:
            image: Docker image object
            image_name: Image name with tag (e.g., "repo_branch:tag")
            registry_config: Registry configuration
            
        Returns:
            List of push log strings
            
        Raises:
            APIError: If push fails
        """
        try:
            logger.info(f"Pushing image to registry: {registry_config.url}")
            
            # Robust name extraction
            repo_name, tag = self._get_repo_and_tag(image_name)
            
            # Determine target repository
            if not registry_config.is_remote:
                # For K8s registries, push through our own proxy on port 5001
                # Format: 127.0.0.1:5001/{service}/{namespace}/{repo_name}
                # Docker daemon will hit: 127.0.0.1:5001/v2/{service}/{namespace}/{repo_name}/...
                # Note: We use 127.0.0.1 because Docker trusts loopback for insecure registries
                namespace = registry_config.config.get("namespace", "image-registry")
                service_name = registry_config.config.get("service_name", f"{registry_config.name}-service")
                target_repo = f"127.0.0.1:5001/{service_name}/{namespace}/{repo_name}"
                
                # Start the loopback bridge
                await self._manage_registry_bridge(start=True)
            else:
                target_repo = f"{registry_config.url}/{repo_name}"

            # Tag image for the target registry first
            await asyncio.to_thread(image.tag, target_repo, tag=tag)
            
            # Prepare auth config if needed
            auth_config = None
            if registry_config.username and registry_config.password:
                auth_config = {
                    'username': registry_config.username,
                    'password': decrypt(registry_config.password)
                }

            def _do_push():
                push_logs = []
                push_stream = self.docker_client.images.push(
                    repository=target_repo,
                    tag=tag,
                    stream=True,
                    decode=True,
                    auth_config=auth_config
                )
                
                for line in push_stream:
                    if 'status' in line:
                        status = line['status']
                        layer_id = line.get('id', '')
                        
                        if layer_id:
                            push_logs.append(f"{layer_id[:12]}: {status}")
                        else:
                            push_logs.append(status)
                    
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
                await self._manage_registry_bridge(start=False)
    
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
                service_name = registry_config.config.get("service_name", f"{registry_config.name}-service")
                
                # Verify repository
                catalog = await asyncio.to_thread(
                    access_registry_via_api_proxy,
                    namespace=namespace, 
                    service_name=service_name,
                    service_port=5000
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
    
    async def push_with_fallback(
        self, 
        image: Any, 
        image_name: str
    ) -> tuple[str, List[str]]:
        """
        Push image to registries with fallback.
        
        Tries each registry in priority order until one succeeds.
        
        Args:
            image: Docker image object
            image_name: Image name with tag
            
        Returns:
            Tuple of (successful_registry_url, push_logs)
            
        Raises:
            Exception: If all registries fail
        """
        if not self.registries:
            raise Exception("No registries configured")
        
        for registry in self.registries:
            try:
                logger.info(f"Attempting to push to registry: {registry.url}")
                
                connectivity_ok = await self.check_connectivity(registry)
                if not connectivity_ok:
                    logger.warning(f"Registry {registry.url} not accessible, trying next")
                    continue
                
                logs = await self.push_image(image, image_name, registry)
                
                # Robust extraction
                repo_name, tag = self._get_repo_and_tag(image_name)
                
                verified, msg = await self.verify_push(registry, repo_name, tag)
                
                if verified:
                    logger.info(f"Successfully pushed and verified image to {registry.url}")
                    return registry.url, logs
                else:
                    logger.warning(f"Push verification failed for {registry.url}: {msg}")
                    continue
                    
            except Exception as e:
                logger.warning(f"Registry {registry.url} failed: {e}")
                continue
        
        raise Exception(f"All registries failed. Tried {len(self.registries)} registries")
