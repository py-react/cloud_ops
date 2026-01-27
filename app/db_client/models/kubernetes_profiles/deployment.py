from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Integer, ForeignKey
from typing import Optional, List, Dict, Any

class K8sDeployment(SQLModel, table=True):
    """Deployment definition linking pods, selectors, and settings."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(description="Name of the deployment definition")
    namespace: str = Field(description="Namespace scope")
    kind: str = Field(default="Deployment", description="Kubernetes Resource Kind: Deployment, StatefulSet, ReplicaSet")
    
    replicas: Optional[int] = Field(default=1)
    min_ready_seconds: Optional[int] = Field(default=None)
    revision_history_limit: Optional[int] = Field(default=None)
    progress_deadline_seconds: Optional[int] = Field(default=None)
    paused: Optional[bool] = Field(default=False)

    # Foreign key to selector profile
    selector_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("k8sdeploymentselectorprofile.id", ondelete="SET NULL"))
    )
    
    # Foreign key to pod specification
    pod_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("k8spod.id", ondelete="SET NULL"))
    )
    
    # Dynamic attributes - maps profile type to profile ID
    dynamic_attr: Dict[str, int] = Field(
        default={},
        sa_column=Column(JSONB),
        description="Maps profile type to K8sDeploymentProfile ID"
    )
