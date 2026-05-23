from fastapi import Request

async def index(request: Request):
    return {}


def meta_data():
    return {
        "title": "VM Instance Details - CloudOps",
        "description": "Inspect and manage a live Google Cloud VM instance.",
    }
