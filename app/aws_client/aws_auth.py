import json
import logging
import os
from typing import Optional, Tuple

import boto3
import botocore
from botocore.exceptions import ClientError

from app.db_client.db import get_session
from app.db_client.models.github_pat.github_pat import IntegrationCredential
from app.utils.get_fernet import get_fernet
from sqlmodel import select

logger = logging.getLogger(__name__)

AWS_CRED_CACHE_TTL = 600


class AWSAuthError(Exception):
    pass


def _cache_key(credential_id: Optional[int] = None) -> str:
    return f"aws_cred:{credential_id}" if credential_id else "aws_cred:active"


def _parse_aws_creds(token_str: str) -> Tuple[str, str, str, Optional[str]]:
    data = json.loads(token_str)
    for field in ("access_key_id", "secret_access_key"):
        if field not in data:
            raise AWSAuthError(f"AWS credential JSON missing required field: {field}")
    endpoint_url = data.get("endpoint_url", "") or None
    return data["access_key_id"], data["secret_access_key"], "", endpoint_url


def get_active_aws_credential() -> Optional[IntegrationCredential]:
    with get_session() as session:
        statement = select(IntegrationCredential).where(
            IntegrationCredential.provider == "aws"
        ).order_by(IntegrationCredential.id)
        credentials = session.exec(statement).all()
        for cred in credentials:
            if cred.active:
                return cred
        return credentials[0] if credentials else None


def get_aws_credential_by_id(credential_id: int) -> Optional[IntegrationCredential]:
    with get_session() as session:
        statement = select(IntegrationCredential).where(
            IntegrationCredential.id == credential_id,
            IntegrationCredential.provider == "aws"
        )
        return session.exec(statement).first()


def load_aws_credentials_json(credential: IntegrationCredential) -> dict:
    f = get_fernet()
    if not f:
        raise AWSAuthError("Server not configured with encryption key")
    try:
        token = f.decrypt(credential.token_encrypted.encode('utf-8')).decode('utf-8')
        return json.loads(token)
    except json.JSONDecodeError as e:
        raise AWSAuthError(f"Invalid JSON in credential: {str(e)}")
    except Exception as e:
        raise AWSAuthError(f"Failed to decrypt credential: {str(e)}")


def get_aws_credentials(credential_id: Optional[int] = None) -> Tuple[str, str, str, Optional[str]]:
    from app.utils.credential_cache import get_cached_credential

    ck = _cache_key(credential_id)

    def _load():
        if credential_id:
            credential = get_aws_credential_by_id(credential_id)
        else:
            credential = get_active_aws_credential()
        if not credential:
            raise AWSAuthError("No active AWS credential found in the Credential Hub")
        return credential.token_encrypted

    try:
        return get_cached_credential(ck, _load, transform=_parse_aws_creds, l2_ttl=AWS_CRED_CACHE_TTL)
    except AWSAuthError:
        raise
    except Exception as e:
        logger.error("Failed to load AWS credentials: %s: %s", type(e).__name__, e)
        raise AWSAuthError(f"Failed to create AWS credentials: {str(e)}") from e


def build_boto3_kwargs(access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> dict:
    kwargs = {
        "aws_access_key_id": access_key,
        "aws_secret_access_key": secret_key,
        "region_name": region,
    }
    if endpoint_url:
        kwargs["endpoint_url"] = endpoint_url
    return kwargs


def aws_client(service: str, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None):
    kwargs = build_boto3_kwargs(access_key, secret_key, region, endpoint_url)
    if service == "s3" and not endpoint_url:
        kwargs["config"] = botocore.config.Config(s3={"addressing_style": "virtual"})
    old = os.environ.pop('AWS_ENDPOINT_URL', None)
    try:
        return boto3.client(service, **kwargs)
    finally:
        if old is not None:
            os.environ['AWS_ENDPOINT_URL'] = old


def aws_resource(service: str, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None):
    kwargs = build_boto3_kwargs(access_key, secret_key, region, endpoint_url)
    if service == "s3" and not endpoint_url:
        kwargs["config"] = botocore.config.Config(s3={"addressing_style": "virtual"})
    old = os.environ.pop('AWS_ENDPOINT_URL', None)
    try:
        return boto3.resource(service, **kwargs)
    finally:
        if old is not None:
            os.environ['AWS_ENDPOINT_URL'] = old


def get_ec2_client(credential_id: Optional[int] = None):
    access_key, secret_key, region, endpoint_url = get_aws_credentials(credential_id)
    return aws_client("ec2", access_key, secret_key, region, endpoint_url)


def get_s3_client(credential_id: Optional[int] = None):
    access_key, secret_key, region, endpoint_url = get_aws_credentials(credential_id)
    return aws_client("s3", access_key, secret_key, region, endpoint_url)


def get_s3_resource(credential_id: Optional[int] = None):
    access_key, secret_key, region, endpoint_url = get_aws_credentials(credential_id)
    return aws_resource("s3", access_key, secret_key, region, endpoint_url)


def get_ec2_resource(credential_id: Optional[int] = None):
    access_key, secret_key, region, endpoint_url = get_aws_credentials(credential_id)
    return aws_resource("ec2", access_key, secret_key, region, endpoint_url)


def list_aws_credentials() -> list:
    with get_session() as session:
        statement = select(IntegrationCredential).where(
            IntegrationCredential.provider == "aws"
        )
        credentials = session.exec(statement).all()

    result = []
    f = get_fernet()
    for cred in credentials:
        metadata = {"id": cred.id, "name": cred.name, "active": cred.active}
        if f:
            cred_data = None
            try:
                token = f.decrypt(cred.token_encrypted.encode('utf-8')).decode('utf-8')
                cred_data = json.loads(token)
                metadata["aws_access_key_id"] = cred_data.get("access_key_id", "")[:8] + "..." if cred_data.get("access_key_id") else None
                metadata["region"] = cred_data.get("region")
            except Exception:
                metadata["error"] = "Failed to decrypt"
            finally:
                if cred_data:
                    cred_data.clear()
        result.append(metadata)
    return result


def validate_aws_credential(credential_id: int) -> dict:
    try:
        access_key, secret_key, region, endpoint_url = get_aws_credentials(credential_id)
        sts = aws_client("sts", access_key, secret_key, region, endpoint_url)
        identity = sts.get_caller_identity()
        return {"valid": True, "account_id": identity.get("Account"), "arn": identity.get("Arn")}
    except AWSAuthError as e:
        return {"valid": False, "error": str(e)}
    except ClientError as e:
        return {"valid": False, "error": str(e)}
