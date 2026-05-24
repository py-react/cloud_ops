import logging
from fastapi import Request, HTTPException

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    aws_error_interceptor,
    LightsailBucketFactory,
    LightsailProvisioningError,
)

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


@aws_error_interceptor
async def GET(request: Request):
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        bundles = LightsailBucketFactory.get_bundles(access_key, secret_key, region, endpoint_url=endpoint_url)
        return {"bundles": bundles}
    except LightsailProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
