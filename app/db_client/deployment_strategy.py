
from pydantic import BaseModel

class DeploymentStrategy(BaseModel):
    id: int
    type: str
    description: str

STRATEGIES = [
    DeploymentStrategy(
        id=1,
        type="rolling",
        description="Rolling update strategy that gradually replaces old pods with new ones"
    ),
    DeploymentStrategy(
        id=2,
        type="blue-green",
        description="Deploy new version (green) alongside old version (blue), then switch traffic"
    ),
    DeploymentStrategy(
        id=3,
        type="canary",
        description="Release to a subset of users before full rollout"
    ),
    DeploymentStrategy(
        id=4,
        type="recreate",
        description="Terminate all existing pods before creating new ones"
    )
]