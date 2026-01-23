import logging
from typing import Dict, Any
from io import BytesIO

logger = logging.getLogger(__name__)


class DockerImageBuilder:
    """Build Docker images from Dockerfile content."""
    
    def __init__(self, docker_client):
        self.docker_client = docker_client
    
    async def build_image(
        self, 
        dockerfile_content: str, 
        image_name: str, 
        labels: Dict[str, str] | None = None
    ) -> tuple[str, list]:
        """
        Build Docker image from Dockerfile content.
        
        Args:
            dockerfile_content: Content of Dockerfile
            image_name: Name and tag for image (e.g., "repo_branch:tag")
            labels: Optional labels to apply to the image
            
        Returns:
            Tuple of (image_name_with_id, build_logs)
            
        Raises:
            Exception: If build fails
        """
        try:
            logger.info(f"Building Docker image: {image_name}")
            
            labels_dict: Dict[str, str] = labels or {}
            
            f = BytesIO(dockerfile_content.encode('utf-8'))
            image, logs = self.docker_client.images.build(
                fileobj=f, 
                tag=image_name,
                forcerm=True, 
                rm=True,
                pull=False,
                labels=labels_dict
            )
            
            logger.info(f"Successfully built image {image_name} with ID {image.id}")
            return image_name, logs
            
        except Exception as e:
            logger.error(f"Failed to build Docker image {image_name}: {e}")
            raise Exception(f"Docker build failed: {str(e)}")
