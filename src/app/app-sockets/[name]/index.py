
from fastapi import WebSocket

async def index(websocket: WebSocket,name:str):
    await websocket.accept()
    await websocket.send_text(f"Echo: {name}")