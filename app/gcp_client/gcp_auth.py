import json
import logging
from typing import Optional, Tuple
from google.oauth2 import service_account
from google.cloud import billing_v1
from google.cloud import storage
from google.cloud import compute_v1
from app.db_client.db import get_session
from app.db_client.models.github_pat.github_pat import IntegrationCredential
from app.utils.get_fernet import get_fernet
from sqlmodel import select

logger = logging.getLogger(__name__)

GCP_CRED_CACHE_TTL = 600


class GCPAuthError(Exception):
    """Raised when GCP credentials cannot be loaded."""
    pass


def _cache_key(credential_id: Optional[int] = None) -> str:
    return f"gcp_cred:{credential_id}" if credential_id else "gcp_cred:active"


def _build_gcp_credentials(sa_json_str: str) -> Tuple[service_account.Credentials, str]:
    sa_data = json.loads(sa_json_str)
    for field in ("type", "project_id", "private_key", "client_email"):
        if field not in sa_data:
            raise GCPAuthError(f"Service account JSON missing required field: {field}")
    project_id = sa_data["project_id"]
    logger.info("  project=%s", project_id)
    return (
        service_account.Credentials.from_service_account_info(
            sa_data, scopes=["https://www.googleapis.com/auth/cloud-platform"]
        ),
        project_id,
    )


def get_active_gcp_credential() -> Optional[IntegrationCredential]:
    """
    Get the active GCP credential from the database.
    Returns the credential with provider='gcp' marked as active, or the first one found.
    """
    with get_session() as session:
        statement = select(IntegrationCredential).where(
            IntegrationCredential.provider == "gcp"
        ).order_by(IntegrationCredential.id)
        credentials = session.exec(statement).all()
        
        # Prefer active one, otherwise return first
        for cred in credentials:
            if cred.active:
                return cred
        
        return credentials[0] if credentials else None


def get_gcp_credential_by_id(credential_id: int) -> Optional[IntegrationCredential]:
    """
    Get a specific GCP credential by ID.
    """
    with get_session() as session:
        statement = select(IntegrationCredential).where(
            IntegrationCredential.id == credential_id,
            IntegrationCredential.provider == "gcp"
        )
        return session.exec(statement).first()


def load_service_account_json(credential: IntegrationCredential) -> dict:
    """
    Decrypt and load the service account JSON from a credential.
    
    Args:
        credential: IntegrationCredential with provider='gcp'
    
    Returns:
        dict: Service account JSON data
    
    Raises:
        GCPAuthError: If decryption or parsing fails
    """
    f = get_fernet()
    if not f:
        raise GCPAuthError("Server not configured with encryption key")
    
    try:
        token = f.decrypt(credential.token_encrypted.encode('utf-8')).decode('utf-8')
        return json.loads(token)
    except json.JSONDecodeError as e:
        raise GCPAuthError(f"Invalid JSON in credential: {str(e)}")
    except Exception as e:
        raise GCPAuthError(f"Failed to decrypt credential: {str(e)}")


def get_gcp_credentials(credential_id: Optional[int] = None) -> Tuple[service_account.Credentials, str]:
    """
    Load GCP Service Account credentials with two-tier caching.

    Delegates to the generic `get_cached_credential` in credential_cache.py
    so all credential types share the same cache lifecycle and logging.

    L1 (in-memory, 60s TTL) — stores the parsed (Credentials, project_id) tuple.
    L2 (Redis, 300s TTL) — stores the DB-encrypted Fernet token.

    Args:
        credential_id: Optional specific credential ID.
                      If not provided, uses the active GCP credential from DB.

    Returns:
        Tuple of (credentials, project_id)

    Raises:
        GCPAuthError: If credential is invalid or not found
    """
    from app.utils.credential_cache import get_cached_credential

    ck = _cache_key(credential_id)

    def _load():
        if credential_id:
            credential = get_gcp_credential_by_id(credential_id)
        else:
            credential = get_active_gcp_credential()
        if not credential:
            raise GCPAuthError("No active GCP credential found in the Credential Hub")
        return credential.token_encrypted

    try:
        return get_cached_credential(ck, _load, transform=_build_gcp_credentials, l2_ttl=GCP_CRED_CACHE_TTL)
    except GCPAuthError:
        raise
    except Exception as e:
        logger.error("Failed to load GCP credentials: %s: %s", type(e).__name__, e)
        raise GCPAuthError(f"Failed to create GCP credentials: {str(e)}") from e


def get_billing_client(credential_id: Optional[int] = None) -> billing_v1.CloudCatalogClient:
    """Get an authenticated Billing API client."""
    credentials, _ = get_gcp_credentials(credential_id)
    return billing_v1.CloudCatalogClient(credentials=credentials)


def get_storage_client(credential_id: Optional[int] = None) -> storage.Client:
    """Get an authenticated Storage client."""
    credentials, project_id = get_gcp_credentials(credential_id)
    return storage.Client(credentials=credentials, project=project_id)


def get_compute_client(credential_id: Optional[int] = None) -> compute_v1.InstancesClient:
    """Get an authenticated Compute Engine Instances client."""
    credentials, _ = get_gcp_credentials(credential_id)
    return compute_v1.InstancesClient(credentials=credentials)


def list_gcp_credentials() -> list:
    """List all GCP credentials with their metadata."""
    with get_session() as session:
        statement = select(IntegrationCredential).where(
            IntegrationCredential.provider == "gcp"
        )
        credentials = session.exec(statement).all()
    
    result = []
    f = get_fernet()
    
    for cred in credentials:
        metadata = {"id": cred.id, "name": cred.name, "active": cred.active}
        if f:
            sa_data = None
            try:
                token = f.decrypt(cred.token_encrypted.encode('utf-8')).decode('utf-8')
                sa_data = json.loads(token)
                metadata["project_id"] = sa_data.get("project_id")
                metadata["client_email"] = sa_data.get("client_email")
            except:
                metadata["error"] = "Failed to decrypt"
            finally:
                if sa_data:
                    sa_data.clear()
        result.append(metadata)
    
    return result


def validate_gcp_credential(credential_id: int) -> dict:
    """
    Validate a GCP credential by attempting to load it.
    
    Returns:
        Dict with 'valid' bool and 'project_id' if valid, or 'error' message
    """
    try:
        credentials, project_id = get_gcp_credentials(credential_id)
        return {"valid": True, "project_id": project_id}
    except GCPAuthError as e:
        return {"valid": False, "error": str(e)}