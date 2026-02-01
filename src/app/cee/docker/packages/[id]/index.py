from fastapi import Request

async def meta_data():
    return {
        "title": "Docker (Packges)",
    }


async def index(request:Request):
    return {}