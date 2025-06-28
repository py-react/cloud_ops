from fastapi import Request
from pydantic import BaseModel

class DeploymentStrategy(BaseModel):
    id: int
    type: str
    description: str

# Example strategies - in a real app, this would come from a database
STRATEGIES = [
    DeploymentStrategy(
        id=1,
        type="rolling",
        description="Rolling update strategy that gradually replaces old pods with new ones"
    ).model_dump_json(),
    DeploymentStrategy(
        id=2,
        type="blue-green",
        description="Deploy new version (green) alongside old version (blue), then switch traffic"
    ).model_dump_json(),
    DeploymentStrategy(
        id=3,
        type="canary",
        description="Release to a subset of users before full rollout"
    ).model_dump_json(),
    DeploymentStrategy(
        id=4,
        type="recreate",
        description="Terminate all existing pods before creating new ones"
    ).model_dump_json()
]

async def index(request: Request):
    return {"strategies":STRATEGIES}