from enum import Enum
from typing import List
from pydantic import BaseModel

class ResourceInfo(BaseModel):
    name: str
    kind: str
    namespaced: bool
    api_version: str
    short_names: List[str]

class ClusterInfo(BaseModel):
    name: str
    platform: str
    version: str
    nodes_count: int
    pods_count: int
    running_pods: int
    namespaces_count: int

class ClusterMetric(BaseModel):
    cpu:int
    memory:int
    disk:int

class ResourceScope(Enum):
    NAMESPACED = "namespaced"
    CLUSTER = "cluster"
    ALL = "all" 