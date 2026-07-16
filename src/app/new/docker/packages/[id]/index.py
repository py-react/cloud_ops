from fastapi import Request

async def meta_data():
    return {
        "title": "Package Details - V2",
    }

async def index(request: Request):
    return {}
