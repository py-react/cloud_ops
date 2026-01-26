from fastapi import Request

async def meta_data():
    return {
        "title": "Docker",
    }

async def index(request:Request):
    # API refactored to granular actions. 
    # Frontend handles all data fetching on mount.
    return {}