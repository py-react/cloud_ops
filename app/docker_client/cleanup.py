import logging
import time
import datetime
from typing import Dict

logger = logging.getLogger(__name__)


class ImageCleanupService:
    """Service for cleaning up old Docker images."""
    
    def __init__(self, docker_client):
        self.docker_client = docker_client
    
    async def cleanup_old_resources(self, max_age_hours: int = 24) -> Dict[str, int]:
        """
        Clean up old PR-related resources.
        
        Args:
            max_age_hours: Maximum age in hours for resources to be considered old
            
        Returns:
            Dictionary with cleanup counts: {'images_cleaned': int, 'errors': int}
        """
        stats = {'images_cleaned': 0, 'errors': 0}
        
        try:
            current_time = time.time()
            max_age_seconds = max_age_hours * 3600
            
            images = self.docker_client.images.list(filters={"label": "com.github.pr"})
            for image in images:
                try:
                    created_time = image.attrs['Created']
                    created_dt = datetime.datetime.fromisoformat(created_time.replace('Z', '+00:00'))
                    created_timestamp = created_dt.timestamp()
                    
                    if current_time - created_timestamp > max_age_seconds:
                        image_name = image.tags[0] if image.tags else image.id
                        logger.info(f"Removing old image {image_name} (created {created_time})")
                        self.docker_client.images.remove(image.id, force=True)
                        stats['images_cleaned'] += 1
                except Exception as e:
                    logger.warning(f"Failed to remove image {image.id}: {e}")
                    stats['errors'] += 1
            
            logger.info(f"Cleanup complete: {stats['images_cleaned']} images cleaned, {stats['errors']} errors")
            
        except Exception as e:
            logger.error(f"Failed to cleanup old PR resources: {e}")
            stats['errors'] += 1
        
        return stats
