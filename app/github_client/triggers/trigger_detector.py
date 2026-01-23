import logging
import re
from typing import Tuple
from sqlmodel import Session
from app.db_client.controllers.source_code_build import get_last_build_for_pr

logger = logging.getLogger(__name__)


class TriggerDetector:
    """Detects if a PR should be rebuilt based on triggers."""
    
    def __init__(self, trigger_cooldown_seconds: int = 60):
        self.trigger_cooldown_seconds = trigger_cooldown_seconds
        self._trigger_re = re.compile(r"(?i)\b(rerun|rebuild)\b")
    
    async def should_trigger_build(
        self, 
        pr, 
        session: Session, 
        base_branch: str, 
        repo_name: str
    ) -> Tuple[bool, str]:
        """
        Determine if a PR should trigger a build.
        
        Args:
            pr: GitHub PR object
            session: Database session
            base_branch: Base branch for PR
            repo_name: Repository name
            
        Returns:
            Tuple of (should_trigger, reason)
        """
        try:
            current_sha = pr.head.sha
            user_login = pr.user.login
            pr_number = str(pr.number)
            
            last_comment = None
            try:
                comments = pr.get_issue_comments()
                for c in comments:
                    if not last_comment or getattr(c, "id", 0) > getattr(last_comment, "id", 0):
                        last_comment = c
            except Exception:
                last_comment = None
            
            last_build = None
            try:
                last_build = get_last_build_for_pr(
                    session, 
                    base_branch=base_branch, 
                    branch_name=pr.head.ref, 
                    pull_request_number=pr_number
                )
            except Exception:
                last_build = None
            
            triggered_by_comment = False
            if last_comment and last_build:
                if last_comment.body in ["rebuild", "rerun", "run"]:
                    triggered_by_comment = True
                    logger.info(
                        f"Trigger comment detected on PR #{pr_number} in {repo_name} "
                        f"by {getattr(last_comment.user, 'login', None)}"
                    )
            
            triggered_by_sha_change = False
            triggered_due_to_no_prior_build = False
            if last_build:
                pr_head_sha = getattr(last_build, "pr_head_sha", None)
                if current_sha and pr_head_sha != current_sha:
                    triggered_by_sha_change = True
                    logger.info(
                        f"Head SHA change detected on PR #{pr_number} in {repo_name}: "
                        f"{pr_head_sha} -> {current_sha}"
                    )
            else:
                triggered_due_to_no_prior_build = True
                logger.info(
                    f"No prior build for PR #{pr_number} in {repo_name}"
                )
            
            if triggered_by_comment:
                reason = f"Processing PR #{pr_number} in {repo_name} due to trigger comment"
                return True, reason
            
            if triggered_by_sha_change:
                reason = f"Processing PR #{pr_number} in {repo_name} due to head SHA change"
                return True, reason
            
            if triggered_due_to_no_prior_build:
                reason = f"Processing PR #{pr_number} in {repo_name} due to no prior build record"
                return True, reason
            
            reason = (
                f"Skipping PR #{pr_number} in {repo_name} for base_branch {base_branch}: "
                "no trigger condition met"
            )
            return False, reason
            
        except Exception as e:
            logger.error(f"Error checking trigger conditions: {e}")
            raise Exception(f"Failed to check trigger conditions: {str(e)}")
