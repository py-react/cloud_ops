from fastapi import Request, BackgroundTasks
from app.bastion_helper import BastionManager

async def POST(request: Request, background_tasks: BackgroundTasks):
    """Rotate the core Bastion Platform Service Key and auto-reprovision target systems"""
    try:
        # 1. Get the OLD key before rotating
        old_private_key, _, _ = BastionManager.get_or_create_service_key()
        
        # 2. Perform rotation
        new_private_key, new_public_key = BastionManager.rotate_service_key()
        
        # 3. Schedule re-provisioning sweep in the background
        background_tasks.add_task(BastionManager.reprovision_all_systems, old_private_key, new_public_key)
        
        return {
            "error": False,
            "message": "Bastion Service Identity Key rotated. Re-provisioning sweep started in background.",
            "public_key": new_public_key
        }
    except Exception as e:
        return {"error": True, "message": f"Rotation failed: {str(e)}"}
