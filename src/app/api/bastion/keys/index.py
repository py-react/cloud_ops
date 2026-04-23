from fastapi import Request
from pydantic import BaseModel
from typing import Optional, List
from app.db_client.db import get_session
from app.db_client.models.ssh_management import SSHKey, System
from app.bastion_helper import BastionManager
from app.utils.crypto import decrypt as fernet_decrypt
from sqlmodel import select

class KeyCreate(BaseModel):
    name: str
    user_id: str
    public_key: Optional[str] = None # If provided, store it. If not, generate a new pair.

async def GET(request: Request):
    """List all SSH keys"""
    with get_session() as db:
        statement = select(SSHKey)
        keys = db.exec(statement).all()
        return {"error": False, "keys": [k.dict() for k in keys]}

async def POST(request: Request, body: KeyCreate):
    """Add or generate a new SSH key"""
    public_key = body.public_key
    private_key = None
    
    if not public_key:
        # Generate a new pair
        private_key, public_key = BastionManager.generate_key_pair()

    with get_session() as db:
        new_key = SSHKey(
            name=body.name,
            public_key=public_key,
            user_id=body.user_id,
            is_active=True
        )
        db.add(new_key)
        db.commit()
        db.refresh(new_key)
        
        response = {"error": False, "key": new_key.dict()}
        if private_key:
            response["private_key"] = private_key # Only returned once during generation
            
        return response

async def DELETE(request: Request):
    """Universally revoke an SSH key from all reachable servers and delete from database."""
    key_id = request.query_params.get("id")
    if not key_id:
        return {"error": True, "message": "Key ID required"}
        
    with get_session() as db:
        key_target = db.get(SSHKey, int(key_id))
        if not key_target:
            return {"error": True, "message": "Key not found"}
            
        if key_target.user_id == "bastion-service":
            return {"error": True, "message": "Cannot delete the core Bastion Platform Service Key"}

        systems = db.exec(select(System)).all()
        priv_key, _, _ = BastionManager.get_or_create_service_key()
        
        # Comprehensive revocation sweep
        failed_nodes = []
        for system in systems:
            # Reconstruct authentication payload logic securely
            plain_pass = None
            if system.password:
                try:
                    plain_pass = fernet_decrypt(system.password)
                except Exception:
                    plain_pass = system.password
                    
            try:
                BastionManager.revoke_public_key(
                    system_ip=system.ip_address,
                    public_key=key_target.public_key,
                    user=system.username or "root",
                    password=plain_pass,
                    bootstrap_private_key=priv_key if system.service_key_deployed else None
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Sweep failure on {system.name} ({system.ip_address}): {e}")
                failed_nodes.append(system.name)
                # We catch errors to deliberately prevent one offline server from blocking the global destruction flow
                pass
                
        db.delete(key_target)
        db.commit()
        
        return {
            "error": False, 
            "message": "Key securely deleted from database.",
            "sweep_status": "Complete",
            "unreachable_nodes": failed_nodes,
            "id": key_target.id
        }
