from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import JSONB
from typing import Optional, List, Dict, Any

class K8sContainerProfile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(description="Name of this reusable profile")
    namespace: str = Field(description="Namespace scope")
    description: Optional[str] = Field(default=None)
    
    # Container Basic Specs
    image: Optional[str] = Field(default=None, description="Default image (can be overridden)")
    image_pull_policy: Optional[str] = Field(default="IfNotPresent")
    
    # Complex Fields (JSONB)
    command: Optional[List[str]] = Field(default=None, sa_column=Column(JSONB))
    args: Optional[List[str]] = Field(default=None, sa_column=Column(JSONB))
    working_dir: Optional[str] = Field(default=None)
    
    # Interactive Options
    tty: Optional[bool] = Field(default=False)
    stdin: Optional[bool] = Field(default=False)

    dynamic_attr: Dict[str, int] = Field(sa_column=Column(JSONB))
