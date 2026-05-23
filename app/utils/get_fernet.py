from cryptography.fernet import Fernet
import logging
from sqlmodel import Session, select
from app.db_client.db import engine
from app.db_client.models.service_settings import ServiceSetting

logger = logging.getLogger(__name__)

_FERNET_KEY_CACHE = None

def _get_or_create_db_key() -> bytes:
    """Loads the generic encryption key from the database, or generates it if missing."""
    with Session(engine) as session:
        setting = session.exec(select(ServiceSetting).where(ServiceSetting.key == "master_encryption_key")).first()
        
        if setting:
            return setting.value.encode()
            
        # Generate a new key since it doesn't exist
        logger.info("Generating new master encryption key and storing in database.")
        new_key = Fernet.generate_key()
        
        new_setting = ServiceSetting(
            key="master_encryption_key",
            value=new_key.decode('utf-8')
        )
        session.add(new_setting)
        session.commit()
        
        return new_key

def get_fernet():
    """Get the active Fernet instance using the database-backed key."""
    global _FERNET_KEY_CACHE
    
    if _FERNET_KEY_CACHE is None:
        try:
            key = _get_or_create_db_key()
            if key:
                _FERNET_KEY_CACHE = key
        except Exception as e:
            logger.error(f"Failed to load or generate master encryption key: {e}")
            return None
            
    if _FERNET_KEY_CACHE:
        return Fernet(_FERNET_KEY_CACHE)
        
    return None