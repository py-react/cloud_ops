import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db_client.db import get_session
from app.db_client.models.ssh_management import System
from sqlmodel import select

with get_session() as session:
    systems = session.exec(select(System)).all()
    print(f"Total systems in DB: {len(systems)}")
    for s in systems:
        print(f"ID: {s.id}, Name: {s.name}, Provider: {s.provider}, Status: {s.status}, Service Key Deployed: {s.service_key_deployed}")
