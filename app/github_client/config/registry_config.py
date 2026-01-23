from dataclasses import dataclass
from typing import Optional, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)


@dataclass
class RegistryConfig:
    url: str
    username: Optional[str] = None
    password: Optional[str] = None
    priority: int = 1


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
            priority=1
        ))
    
    return sorted(registries, key=lambda r: r.priority)
