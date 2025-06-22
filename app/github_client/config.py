import os
import logging
from .models import GitHubAppConfig

logger = logging.getLogger(__name__)


def get_config() -> GitHubAppConfig:
    """Get configuration from environment variables or defaults."""
    try:
        return GitHubAppConfig(
            app_id=int(os.getenv('GITHUB_APP_ID', '1441276')),
            private_key_path=os.getenv('GITHUB_PRIVATE_KEY_PATH', '/Users/deep/Documents/personal/py-react/cloud_ops/ghapp-testing.2025-06-21.private-key.pem')
        )
    except ValueError as e:
        logger.error(f"Configuration validation failed: {e}")
        raise 