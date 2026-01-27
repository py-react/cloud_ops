from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, Dict, Any

class K8sServiceSelectorProfile(SQLModel, table=True):
    """Profile for service selector configurations."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(description="Name of the profile")
    namespace: str = Field(description="Namespace scope")
    selector: Dict[str, str] = Field(sa_column=Column(JSONB)) # Stores matchLabels
