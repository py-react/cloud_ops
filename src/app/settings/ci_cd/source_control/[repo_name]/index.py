from fastapi import Request

async def index(request: Request):
    return {"message": "Hello, World!"}