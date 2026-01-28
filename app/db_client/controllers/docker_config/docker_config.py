from sqlmodel import Session, select
from app.db_client.models.docker_config.docker_config import DockerConfig
from app.db_client.models.docker_config.types import DockerConfigType
from typing import List, Optional
from datetime import datetime

from app.utils.get_fernet import get_fernet
import json

def _get_encryption():
    return get_fernet()

def _encrypt_val(val: Optional[str]) -> Optional[str]:
    if not val:
        return val
    fernet = _get_encryption()
    if not fernet:
        return val
    return fernet.encrypt(val.encode()).decode()

def _decrypt_val(val: Optional[str]) -> Optional[str]:
    if not val:
        return val
    fernet = _get_encryption()
    if not fernet:
        return val
    try:
        return fernet.decrypt(val.encode()).decode()
    except:
        return val # Fallback to plaintext if decryption fails

def create_docker_config(session: Session, data: DockerConfigType) -> DockerConfig:
    config = DockerConfig(
        name=data.name,
        base_url=data.base_url,
        client_cert=_encrypt_val(data.client_cert),
        client_key=_encrypt_val(data.client_key),
        ca_cert=_encrypt_val(data.ca_cert),
        verify=data.verify if data.verify is not None else True, # Reverted to original logic for verify
        status=data.status or "active" # Reverted to original logic for status
    )
    session.add(config)
    session.commit()
    session.refresh(config)
    return config

def list_docker_configs(session: Session) -> List[DockerConfig]:
    statement = select(DockerConfig).where(DockerConfig.soft_delete == False)
    configs = session.exec(statement).all()
    # Mask contents for list view? Or decrypt? 
    # Usually for list view we might want to know if it's present but not the content
    for c in configs:
        c.client_cert = "PRESENT" if c.client_cert else None
        c.client_key = "PRESENT" if c.client_key else None
        c.ca_cert = "PRESENT" if c.ca_cert else None
    return configs

def get_docker_config(session: Session, id: int) -> Optional[DockerConfig]:
    config = session.get(DockerConfig, id)
    if config and not config.soft_delete:
        config.client_cert = _decrypt_val(config.client_cert)
        config.client_key = _decrypt_val(config.client_key)
        config.ca_cert = _decrypt_val(config.ca_cert)
        return config
    return None

def update_docker_config(session: Session, id: int, data: DockerConfigType) -> Optional[DockerConfig]:
    config = session.get(DockerConfig, id)
    if not config or config.soft_delete:
        return None
    
    if data.name is not None:
        config.name = data.name
    if data.base_url is not None:
        config.base_url = data.base_url
    
    # Only update certs if they are provided (not "PRESENT" mask or empty)
    if data.client_cert and data.client_cert != "PRESENT":
        config.client_cert = _encrypt_val(data.client_cert)
    elif data.client_cert == "": # Handle clearing
        config.client_cert = None
        
    if data.client_key and data.client_key != "PRESENT":
        config.client_key = _encrypt_val(data.client_key)
    elif data.client_key == "":
        config.client_key = None
        
    if data.ca_cert and data.ca_cert != "PRESENT":
        config.ca_cert = _encrypt_val(data.ca_cert)
    elif data.ca_cert == "":
        config.ca_cert = None
        
    if data.verify is not None:
        config.verify = data.verify
    if data.status is not None:
        config.status = data.status
        
    session.add(config)
    session.commit()
    session.refresh(config)
    return config

def delete_docker_config(session: Session, id: int) -> bool:
    obj = session.get(DockerConfig, id)
    if not obj:
        return False
    obj.soft_delete = True
    obj.deleted_at = datetime.utcnow().date()
    session.add(obj)
    session.commit()
    return True
