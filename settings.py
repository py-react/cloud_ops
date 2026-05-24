import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    JWT_SECRET: str
    SESSION_TTL: int
    AWS_ENDPOINT_URL: str
    model_config = SettingsConfigDict(env_file=".env",env_file_encoding="utf-8",
        extra="ignore")

env = Settings()


NAME="app"
VERSION="1.0"
PACKAGE_MANAGER="npm"
DEBUG=True
PORT="5002"
HOST="0.0.0.0"
PYTHONDONTWRITEBYTECODE=""
CWD=os.path.dirname(os.path.abspath(__file__))
STATIC_SITE=False
TYPESCRIPT=True
TAILWIND=True
LOG_LEVEL="DEBUG"
UVICORN_WORKERS="1"

GOOGLE_CLIENT_ID=env.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=env.GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=env.GOOGLE_REDIRECT_URI
JWT_SECRET=env.JWT_SECRET
SESSION_TTL=env.SESSION_TTL

# Optional: Redis configuration
# REDIS_URL="redis://localhost:6379/0"

# Optional: Docker configuration
# DOCKER_MAX_IMAGE_AGE_HOURS = "24"
# DOCKER_BUILD_TIMEOUT_SECONDS = "600"
# DOCKER_MAX_CONCURRENT_BUILDS = "5"