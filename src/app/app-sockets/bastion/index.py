import asyncio
import json
from fastapi import WebSocket, WebSocketDisconnect
from app.bastion_helper import BastionManager
from app.utils.audit_logger import AuditLogger
from app.db_client.db import get_session
from app.db_client.models.ssh_management import System
from sqlmodel import select
import paramiko

async def index(websocket: WebSocket, session_id: str):
    await websocket.accept()
    
    try:
        initial_data = await websocket.receive_json()
        system_id = initial_data.get("system_id")
        user_id = initial_data.get("user_id", "anonymous")
        
        with get_session() as db:
            system = db.get(System, system_id)
            if not system:
                await websocket.close(code=4004, reason="System not found")
                return

        audit_logger = AuditLogger(session_id, system_id, user_id)
        
        await BastionManager.handle_ssh_session(websocket, system, audit_logger)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Bastion WebSocket Error: {e}")
        await websocket.close(code=1011)
