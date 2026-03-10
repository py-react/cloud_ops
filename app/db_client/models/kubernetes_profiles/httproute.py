from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Integer, ForeignKey
from typing import Optional, Dict, Any

class K8sHTTPRoute(SQLModel, table=True):
    """HTTPRoute definition linking profiles."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(description="Name of the HTTPRoute definition")
    namespace: str = Field(description="Namespace scope")
    
    # Foreign key to metadata profile
    metadata_profile_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("k8shttproutemetadataprofile.id", ondelete="SET NULL"))
    )
    
    # Foreign key to rules profile
    rules_profile_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("k8shttprouterulesprofile.id", ondelete="SET NULL"))
    )

    # Foreign key to parentRefs profile
    parent_refs_profile_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("k8shttprouteparentrefsprofile.id", ondelete="SET NULL"))
    )

    # Foreign key to hostnames profile
    hostnames_profile_id: Optional[int] = Field(
        default=None,
        sa_column=Column(Integer, ForeignKey("k8shttproutehostnamesprofile.id", ondelete="SET NULL"))
    )
    
    hostnames: Optional[str] = Field(default=None, description="Comma-separated list of hostnames (Legacy/Direct)")
    
    # Dynamic attributes
    dynamic_attr: Dict[str, Any] = Field(
        default={},
        sa_column=Column(JSONB),
        description="Maps profile type to ID or other attributes"
    )
