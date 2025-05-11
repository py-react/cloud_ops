from fastapi import Request

async def meta_data():
    return {
        "title": "Infra",
    }

async def index(request:Request):
    return {
    }