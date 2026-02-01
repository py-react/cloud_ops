from dataclasses import dataclass
from typing import Optional, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)


@dataclass
class RegistryConfig:
    url: str
    id: Optional[int] = None
    name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    priority: int = 1
    is_remote: bool = True
    config: Dict[str, Any] = None

    def __post_init__(self):
        if self.config is None:
            self.config = {}


from app.db_client.models.registry_config import RegistryConfig as DBRegistryConfig
from app.db_client.db import get_session
from sqlmodel import select

def load_registries(settings: Dict[str, Any]) -> list[RegistryConfig]:
    """
    Load multiple registries from settings.
    
    Supports:
    - Single registry: REGISTRY_HOST="registry.example.com"
    - Multiple: REGISTRY_CONFIGS='[{"url":"reg1.com","priority":1},{"url":"reg2.com","priority":2}]'
    
    Args:
        settings: Dictionary of settings
        
    Returns:
        List of RegistryConfig sorted by priority
    """
    registries = []
    
    if 'REGISTRY_CONFIGS' in settings and settings['REGISTRY_CONFIGS']:
        try:
            registry_configs = json.loads(settings['REGISTRY_CONFIGS'])
            for config in registry_configs:
                registries.append(RegistryConfig(
                    url=config['url'],
                    username=config.get('username'),
                    password=config.get('password'),
                    priority=config.get('priority', 1)
                ))
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse REGISTRY_CONFIGS: {e}")
    
    elif 'REGISTRY_HOST' in settings and settings['REGISTRY_HOST']:
        registries.append(RegistryConfig(
            url=settings['REGISTRY_HOST'],
            name="default",
            priority=1
        ))
    
    # Also load from database
    try:
        with get_session() as session:
            db_registries = session.exec(select(DBRegistryConfig)).all()
            for db_reg in db_registries:
                # Avoid duplicates by URL
                if any(r.url == db_reg.url for r in registries):
                    continue
                    
                registries.append(RegistryConfig(
                    url=db_reg.url,
                    id=db_reg.id,
                    name=db_reg.name,
                    username=db_reg.username,
                    password=db_reg.password, # Note: this might be encrypted, but RegistryManager should handle it
                    priority=db_reg.id + 10, # Lower priority than settings
                    is_remote=db_reg.is_remote,
                    config=db_reg.config
                ))
    except Exception as e:
        logger.warning(f"Failed to load registries from database: {e}")
    
    return sorted(registries, key=lambda r: r.priority)
