from sqlmodel import SQLModel, Field
from typing import Optional
import uuid

class AddonPlugin(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(unique=True, index=True)
    display_name: str
    description: Optional[str] = None
    category: str
    icon_name: Optional[str] = "Box"
    helm_repo_url: str
    helm_repo_name: str
    helm_chart_name: str
    helm_version: Optional[str] = None
    namespace: str = "default"
    service_port: int = Field(default=80)
    default_values: Optional[str] = None # JSON string
    proxy_url: Optional[str] = None
    features: Optional[str] = None # JSON string
    is_system: bool = Field(default=False)
