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
        labels: dict | None = None,
        context_path: str | None = None,
        registry_config: Any | None = None,
        build_id: int | None = None
    ) -> str:
        """
        Build and push image to registry.
        
        Args:
            dockerfile_content: Content of Dockerfile
            image_name: Image name with tag
            labels: Optional labels for the image
            registry_config: Optional specific registry configuration
            
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
            
            # Use specific registry if provided, otherwise default/fallback
            target_registry = registry_config if registry_config else self.registry_manager.get_primary_registry()
            
            if target_registry:
                try:
                    built_name, build_logs = await self.builder.build_image(
                        dockerfile_content, image_name, labels, path=context_path
                    )
                    final_image_name = built_name
                    
                    if build_id:
                        from app.db_client.controllers.HOC.build_repository import BuildRepository
                        repo = BuildRepository(self.session)
                        repo.add_log(build_id, f"--- Docker Build Logs ---\n")
                        repo.add_log(build_id, build_logs)

                    logger.info(f"Image built successfully: {final_image_name}")
                    
                    image = self.builder.docker_client.images.get(final_image_name)
                    
                    # Direct push to the target registry
                    push_logs = await self.registry_manager.push_image(
                        image, final_image_name, target_registry
                    )
                    
                    if build_id:
                        from app.db_client.controllers.HOC.build_repository import BuildRepository
                        repo = BuildRepository(self.session)
                        repo.add_log(build_id, f"--- Docker Push Logs ---\n")
                        repo.add_log(build_id, push_logs)

                    registry_url = target_registry.url
                    
                    logger.info(
                        f"Image pushed successfully to registry: {registry_url}. "
                        f"Logs: {len(push_logs)} entries"
                    )
                    
                    # Ensure final name includes registry if not already present (though push_image tags it)
                    # We return the "remote" name for reference
                    if not final_image_name.startswith(registry_url):
                        final_image_name = f"{registry_url}/{final_image_name}"
                    
                except Exception as e:
                    logger.error(f"Failed to build and push image: {e}")
                    raise Exception(f"Image lifecycle failed: {str(e)}")
            else:
                logger.info("No registry configured, building locally only")
                built_name, logs = await self.builder.build_image(
                    dockerfile_content, image_name, labels, path=context_path
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
