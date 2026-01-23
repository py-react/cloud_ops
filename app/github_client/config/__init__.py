"""
Configuration module for GitHub client.

This module provides configuration for polling, Docker, and registry settings.
"""

from .polling_config import get_polling_config
from .constants import WELCOME_MESSAGES, BUILD_MESSAGES
from .docker_config import load_docker_config
from .registry_config import load_registries, RegistryConfig

__all__ = [
    "get_polling_config",
    "WELCOME_MESSAGES",
    "BUILD_MESSAGES",
    "load_docker_config",
    "load_registries",
    "RegistryConfig",
]
