from sqlmodel import SQLModel, Field, Column
from sqlalchemy.dialects.postgresql import BOOLEAN, DATE, INTEGER
from typing import Optional
from datetime import date

class DockerConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    base_url: str = Field()
    client_cert: Optional[str] = Field(default=None)
    client_key: Optional[str] = Field(default=None)
    ca_cert: Optional[str] = Field(default=None)
    verify: bool = Field(default=True, sa_column=Column(BOOLEAN))
    status: str = Field(default="active")
    
    soft_delete: bool = Field(default=False, sa_column=Column(BOOLEAN))
    deleted_at: Optional[date] = Field(default=None, sa_column=Column(DATE))
