from fastapi import Request
from render_relay.utils.get_logger import get_logger

logger = get_logger("Index")

async def meta_data():
    return {
        "title": "Dashboard",
    }

async def index(request:Request):
    return {
    }
