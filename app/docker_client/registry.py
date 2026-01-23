import logging
import requests
from typing import List, Any
from docker.errors import APIError
from app.github_client.config.registry_config import RegistryConfig

logger = logging.getLogger(__name__)


class RegistryManager:
    """Manage Docker registry operations for multiple registries."""
    
    def __init__(self, registries: List[RegistryConfig], docker_client):
        self.registries = registries
        self.docker_client = docker_client
    
    def get_primary_registry(self) -> RegistryConfig | None:
        """Get highest priority registry."""
        return self.registries[0] if self.registries else None
    
    async def check_connectivity(self, registry_config: RegistryConfig) -> bool:
        """Test registry connectivity."""
        try:
            registry_api_url = f"http://{registry_config.url}/v2/_catalog"
            response = requests.get(registry_api_url, timeout=10, verify=False)
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
            
            push_logs = []
            repo_name = image_name.split(':')[0]
            tag = image_name.split(':')[-1]
            
            push_stream = self.docker_client.images.push(
                repository=f"{registry_config.url}/{repo_name}",
                tag=tag,
                stream=True,
                decode=True,
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
            
            logger.info(f"Successfully pushed image to {registry_config.url}")
            return push_logs
            
        except Exception as e:
            logger.error(f"Failed to push image to {registry_config.url}: {e}")
            raise
    
    async def verify_push(
        self, 
        registry_config: RegistryConfig, 
        repo_name: str, 
        tag: str
    ) -> tuple[bool, str]:
        """
        Verify image was successfully pushed to registry.
        
        Args:
            registry_config: Registry configuration
            repo_name: Repository name in registry
            tag: Image tag
            
        Returns:
            Tuple of (success, message)
        """
        try:
            catalog_url = f"http://{registry_config.url}/v2/_catalog"
            response = requests.get(catalog_url, timeout=10, verify=False)
            
            if response.status_code != 200:
                return False, "Cannot access registry catalog"
            
            repositories = response.json().get('repositories', [])
            if repo_name not in repositories:
                return False, f"Repository '{repo_name}' not found in registry"
            
            tags_url = f"http://{registry_config.url}/v2/{repo_name}/tags/list"
            tags_response = requests.get(tags_url, timeout=10, verify=False)
            
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
                repo_name = image_name.split(':')[0]
                tag = image_name.split(':')[-1]
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
