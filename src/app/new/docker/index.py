from fastapi import Request
from kiwijs.utils.get_logger import get_logger

logger = get_logger("DockerV2")

async def meta_data():
    return {
        "title": "Docker Management - V2",
    }

async def index(request: Request):
    return {}
