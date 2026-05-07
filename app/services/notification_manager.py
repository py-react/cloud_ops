import asyncio
import json
from typing import Dict, List, Any
from fastapi import WebSocket

class NotificationManager:
    _instance = None
    _active_connections: List[WebSocket] = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(NotificationManager, cls).__new__(cls)
        return cls._instance

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self._active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self._active_connections:
            self._active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast a message to all connected clients."""
        disconnected = []
        for connection in self._active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn)

# Global helper for background tasks (since they run outside the request loop)
def send_notification(message: Dict[str, Any]):
    manager = NotificationManager()
    # We use asyncio.run_coroutine_threadsafe or similar if needed, 
    # but BackgroundTasks run in the same event loop for async functions.
    loop = asyncio.get_event_loop()
    if loop.is_running():
        asyncio.create_task(manager.broadcast(message))
    else:
        asyncio.run(manager.broadcast(message))
