import logging
from typing import Any

logger = logging.getLogger(__name__)


class ImageLifecycleService:
    """Service managing full image lifecycle: build → push → cleanup."""
    
    def __init__(
        self,
        builder: Any,
        registry_manager: Any,
        cleanup_service: Any,
        session: Any
    ):
        self.builder = builder
        self.registry_manager = registry_manager
        self.cleanup_service = cleanup_service
        self.session = session
    
    async def build_and_push(
        self, 
        dockerfile_content: str, 
        image_name: str, 
        labels: dict | None = None
    ) -> str:
        """
        Build and push image to registry.
        
        Args:
            dockerfile_content: Content of Dockerfile
            image_name: Image name with tag
            labels: Optional labels for the image
            
        Returns:
            Final image name (may include registry URL)
            
        Raises:
            Exception: If build or push fails
        """
        try:
            logger.info(f"Starting image lifecycle for: {image_name}")
            
            if labels is None:
                labels = {}
            
            final_image_name = image_name
            
            if self.registry_manager.get_primary_registry():
                try:
                    built_name, logs = await self.builder.build_image(
                        dockerfile_content, image_name, labels
                    )
                    final_image_name = built_name
                    
                    logger.info(f"Image built successfully: {final_image_name}")
                    
                    
                    image = self.builder.docker_client.images.get(final_image_name.split(':')[0])
                    registry_url, push_logs = await self.registry_manager.push_with_fallback(
                        image, final_image_name
                    )
                    
                    logger.info(
                        f"Image pushed successfully to registry: {registry_url}. "
                        f"Logs: {len(push_logs)} entries"
                    )
                    
                    final_image_name = f"{registry_url}/{final_image_name}"
                    
                except Exception as e:
                    logger.error(f"Failed to build and push image: {e}")
                    raise Exception(f"Image lifecycle failed: {str(e)}")
            else:
                logger.info("No registry configured, building locally only")
                built_name, logs = await self.builder.build_image(
                    dockerfile_content, image_name, labels
                )
                final_image_name = built_name
            
            logger.info(f"Image lifecycle complete: {final_image_name}")
            return final_image_name
            
        except Exception as e:
            logger.error(f"Image lifecycle service failed: {e}")
            raise
    
    async def cleanup_old_images(self, max_age_hours: int = 24) -> dict:
        """
        Cleanup old images.
        
        Args:
            max_age_hours: Maximum age in hours
            
        Returns:
            Cleanup statistics
        """
        try:
            logger.info(f"Starting image cleanup (max_age={max_age_hours}h)")
            stats = await self.cleanup_service.cleanup_old_resources(max_age_hours)
            logger.info(f"Cleanup complete: {stats}")
            return stats
        except Exception as e:
            logger.error(f"Cleanup service failed: {e}")
            return {'images_cleaned': 0, 'errors': 1}
