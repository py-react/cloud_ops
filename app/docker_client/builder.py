import os
import asyncio
import logging
from typing import Dict, Any
from io import BytesIO

logger = logging.getLogger(__name__)


class DockerImageBuilder:
    """Build Docker images from Dockerfile content."""
    
    def __init__(self, docker_client=None):
        self._docker_client = docker_client

    @property
    def docker_client(self):
        from app.docker_client import clientContext
        return self._docker_client or clientContext.get_client(use_active=False)
    
    async def build_image(
        self, 
        dockerfile_content: str, 
        image_name: str, 
        labels: Dict[str, str] | None = None,
        path: str | None = None
    ) -> tuple[str, list]:
        """
        Build Docker image from Dockerfile content.
        
        Args:
            dockerfile_content: Content of Dockerfile
            image_name: Name and tag for image (e.g., "repo_branch:tag")
            labels: Optional labels to apply to the image
            path: Optional path to the build context
            
        Returns:
            Tuple of (image_name_with_id, build_logs)
            
        Raises:
            Exception: If build fails
        """
        try:
            logger.info(f"Building Docker image: {image_name} with context: {path}")
            
            labels_dict: Dict[str, str] = labels or {}
            
            if path:
                # If path is provided, use it as context. 
                # docker-py build() with 'path' will look for 'Dockerfile' in that path.
                # If we have custom dockerfile_content, we should probably write it to the path
                # or pass it via fileobj if possible with path.
                # Actually, build() with path and fileobj=None uses the Dockerfile in the path.
                # If we want to use the dockerfile_content we have (which might be different from what's on disk),
                # we should write it to the path as 'Dockerfile'.
                dockerfile_path = os.path.join(path, "Dockerfile")
                def _write_file():
                    with open(dockerfile_path, "w") as f:
                        f.write(dockerfile_content)
                
                await asyncio.to_thread(_write_file)
                
                image, logs = await asyncio.to_thread(
                    self.docker_client.images.build,
                    path=path,
                    tag=image_name,
                    forcerm=True, 
                    rm=True,
                    pull=False,
                    labels=labels_dict
                )
            else:
                f = BytesIO(dockerfile_content.encode('utf-8'))
                image, logs = await asyncio.to_thread(
                    self.docker_client.images.build,
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
