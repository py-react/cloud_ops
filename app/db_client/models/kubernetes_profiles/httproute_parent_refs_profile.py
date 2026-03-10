from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, Dict, Any

class K8sHTTPRouteParentRefsProfile(SQLModel, table=True):
    """Profile for HTTPRoute parentRefs (Gateway attachments)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(description="Name of the profile")
    type: str = Field(description="Type of this reusable parentRefs profile")
    namespace: str = Field(description="Namespace scope")
    config: Dict[str, Any] = Field(sa_column=Column(JSONB))
