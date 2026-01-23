from pydantic import BaseModel
from typing import Dict, Any


class DockerConfig(BaseModel):
    max_image_age_hours: int = 24
    build_timeout_seconds: int = 600
    max_concurrent_builds: int = 5


def load_docker_config(settings: Dict[str, Any]) -> DockerConfig:
    """
    Load Docker configuration from settings.
    
    Args:
        settings: Dictionary of settings
        
    Returns:
        DockerConfig instance
    """
    return DockerConfig(
        max_image_age_hours=int(settings.get('DOCKER_MAX_IMAGE_AGE_HOURS', 24)),
        build_timeout_seconds=int(settings.get('DOCKER_BUILD_TIMEOUT_SECONDS', 600)),
        max_concurrent_builds=int(settings.get('DOCKER_MAX_CONCURRENT_BUILDS', 5))
    )
