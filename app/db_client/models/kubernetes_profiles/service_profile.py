from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, Dict, Any

class K8sServiceProfile(SQLModel, table=True):
    """Profile for service-level configurations like type, ports, IP settings."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(description="Name of the profile")
    type: str = Field(description="Type of this reusable service profile") # e.g., 'ClusterIP', 'LoadBalancer' etc. though sticking to generic 'service_profile' type string might be better, but user likely wants 'type' field to mean the Profile Type in the context of library management, or the K8s Service Type? 
    # Usually 'type' in these profiles is just a string tag for the profile category. The actual K8s Type (ClusterIP) is inside 'config'.
    
    namespace: str = Field(description="Namespace scope")
    config: Dict[str, Any] = Field(sa_column=Column(JSONB)) # Stores type, ports, clusterIP, etc.
