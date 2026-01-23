from cryptography.fernet import Fernet
from render_relay.utils.load_settings import load_settings

def get_fernet():
    settings = load_settings()
    key = settings.get('GITHUB_PAT_ENCRYPTION_KEY')
    if not key:
        return None
    # Fernet expects bytes; accept either str or bytes in env
    return Fernet(key.encode() if isinstance(key, str) else key)