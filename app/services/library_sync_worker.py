from app.services.library_version_manager import LibraryVersionManager
from app.services.notification_manager import send_notification
import logging

logger = logging.getLogger(__name__)

import asyncio

async def run_background_sync():
    """Background task to sync library changes to remote."""
    try:
        lvm = LibraryVersionManager()
        # push() handles rebase and detects conflicts. Run in thread to prevent blocking event loop.
        result = await asyncio.to_thread(lvm.push)
        
        if result.get("status") == "conflict":
            # Broadcast conflict to all users via WebSocket
            send_notification({
                "type": "GITOPS_CONFLICT",
                "title": "Merge Conflict Detected",
                "message": "Auto-sync failed due to conflicts with the remote repository. Manual resolution required.",
                "action_url": "/settings/charts",
                "files": result.get("files", [])
            })
        elif result.get("status") == "success":
             send_notification({
                "type": "GITOPS_SYNC_SUCCESS",
                "message": "Library successfully synchronized with GitHub."
            })
            
    except Exception as e:
        logger.error(f"Background sync failed: {e}")
        send_notification({
            "type": "GITOPS_SYNC_ERROR",
            "message": f"Background synchronization failed: {str(e)}"
        })
