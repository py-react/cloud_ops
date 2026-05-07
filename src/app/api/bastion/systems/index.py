from fastapi import Request, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from app.db_client.db import get_session
from app.db_client.models.ssh_management import System
from app.bastion_helper import BastionManager
from sqlmodel import select
import logging

logger = logging.getLogger(__name__)

# Import Fernet encrypt/decrypt — same pattern used by docker_config and github PATs
try:
    from app.utils.crypto import encrypt, decrypt
    ENCRYPTION_AVAILABLE = True
except Exception as e:
    logger.warning(f"Encryption not available — passwords will NOT be stored: {e}")
    ENCRYPTION_AVAILABLE = False


class SystemCreate(BaseModel):
    name: str
    hostname: str
    ip_address: str
    username: Optional[str] = "root"
    password: Optional[str] = None
    private_key: Optional[str] = None
    os_type: str = "linux"
    connection_type: str = "ssh"
    provider: Optional[str] = None


def _provision_service_key(system_id: int):
    """Background task: inject the Bastion service public key into the new system."""
    try:
        _, public_key, key_id = BastionManager.get_or_create_service_key()

        with get_session() as db:
            system = db.get(System, system_id)
            if not system:
                return

            # Decrypt password for the one-time bootstrap connection
            password = None
            if system.password:
                try:
                    password = decrypt(system.password) if ENCRYPTION_AVAILABLE else system.password
                except Exception:
                    password = system.password  # Already plain (legacy)

            BastionManager.deploy_public_key(
                system_ip=system.ip_address,
                public_key=public_key,
                user=system.username or "root",
                password=password,
            )

            system.service_key_deployed = True
            system.default_key_id = key_id  # Link system → its deployed key
            db.add(system)
            db.commit()
            logger.info(f"Service key (id={key_id}) deployed to system {system_id} ({system.name})")
    except Exception as e:
        logger.error(f"Auto-provisioning failed for system {system_id}: {e}")


async def GET(request: Request):
    """List all systems — never return passwords or private keys"""
    with get_session() as db:
        statement = select(System).where(System.status != "deleted")
        systems = db.exec(statement).all()
        result = []
        for s in systems:
            d = s.dict()
            d.pop("password", None)
            d.pop("private_key", None)
            result.append(d)
        return {"error": False, "systems": result}


async def POST(request: Request, body: SystemCreate, background_tasks: BackgroundTasks):
    """Register a new system. Password or Private Key is Fernet-encrypted before storage."""

    if not ENCRYPTION_AVAILABLE and (body.password or body.private_key):
        return {
            "error": True,
            "message": "Cannot store credentials: encryption key not configured."
        }

    encrypted_password = None
    if body.password:
        encrypted_password = encrypt(body.password) if ENCRYPTION_AVAILABLE else None

    encrypted_private_key = None
    if body.private_key:
        encrypted_private_key = encrypt(body.private_key) if ENCRYPTION_AVAILABLE else None

    with get_session() as db:
        new_system = System(
            name=body.name,
            hostname=body.hostname,
            ip_address=body.ip_address,
            username=body.username,
            password=encrypted_password,
            private_key=encrypted_private_key,
            os_type=body.os_type,
            connection_type=body.connection_type,
            provider=body.provider,
        )
        db.add(new_system)
        db.commit()
        db.refresh(new_system)
        system_id = new_system.id

    # Only provision if password is provided (Managed Key flow)
    # If private_key is provided, we skip bootstrap and use it directly for sessions
    will_provision = bool(body.password and not body.private_key and body.connection_type == "ssh")
    if will_provision:
        background_tasks.add_task(_provision_service_key, system_id)

    d = new_system.dict()
    d.pop("password", None)
    d.pop("private_key", None)
    return {
        "error": False,
        "system": d,
        "provisioning": will_provision,
    }
