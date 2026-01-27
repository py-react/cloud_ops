from sqlmodel import Session, select
from app.db_client.models.docker_config.docker_config import DockerConfig
from app.db_client.models.docker_config.types import DockerConfigType
from typing import List, Optional
from datetime import datetime

def create_docker_config(session: Session, data: DockerConfigType) -> DockerConfig:
    obj = DockerConfig(
        name=data.name,
        base_url=data.base_url,
        client_cert=data.client_cert,
        client_key=data.client_key,
        ca_cert=data.ca_cert,
        verify=data.verify if data.verify is not None else True,
        status=data.status or "active"
    )
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_docker_configs(session: Session) -> List[DockerConfig]:
    query = select(DockerConfig).where(DockerConfig.soft_delete == False)
    return session.exec(query).all()

def get_docker_config(session: Session, id: int) -> Optional[DockerConfig]:
    return session.get(DockerConfig, id)

def update_docker_config(session: Session, id: int, data: DockerConfigType) -> Optional[DockerConfig]:
    obj = session.get(DockerConfig, id)
    if not obj:
        return None
    
    if data.name is not None:
        obj.name = data.name
    if data.base_url is not None:
        obj.base_url = data.base_url
    if data.client_cert is not None:
        obj.client_cert = data.client_cert
    if data.client_key is not None:
        obj.client_key = data.client_key
    if data.ca_cert is not None:
        obj.ca_cert = data.ca_cert
    if data.verify is not None:
        obj.verify = data.verify
    if data.status is not None:
        obj.status = data.status
        
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete_docker_config(session: Session, id: int) -> bool:
    obj = session.get(DockerConfig, id)
    if not obj:
        return False
    obj.soft_delete = True
    obj.deleted_at = datetime.utcnow().date()
    session.add(obj)
    session.commit()
    return True
