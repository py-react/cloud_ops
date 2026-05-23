import logging
from app.utils.get_fernet import get_fernet

logger = logging.getLogger(__name__)

def encrypt(text: str) -> str:
    """Encrypts a plain text string."""
    if not text:
        return text
    
    f = get_fernet()
    if not f:
        logger.warning("Encryption not initialized, returning text as-is")
        raise Exception("Encryption not initialized")
    
    try:
        # Fernet encrypt expects bytes, returns bytes
        return f.encrypt(text.encode()).decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        raise e

def decrypt(text: str) -> str:
    """Decrypts a cipher text string."""
    if not text:
        return text
    
    f = get_fernet()
    if not f:
        raise Exception("Encryption not initialized")
    
    try:
        # Fernet decrypt expects bytes
        return f.decrypt(text.encode()).decode()
    except Exception as e:
        logger.debug(f"Decryption failed (possibly not encrypted?): {e}")
        raise e
