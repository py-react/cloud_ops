import asyncio
import logging
import os
import socket as socket_module
from fastapi import WebSocket, WebSocketDisconnect
from app.db_client.db import get_session
from app.db_client.models.ssh_management import System
from app.utils.crypto import decrypt as fernet_decrypt
from guacamole.client import GuacamoleClient
from guacamole.exceptions import GuacamoleError
from guacamole.instruction import GuacamoleInstruction as GuacInstruction

logger = logging.getLogger(__name__)

logging.getLogger("guacamole.client").setLevel(logging.WARNING)

GUACD_HOST = os.getenv("GUACD_HOST", "localhost")
GUACD_PORT = int(os.getenv("GUACD_PORT", "4822"))

HANDSHAKE_TIMEOUT = 20

def _send_raw_instruction(sock, opcode, *args):
    parts = [f"{len(opcode)}.{opcode}"]
    for arg in args:
        s = str(arg)
        parts.append(f"{len(s)}.{s}")
    sock.sendall(f"{','.join(parts)};".encode())

def _recv_raw_instruction(sock):
    buf = b""
    while True:
        chunk = sock.recv(4096)
        if not chunk:
            return None
        buf += chunk
        if buf.endswith(b";"):
            return GuacInstruction.load(buf.decode())

async def _send_guac_error(websocket: WebSocket, message: str, code: int = 512):
    try:
        error_msg = f"5.error,{len(message)}.{message},{len(str(code))}.{code};"
        await websocket.send_text(error_msg)
    except Exception:
        pass

async def _wait_for_disconnect(websocket: WebSocket):
    """Keep the connection alive until the client disconnects."""
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

async def rdp_websocket(websocket: WebSocket, session_id: str, payload: dict):
    # Extract dynamic dimensions from the React frontend
    client_width = str(payload.get("width", 1024))
    client_height = str(payload.get("height", 768))
    
    guac_client = None
    loop = asyncio.get_event_loop()
    
    try:
        system_id = payload.get("system_id")
        
        with get_session() as db:
            system = db.get(System, system_id)
            if not system:
                await _send_guac_error(websocket, "System not found", 516)
                await _wait_for_disconnect(websocket)
                return
            
            if system.connection_type != "rdp":
                await _send_guac_error(websocket, "System is not configured for RDP", 515)
                await _wait_for_disconnect(websocket)
                return
            
            password = None
            if system.password:
                try:
                    password = fernet_decrypt(system.password)
                except Exception:
                    password = None

        ip = system.ip_address
        port = str(system.connection_port or 3389)
        username = system.username or "Administrator"
        pw = password or ""
        logger.info(f"RDP connection: system_id={system_id}, name={system.name}, ip={ip}, port={port}, username={username}, has_password={bool(pw)}")
        
        # Custom handshake with proper error handling
        guac_client = GuacamoleClient(GUACD_HOST, GUACD_PORT)
        sock = guac_client.client
        sock.settimeout(HANDSHAKE_TIMEOUT)
        
        # 1. select rdp
        _send_raw_instruction(sock, "select", "rdp")
        instruction = await loop.run_in_executor(None, _recv_raw_instruction, sock)
        if not instruction or instruction.opcode != "args":
            await _send_guac_error(websocket, "guacd did not respond with connection args", 513)
            await _wait_for_disconnect(websocket)
            return
        
        # 2. size, audio, video, image
        _send_raw_instruction(sock, "size", client_width, client_height, "96")
        _send_raw_instruction(sock, "video")
        _send_raw_instruction(sock, "image")
        
        # 3. connect with system details
        conn_args_raw = instruction.args
        
        is_windows_core = system.os_type == "windows-core"
        
        kw = {
            "hostname": ip,
            "port": port,
            "username": username,
            "password": pw,
            "ignore_cert": "true",
            "security": "tls",
            # DYNAMIC GEOMETRY: Feed the exact React viewport dimensions to FreeRDP
            "width": client_width,
            "height": client_height,
            "dpi": "96",
            # Disable caching for Server Core to prevent rendering freezes
            "disable_bitmap_caching": "true" if is_windows_core else "false",
            "disable_offscreen_caching": "true" if is_windows_core else "false",
            "disable_glyph_caching": "true" if is_windows_core else "false",
            "color_depth": "32" if is_windows_core else "24",
            # CRITICAL FIX: Guacamole disables wallpaper and composition by default.
            # On Server Core, these MUST be enabled to allow the GDI pipe to paint the window.
            "enable_wallpaper": "true",
            "enable_theming": "true",
            "enable_desktop_composition": "true",
        }
        conn_args = [kw.get(arg.replace("-", "_"), "") for arg in conn_args_raw]
        logger.info(f"[RDP] connection args: {conn_args}")
        _send_raw_instruction(sock, "connect", *conn_args)
        
        # 4. Check response — must be "ready", could be "error"
        instruction = await loop.run_in_executor(None, _recv_raw_instruction, sock)
        logger.info(f"[RDP] instruction: {instruction}, opcode: {instruction.opcode}")
        if not instruction:
            await _send_guac_error(websocket, "guacd connection lost during handshake", 513)
            await _wait_for_disconnect(websocket)
            return
        
        if instruction.opcode == "error":
            reason = instruction.args[0] if instruction.args else "Unknown error"
            code = instruction.args[1] if len(instruction.args) > 1 else "0"
            await _send_guac_error(websocket, reason, code)
            await _wait_for_disconnect(websocket)
            return
        
        if instruction.opcode != "ready":
            await _send_guac_error(websocket, f"Unexpected handshake response: {instruction.opcode}", 513)
            await _wait_for_disconnect(websocket)
            return
        
        guac_client._id = instruction.args[0] if instruction.args else None
        logger.info(f"[RDP] guac_client._id: {guac_client._id}")
        guac_client.connected = True
        
        # Restore longer timeout for proxying
        sock.settimeout(None)
        
        closed = False

        async def read_from_guacd():
            nonlocal closed
            try:
                while True:
                    data = await loop.run_in_executor(None, guac_client.receive)
                    if not data:
                        break
                    if closed:
                        break
                    try:
                        logger.info(f'from guacd: {data}')
                        await websocket.send_text(data)
                    except WebSocketDisconnect:
                        closed = True
                        break
            except Exception:
                pass
        
        async def read_from_websocket():
            nonlocal closed
            try:
                while True:
                    data = await websocket.receive_text()
                    if guac_client:
                        await loop.run_in_executor(None, guac_client.send, data)
            except WebSocketDisconnect:
                closed = True
        
        read_guacd = asyncio.create_task(read_from_guacd())
        read_ws = asyncio.create_task(read_from_websocket())
        
        await asyncio.gather(read_guacd, read_ws, return_exceptions=True)
        
    except WebSocketDisconnect:
        pass
    except socket_module.timeout as e:
        await _send_guac_error(websocket, f"Connection timed out: {e}", 513)
    except GuacamoleError as e:
        await _send_guac_error(websocket, str(e), 514)
    except Exception as e:
        logger.error(f"RDP WebSocket error: {e}")
        await _send_guac_error(websocket, f"RDP connection failed: {e}")
    finally:
        if guac_client:
            try:
                guac_client.close()
            except Exception:
                pass
