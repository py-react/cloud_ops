import logging
from sqlmodel import Session
from app.db_client.controllers.source_code_build import (
    get_last_build_for_pr,
    update_pr_head_sha
)
from app.db_client.controllers.source_code_build.source_code_build import (
    get_source_code_build
)
from app.db_client.models.source_code_build.source_code_build import SourceCodeBuild


logger = logging.getLogger(__name__)


class PRRepository:
    """Repository for PR-related database operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def update_pr_head_sha(
        self, 
        pr_number: str, 
        head_sha: str, 
        base_branch: str, 
        branch_name: str
    ) -> None:
        """Update PR head SHA in database."""
        try:
            update_pr_head_sha(
                self.session, 
                str(pr_number), 
                head_sha, 
                base_branch=base_branch, 
                branch_name=branch_name
            )
            logger.info(f"Updated PR #{pr_number} head SHA: {head_sha}")
        except Exception as e:
            logger.error(f"Failed to update PR head SHA: {e}")
            raise Exception(f"Failed to update PR head SHA: {str(e)}")
    
    def get_last_build_for_pr(
        self, 
        base_branch: str, 
        branch_name: str, 
        pr_number: str
    ) -> SourceCodeBuild | None:
        """Get last build for a specific PR."""
        try:
            last_build = get_last_build_for_pr(
                self.session, 
                base_branch=base_branch, 
                branch_name=branch_name, 
                pull_request_number=str(pr_number)
            )
            if not last_build:
                raise Exception("No builds found for PR")
            return last_build
        except Exception as e:
            logger.error(f"Failed to get last build for PR: {e}")
            return None
    
    def get_build(self, build_id: int, last: bool = False) -> list:
        """Get build by ID."""
        try:
            builds = get_source_code_build(self.session, build_id=build_id, last=last)
            return builds
        except Exception as e:
            logger.error(f"Failed to get build: {e}")
            raise Exception(f"Failed to get build: {str(e)}")
