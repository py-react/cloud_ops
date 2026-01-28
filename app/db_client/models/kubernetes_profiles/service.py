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

    # Advanced Spec Fields (Instance-specific or overrides)
    type: Optional[str] = Field(default="ClusterIP", description="ClusterIP, NodePort, LoadBalancer, ExternalName")
    cluster_ip: Optional[str] = Field(default=None, description="Static IP for ClusterIP service")
    ip_family_policy: Optional[str] = Field(default=None, description="SingleStack, PreferDualStack, RequireDualStack")
    session_affinity: Optional[str] = Field(default=None, description="None, ClientIP")
    internal_traffic_policy: Optional[str] = Field(default=None, description="Cluster, Local")
    external_traffic_policy: Optional[str] = Field(default=None, description="Cluster, Local")
    publish_not_ready_addresses: Optional[bool] = Field(default=None)
    load_balancer_ip: Optional[str] = Field(default=None)
    health_check_node_port: Optional[int] = Field(default=None)
    allocate_load_balancer_node_ports: Optional[bool] = Field(default=None)
    load_balancer_class: Optional[str] = Field(default=None)
    external_name: Optional[str] = Field(default=None)
