import os
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class GitHubAppConfig(BaseModel):
    """Configuration for GitHub App settings."""
    app_id: int = Field(..., description="GitHub App ID")
    private_key_path: str = Field(..., description="Path to the private key file")
    installation_id: Optional[int] = Field(None, description="Optional installation ID")
    
    @field_validator('private_key_path')
    @classmethod
    def validate_private_key_path(cls, v):
        if not os.path.exists(v):
            raise ValueError(f"Private key file not found: {v}")
        return v
    
    @field_validator('app_id')
    @classmethod
    def validate_app_id(cls, v):
        if v <= 0:
            raise ValueError("App ID must be a positive integer")
        return v 