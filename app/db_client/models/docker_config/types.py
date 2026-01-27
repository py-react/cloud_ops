from pydantic import BaseModel
from typing import Optional

class DockerConfigType(BaseModel):
    name: str
    base_url: str
    client_cert: Optional[str] = None
    client_key: Optional[str] = None
    ca_cert: Optional[str] = None
    verify: Optional[bool] = True
    status: Optional[str] = "active"
