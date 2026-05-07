from fastapi import WebSocket, WebSocketDisconnect
from app.services.notification_manager import NotificationManager

async def index(websocket: WebSocket):
    manager = NotificationManager()
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
