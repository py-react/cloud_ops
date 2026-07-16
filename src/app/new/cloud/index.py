from fastapi import Request

async def meta_data():
    return {
        "title": "Cloud Resource Management",
    }

async def index(request: Request):
    return {}
