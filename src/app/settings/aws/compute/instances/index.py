from fastapi import Request

async def index(request: Request):
    return {}


def meta_data():
    return {
        "title": "EC2 Instance Details - CloudOps",
        "description": "Inspect and manage a live AWS EC2 instance.",
    }
