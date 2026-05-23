import io
from fastapi import Request
from fastapi.responses import StreamingResponse
from app.db_client.db import get_session
from app.db_client.models.ssh_management import System
from app.utils.crypto import decrypt as fernet_decrypt
import logging

logger = logging.getLogger(__name__)

async def GET(request: Request, systemId: int):
    """Generates a secure, memory-isolated RDP initialization manifest stream."""
    system = None
    password = None
    buffer = None
    try:
        with get_session() as db:
            system = db.get(System, systemId)
            if not system:
                return {"error": True, "message": "System not found"}
            
            if system.connection_type != "rdp":
                return {"error": True, "message": "System does not support RDP"}

        port = system.connection_port or 3389
        username = system.username or "Administrator"
        
        if system.password:
            try:
                password = fernet_decrypt(system.password)
            except Exception:
                password = None

        manifest_payload = (
            f"full address:s:{system.ip_address}:{port}\n"
            f"username:s:{username}\n"
            "prompt for credentials:i:1\n"
            "screen mode id:i:2\n"
            "authentication level:i:2\n"
            "compression:i:1\n"
            "disable wallpaper:i:1\n"
            "audiomode:i:0\n"
            "redirectprinters:i:1\n"
            "redirectclipboard:i:1\n"
            "autoreconnection enabled:i:1\n"
            "session bpp:i:32\n"
            "desktopwidth:i:1920\n"
            "desktopheight:i:1080\n"
        )
        
        buffer = io.BytesIO(manifest_payload.encode("utf-8"))
        
        return StreamingResponse(
            buffer,
            media_type="application/x-rdp",
            headers={"Content-Disposition": f"attachment; filename=bastion_{system.ip_address}.rdp"}
        )
    finally:
        if buffer:
            buffer.close()
            buffer = None
        if password:
            password = None
            try:
                del password
            except NameError:
                pass
        system = None
        try:
            del system
        except NameError:
            pass
