import os
from cryptography.fernet import Fernet
import logging

logger = logging.getLogger(__name__)

from render_relay.utils import load_settings

# File to store the encryption key if not in settings
KEY_FILE = "secret.key"

def _load_key():
    """Load the key from settings or generate/load from file"""
    try:
        settings = load_settings()
        # Try specific key first, then fallback to shared key
        key = settings.get("REGISTRY_ENCRYPTION_KEY") or settings.get("GITHUB_PAT_ENCRYPTION_KEY")
        if key:
            # Fernet expects bytes
            if isinstance(key, str):
                return key.encode()
            return key
    except Exception as e:
        logger.warning(f"Could not load key from settings: {e}")

    # Fallback to local file
    if os.path.exists(KEY_FILE):
        with open(KEY_FILE, "rb") as key_file:
            return key_file.read()
    else:
        logger.info("Generating new local encryption key")
        key = Fernet.generate_key()
        with open(KEY_FILE, "wb") as key_file:
            key_file.write(key)
        return key

try:
    _key = _load_key()
    _cipher_suite = Fernet(_key)
except Exception as e:
    logger.error(f"Failed to initialize encryption: {e}")
    _cipher_suite = None

def encrypt(text: str) -> str:
    """Encrypts a plain text string."""
    if not text:
        return text
    if not _cipher_suite:
        logger.warning("Encryption not initialized, returning text as-is")
        return text
    try:
        # Fernet encrypt expects bytes, returns bytes
        return _cipher_suite.encrypt(text.encode()).decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        return text

def decrypt(text: str) -> str:
    """Decrypts a cipher text string."""
    if not text:
        return text
    if not _cipher_suite:
        return text
    try:
        # Fernet decrypt expects bytes
        return _cipher_suite.decrypt(text.encode()).decode()
    except Exception as e:
        logger.debug(f"Decryption failed (possibly not encrypted?): {e}")
        return text
