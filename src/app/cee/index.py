from fastapi import Request

async def meta_data():
    return {
        "title": "CEE (Container Excecution Engine)",
    }

async def index(request:Request):
    return {
    }