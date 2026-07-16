import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db_client.db import get_session
from app.db_client.models.ssh_management import System, SSHKey
from sqlmodel import select

with get_session() as session:
    # Get the Bastion Service Identity Key
    key = session.exec(select(SSHKey).where(SSHKey.name == "Bastion Service Identity Key")).first()
    if not key:
        print("Bastion Service Identity Key not found in DB!")
        sys.exit(1)
        
    system = session.exec(select(System).where(System.id == 15)).first()
    if system:
        system.service_key_deployed = True
        system.default_key_id = key.id
        session.add(system)
        session.commit()
        print(f"Successfully updated system ID 15 ({system.name}) to service_key_deployed = True, default_key_id = {key.id}")
    else:
        print("System ID 15 not found!")
