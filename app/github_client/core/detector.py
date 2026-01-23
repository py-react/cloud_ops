import logging

logger = logging.getLogger(__name__)


class Detector:
    """Detects if a PR is the user's first to the repository."""
    
    @staticmethod
    def is_first_pr_to_repo(repo, user_login: str, current_pr_number: int) -> bool:
        """
        Check if this is the user's first PR to this specific repository.
        
        Args:
            repo: GitHub repository object
            user_login: GitHub username
            current_pr_number: Number of the current PR
            
        Returns:
            True if it's their first PR, False otherwise
        """
        try:
            # Get all PRs by this user to this repository
            user_prs = []
            
            for pr in repo.get_pulls(state='all'):
                if pr.user.login == user_login and pr.number != current_pr_number:
                    user_prs.append(pr.number)
            
            # If no previous PRs found, this is their first
            is_first = len(user_prs) == 0
            
            logger.info(f"User {user_login} has {len(user_prs)} previous PRs. Is first PR: {is_first}")
            return is_first
            
        except Exception as e:
            logger.error(f"Error checking if first PR for user {user_login}: {e}")
            # If there's any error, assume it's not their first PR to avoid false positives
            return False 