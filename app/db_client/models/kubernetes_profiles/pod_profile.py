from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, Dict, Any

class K8sPodProfile(SQLModel, table=True):
    """Profile for pod-level configurations like restart policy, service account, etc."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(description="Name of the profile")
    type: str = Field(description="Type of this reusable pod profile")
    namespace: str = Field(description="Namespace scope")
    config: Dict[str, Any] = Field(sa_column=Column(JSONB))
