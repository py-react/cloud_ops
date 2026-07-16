from fastapi import Request

async def meta_data():
    return {
        "title": "Docker Packages - V2",
    }

async def index(request: Request):
    return {}
