import logging
from github import GithubIntegration, Github
from .models import GitHubAppConfig

logger = logging.getLogger(__name__)


class GitHubAppClient:
    """Main client for interacting with GitHub App API."""
    
    def __init__(self, config: GitHubAppConfig):
        self.config = config
        self.integration = self._initialize_integration()
    
    def _initialize_integration(self) -> GithubIntegration:
        """Initialize GitHub integration with private key."""
        try:
            with open(self.config.private_key_path, 'r') as pem_file:
                private_key = pem_file.read()
            return GithubIntegration(self.config.app_id, private_key)
        except FileNotFoundError:
            logger.error(f"Private key file not found: {self.config.private_key_path}")
            raise
        except Exception as e:
            logger.error(f"Failed to initialize GitHub integration: {e}")
            raise
    
    def get_github_client(self, installation_id: int) -> Github:
        """Get authenticated GitHub client for installation."""
        try:
            token = self.integration.get_access_token(installation_id).token
            return Github(token)
        except Exception as e:
            logger.error(f"Failed to get access token for installation {installation_id}: {e}")
            raise 