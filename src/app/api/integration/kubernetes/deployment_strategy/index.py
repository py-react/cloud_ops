from fastapi import Request
from pydantic import BaseModel
from app.db_client.deployment_strategy import STRATEGIES

async def GET(request: Request):
    return {"strategies": [s.model_dump() for s in STRATEGIES]}
