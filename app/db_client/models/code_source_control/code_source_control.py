from sqlmodel import SQLModel, Field
from typing import Optional

class CodeSourceControl(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    pat_id: Optional[int] = Field(default=None, foreign_key="integrationcredential.id")
    registry_id: Optional[int] = Field(default=None, foreign_key="registryconfig.id")
    docker_config_id: Optional[int] = Field(default=None, foreign_key="dockerconfig.id")
    status: Optional[str] = Field(default="active")
    polling_enabled: bool = Field(default=False)