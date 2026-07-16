from fastapi import Request
from kiwijs.utils.get_logger import get_logger

logger = get_logger("Index")

async def meta_data():
    return {
        "title": "Infrastructure Overview",
    }

async def index(request:Request):
    return {
    }
