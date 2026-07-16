import yaml
import logging
from typing import Optional, List
from datetime import datetime
from kubernetes import client, config
from sqlmodel import Session, select
from app.db_client.db import engine
from app.db_client.models.kubernetes_configs.kube_config_file import KubeConfigFile
from app.utils.get_fernet import get_fernet
import os
from pathlib import Path

logger = logging.getLogger(__name__)

# Base directory for managed kubeconfigs
KUBECONFIG_CACHE_DIR = Path.home() / ".cache" / "cloud_ops" / "kubeconfig"

class KubeConfigService:
    @staticmethod
    def _ensure_cache_dir():
        KUBECONFIG_CACHE_DIR.mkdir(parents=True, exist_ok=True)

    @classmethod
    def ensure_active_kubeconfig_path(cls, session: Session) -> Optional[str]:
        """
        Returns the absolute path to the active kubeconfig file.
        If it's a DB config, it writes the decrypted content to a cached file.
        """
        active_config = cls.get_active_config(session)
        if not active_config:
            return None
        
        if active_config.is_system_config:
            return os.path.expanduser(active_config.system_path)
        
        # For DB configs, write to cache
        cls._ensure_cache_dir()
        cache_path = KUBECONFIG_CACHE_DIR / f"active_config_{active_config.id}.yaml"
        
        try:
            content = cls.decrypt_content(active_config.content_encrypted)
            with open(cache_path, "w") as f:
                f.write(content)
            # Secure the file (read/write by owner only)
            os.chmod(cache_path, 0o600)
            return str(cache_path)
        except Exception as e:
            logger.error(f"Failed to write active kubeconfig to cache: {e}")
            return None
    @staticmethod
    def get_active_config(session: Session) -> Optional[KubeConfigFile]:
        return session.exec(select(KubeConfigFile).where(KubeConfigFile.is_active == True)).first()

    @staticmethod
    def decrypt_content(content_encrypted: str) -> str:
        f = get_fernet()
        if not f:
            logger.warning("Encryption key not configured. Using plaintext fallback.")
            return content_encrypted
        return f.decrypt(content_encrypted.encode()).decode()

    @staticmethod
    def encrypt_content(content: str) -> str:
        f = get_fernet()
        if not f:
            logger.warning("Encryption key not configured. Storing in plaintext.")
            return content
        return f.encrypt(content.encode()).decode()

    @classmethod
    def load_active_config(cls):
        """Loads the active Kubeconfig from DB into the global kubernetes configuration."""
        with Session(engine) as session:
            active_config = cls.get_active_config(session)
            if active_config:
                try:
                    if active_config.is_system_config:
                        config.load_kube_config(config_file=active_config.system_path)
                        logger.info(f"Loaded active system Kubeconfig: {active_config.system_path}")
                    else:
                        content = cls.decrypt_content(active_config.content_encrypted)
                        config_dict = yaml.safe_load(content)
                        config.kube_config.load_kube_config_from_dict(config_dict)
                        logger.info(f"Loaded active Kubeconfig from DB: {active_config.name}")
                    return True
                except Exception as e:
                    logger.error(f"Failed to load Kubeconfig '{active_config.name}': {e}")
                    raise ValueError(f"Failed to load Kubeconfig '{active_config.name}': {e}")
        
        raise ValueError("No active Kubernetes configuration found. Please upload or activate a Kubeconfig in the Control Center.")

    @classmethod
    def list_configs(cls, session: Session) -> List[KubeConfigFile]:
        return session.exec(select(KubeConfigFile)).all()

    @classmethod
    def add_config(cls, name: str, content: Optional[str], session: Session, is_system: bool = False, system_path: Optional[str] = None) -> KubeConfigFile:
        encrypted = cls.encrypt_content(content) if content else None
        
        # Check if there are any existing configs
        existing_config = session.exec(select(KubeConfigFile)).first()
        is_first = existing_config is None
        
        new_config = KubeConfigFile(
            name=name,
            content_encrypted=encrypted,
            is_active=is_first,
            is_system_config=is_system,
            system_path=system_path
        )
        session.add(new_config)
        session.commit()
        session.refresh(new_config)
        
        if is_first:
            try:
                cls.load_active_config()
            except Exception as e:
                logger.error(f"Failed to load the first active config: {e}")
                
        return new_config

    @classmethod
    def set_active(cls, config_id: int, session: Session):
        target = session.get(KubeConfigFile, config_id)
        if not target:
            raise ValueError(f"Kubeconfig with ID {config_id} not found")

        # Deactivate all, activate the target
        configs = session.exec(select(KubeConfigFile)).all()
        for c in configs:
            c.is_active = (c.id == config_id)
            session.add(c)
        session.commit()
        # Reload configuration
        cls.load_active_config()

    @classmethod
    def get_contexts(cls, config_id: int, session: Session) -> List[str]:
        kube_file = session.get(KubeConfigFile, config_id)
        if not kube_file:
            return []
        
        if kube_file.is_system_config:
            import os
            path = os.path.expanduser(kube_file.system_path)
            with open(path, 'r') as f:
                config_dict = yaml.safe_load(f)
        else:
            content = cls.decrypt_content(kube_file.content_encrypted)
            config_dict = yaml.safe_load(content)
            
        return [ctx['name'] for ctx in config_dict.get('contexts', [])]

    @classmethod
    def switch_context(cls, config_id: int, context_name: str, session: Session):
        kube_file = session.get(KubeConfigFile, config_id)
        if not kube_file:
            raise ValueError("Kubeconfig file not found")
        
        if kube_file.is_system_config:
            import os
            path = os.path.expanduser(kube_file.system_path)
            with open(path, 'r') as f:
                config_dict = yaml.safe_load(f)
            
            if not any(ctx['name'] == context_name for ctx in config_dict.get('contexts', [])):
                raise ValueError(f"Context '{context_name}' not found in {kube_file.name}")
            
            config_dict['current-context'] = context_name
            with open(path, 'w') as f:
                yaml.dump(config_dict, f)
        else:
            content = cls.decrypt_content(kube_file.content_encrypted)
            config_dict = yaml.safe_load(content)
            
            if not any(ctx['name'] == context_name for ctx in config_dict.get('contexts', [])):
                raise ValueError(f"Context '{context_name}' not found in {kube_file.name}")
            
            config_dict['current-context'] = context_name
            new_content = yaml.dump(config_dict)
            kube_file.content_encrypted = cls.encrypt_content(new_content)
            kube_file.updated_at = datetime.utcnow()
            session.add(kube_file)
        
        session.commit()
        
        # If this is the active config, reload it; failure is non-fatal
        if kube_file.is_active:
            try:
                cls.load_active_config()
            except Exception as e:
                logger.error(f"Failed to reload Kubeconfig after context switch: {e}")
        
        return True
