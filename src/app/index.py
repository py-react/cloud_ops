from fastapi import Request

async def meta_data():
    return {
        "title": "Dashboard",
    }

async def index(request:Request):
    return {
    }