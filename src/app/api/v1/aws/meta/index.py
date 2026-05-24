import logging
from fastapi import Request, HTTPException

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    get_aws_meta,
)

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


async def GET(request: Request):
    credential_id = request.query_params.get("credential_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        meta = get_aws_meta(access_key, secret_key, endpoint_url=endpoint_url)
        return meta
    except Exception as e:
        logger.exception("Failed to fetch AWS meta")
        raise HTTPException(status_code=500, detail=str(e))
