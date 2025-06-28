from sqlmodel import SQLModel, create_engine, Session
import os
from sqlmodel import Session, select

# --- DB Engine and Session Management ---
POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "example")
POSTGRES_DB = os.getenv("POSTGRES_DB", "postgres")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "localhost")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
DATABASE_URL = (
    f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
)
engine = create_engine(DATABASE_URL, echo=True)

def get_session():
    with Session(engine) as session:
        yield session

# --- Import all models to register them with SQLModel ---
from .models import *

def run_migrations():
    SQLModel.metadata.create_all(engine)

DEFAULT_STRATEGIES = [
    {"id": 1, "name": "rolling", "description": "Rolling update strategy that gradually replaces old pods with new ones"},
    {"id": 2, "name": "blue-green", "description": "Deploy new version (green) alongside old version (blue), then switch traffic"},
    {"id": 3, "name": "canary", "description": "Release to a subset of users before full rollout"},
    {"id": 4, "name": "recreate", "description": "Terminate all existing pods before creating new ones"},
]

def ensure_default_strategies():
    session_ctx = get_session()
    session = next(session_ctx)
    for strat in DEFAULT_STRATEGIES:
        existing = session.exec(select(DeploymentStrategy).where(DeploymentStrategy.id == strat["id"])).first()
        if not existing:
            session.add(DeploymentStrategy(**strat))
    session.commit()
    session_ctx.close()

# Call this function once before you create any deployment configs
ensure_default_strategies()
# Call run_migrations() at startup (optional, or call from FastAPI startup event)
run_migrations()