from sqlmodel import SQLModel, Field, Column, Relationship
from sqlalchemy.dialects.postgresql import JSONB, ARRAY
from sqlalchemy import Integer, ForeignKey
from typing import Optional, List, Dict, Any

class K8sPod(SQLModel, table=True):
    """Pod definition with references to containers and profiles."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(description="Name of the pod definition")
    namespace: str = Field(description="Namespace scope")
    
    # Foreign key to metadata profile
    metadata_profile_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("k8spodmetadataprofile.id", ondelete="SET NULL"))
    )
    
    # List of container foreign keys (stored as JSON array of IDs)
    containers: List[int] = Field(
        default=[],
        sa_column=Column(JSONB),
        description="List of K8sContainerProfile IDs"
    )
    
    # Dynamic attributes - maps profile type to profile ID (same as container)
    dynamic_attr: Dict[str, int] = Field(
        default={},
        sa_column=Column(JSONB),
        description="Maps profile type to K8sPodProfile ID"
    )
