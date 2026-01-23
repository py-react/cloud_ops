import logging
import datetime
from sqlmodel import Session
from app.db_client.controllers.source_code_build.source_code_build import (
    create_source_code_build,
    update_source_code_build_status,
    update_source_code_build_time_taken,
    safe_add_build_log
)
from app.db_client.models.source_code_build.types import SourceCodeBuildType
from app.db_client.models.source_code_build.source_code_build import SourceCodeBuild


logger = logging.getLogger(__name__)


class BuildRepository:
    """Repository for source code build operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create_build(self, build_data: SourceCodeBuildType) -> SourceCodeBuild:
        """Create new build record."""
        try:
            build_obj = create_source_code_build(self.session, build_data)
            logger.info(f"Created build record: {build_obj.id}")
            return build_obj
        except Exception as e:
            logger.error(f"Failed to create build record: {e}")
            raise Exception(f"Failed to create build record: {str(e)}")
    
    def update_status(self, build_id: int, status: str) -> None:
        """Update build status."""
        try:
            update_source_code_build_status(self.session, build_id, status)
            logger.info(f"Updated build {build_id} status to {status}")
        except Exception as e:
            logger.error(f"Failed to update build status: {e}")
            raise Exception(f"Failed to update build status: {str(e)}")
    
    def add_log(self, build_id: int, message: str | list) -> None:
        """Add log entry to build."""
        try:
            safe_add_build_log(self.session, build_id, message)
        except Exception as e:
            logger.error(f"Failed to add build log: {e}")
            raise Exception(f"Failed to add build log: {str(e)}")
    
    def update_time_and_status(
        self, 
        build_id: int, 
        start_time: datetime.datetime, 
        status: str
    ) -> None:
        """Update build status and calculate time taken."""
        try:
            try:
                update_source_code_build_status(self.session, build_id, status)
            except Exception as e:
                logger.error(f"Failed to update build status: {e}")
                raise Exception(f"Failed to update build status: {str(e)}")
            
            if status != "success":
                try:
                    build_obj = update_source_code_build_time_taken(self.session, build_id=build_id)
                    if build_obj:
                        logger.info(f"Updated build {build_id}: status={status}, time={build_obj.time_taken}s")
                    else:
                        raise Exception("Build not found")
                except Exception as e:
                    logger.error(f"Failed to update build time taken: {e}")
                    raise Exception(f"Failed to update build time taken: {str(e)}")
        except Exception as e:
            logger.error(f"Failed to update build time and status: {e}")
            raise Exception(f"Failed to update build time and status: {str(e)}")
