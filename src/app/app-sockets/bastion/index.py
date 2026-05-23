import asyncio
import json
import importlib.util
import os
from urllib.parse import unquote
from fastapi import WebSocket, WebSocketDisconnect
from app.bastion_helper import BastionManager
from app.utils.audit_logger import AuditLogger
from app.db_client.db import get_session
from app.db_client.models.ssh_management import System

async def index(websocket: WebSocket, session_id: str = ""):
    await websocket.accept()
    
    try:
        payload = None
        raw_query = websocket.url.query
        if raw_query:
            try:
                decoded = unquote(raw_query)
                payload = json.loads(decoded)
            except (json.JSONDecodeError, ValueError):
                payload = None

        if payload is None:
            try:
                payload = await websocket.receive_json()
            except Exception:
                payload = {}
                
        system_id = payload.get("system_id")
        action = payload.get("action", "ssh")
        user_id = payload.get("user_id", "anonymous")
        resolved_session_id = session_id or payload.get("session_id", "")
        
        print(f"[BASTION] payload=system_id={system_id}, action={action}, user_id={user_id}, session_id={resolved_session_id}, raw_query={raw_query}")
        
        with get_session() as db:
            system = db.get(System, system_id)
            if not system:
                await websocket.close(code=4004, reason="System not found")
                return

        audit_logger = AuditLogger(resolved_session_id, system_id, user_id)
        
        if action == "rdp" or system.connection_type == "rdp":
            rdp_path = os.path.join(os.path.dirname(__file__), "rdp.py")
            spec = importlib.util.spec_from_file_location("rdp_module", rdp_path)
            rdp_module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(rdp_module)
            await rdp_module.rdp_websocket(websocket, resolved_session_id, payload)
        else:
            await BastionManager.handle_ssh_session(websocket, system, audit_logger)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        error_msg = f"\r\n\x1b[31mBastion WebSocket Error: {str(e)}\x1b[0m\r\n"
        print(f"Bastion WebSocket Error: {e}")
        try:
            await websocket.send_text(error_msg)
        except Exception:
            pass
        await websocket.close(code=1011)
