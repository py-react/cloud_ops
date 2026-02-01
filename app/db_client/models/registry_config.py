from typing import Optional, Dict, Any
from sqlmodel import Field, SQLModel
from datetime import datetime
import json

class RegistryConfig(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    url: str
    username: Optional[str] = None
    password: Optional[str] = None
    is_remote: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    config_json: Optional[str] = Field(default="{}", description="JSON string for extra config")

    @property
    def config(self) -> Dict[str, Any]:
        return json.loads(self.config_json or "{}")

    @config.setter
    def config(self, value: Dict[str, Any]):
        self.config_json = json.dumps(value)
