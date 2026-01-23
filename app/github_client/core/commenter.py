import logging
from app.github_client.config.constants import WELCOME_MESSAGES, BUILD_MESSAGES

logger = logging.getLogger(__name__)


class PRCommenter:
    """Handles PR commenting logic."""
    
    def create_welcome_comment(self, pr, username: str, is_first_pr: bool) -> None:
        """Create welcome comment based on whether it's user's first PR."""
        try:
            if is_first_pr:
                comment = WELCOME_MESSAGES["first_pr"].format(username=username)
            else:
                comment = WELCOME_MESSAGES["returning_contributor"].format(username=username)
            
            pr.create_issue_comment(comment)
            logger.info(f"Created welcome comment on PR #{pr.number} for user {username}")
            
        except Exception as e:
            logger.error(f"Failed to create welcome comment on PR #{pr.number}: {e}")
    
    def create_build_started_comment(self, pr, username: str, check_status_url: str) -> None:
        """Create build status comment."""
        try:
            comment = BUILD_MESSAGES["build_started"].format(username=username, check_status_url=check_status_url)
            pr.create_issue_comment(comment)
            logger.info(f"Created build comment on PR #{pr.number} for user {username}")
            
        except Exception as e:
            logger.error(f"Failed to create build comment on PR #{pr.number}: {e}")
    
    def create_build_success_comment(self, pr, username: str, image_name: str) -> None:
        """Create build success comment with image details."""
        try:
            comment = BUILD_MESSAGES["build_success"].format(
                username=username,
                image_name=image_name
            )
            pr.create_issue_comment(comment)
            logger.info(f"Created build success comment on PR #{pr.number} for user {username}")
            
        except Exception as e:
            logger.error(f"Failed to create build success comment on PR #{pr.number}: {e}")
    
    def create_build_failure_comment(self, pr, username: str, error_message: str) -> None:
        """Create build failure comment."""
        try:
            comment = BUILD_MESSAGES["build_failure"].format(
                username=username,
                error_message=error_message
            )
            pr.create_issue_comment(comment)
            logger.info(f"Created build failure comment on PR #{pr.number} for user {username}")
            
        except Exception as e:
            logger.error(f"Failed to create build failure comment on PR #{pr.number}: {e}") 