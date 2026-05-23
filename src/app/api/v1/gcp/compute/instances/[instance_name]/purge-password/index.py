import logging
from fastapi import Request, HTTPException
from app.db_client.db import get_session
from app.db_client.controllers.compute_instance import (
    get_compute_instance_by_name,
    purge_temporary_admin_password,
)
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)


async def POST(request: Request, instance_name: str):
    """Purge the temporary admin onboarding password for a compute instance."""
    user = get_current_user(request)

    db_record = None
    try:
        with get_session() as db_session:
            db_record = get_compute_instance_by_name(db_session, instance_name)

            if not db_record:
                raise HTTPException(status_code=404, detail="Instance not found in local database")

            if db_record.created_by_user_id != user.id:
                raise HTTPException(status_code=403, detail="Forbidden: You do not own this compute instance")

            if not db_record.temporary_admin_password:
                return {"message": "No onboarding password to purge", "purged": False}

            success = purge_temporary_admin_password(db_session, instance_name)

            return {"message": "Onboarding password purged successfully", "purged": success}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to purge password for instance {instance_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to purge password: {str(e)}")
    finally:
        db_record = None
        try:
            del db_record
        except NameError:
            pass
