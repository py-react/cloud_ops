from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Integer, ForeignKey
from typing import Optional, List, Dict, Any

class K8sService(SQLModel, table=True):
    """Service definition linking profiles."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(description="Name of the service definition")
    namespace: str = Field(description="Namespace scope")
    
    # Foreign key to metadata profile
    metadata_profile_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("k8sservicemetadataprofile.id", ondelete="SET NULL"))
    )
    
    # Foreign key to selector profile
    selector_profile_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("k8sserviceselectorprofile.id", ondelete="SET NULL"))
    )
    
    # Dynamic attributes - maps profile type to profile ID (for potential future extensibility)
    dynamic_attr: Dict[str, int] = Field(
        default={},
        sa_column=Column(JSONB),
        description="Maps profile type to K8sServiceProfile ID or other attributes"
    )
