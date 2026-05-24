import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi import Request, HTTPException
import pydantic

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    aws_error_interceptor,
    LightsailBucketFactory,
    LightsailProvisioningError,
    list_aws_regions,
)

logger = logging.getLogger(__name__)


class BucketCreateRequest(pydantic.BaseModel):
    bucket_name: str
    region: str = "us-east-1"
    bundle_id: str = "small_1_0"


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


@aws_error_interceptor
async def GET(request: Request):
    region = request.query_params.get("region", "")
    credential_id = request.query_params.get("credential_id")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        if region:
            buckets = LightsailBucketFactory.list_buckets(access_key, secret_key, region, endpoint_url=endpoint_url)
            for b in buckets:
                b["region"] = region
        else:
            regions_data = list_aws_regions(access_key, secret_key, endpoint_url=endpoint_url)
            regions = [r["value"] for r in regions_data]
            buckets = []
            with ThreadPoolExecutor(max_workers=8) as executor:
                fut_map = {
                    executor.submit(
                        LightsailBucketFactory.list_buckets, access_key, secret_key, r, endpoint_url=endpoint_url
                    ): r for r in regions
                }
                for fut in as_completed(fut_map):
                    r = fut_map[fut]
                    try:
                        region_buckets = fut.result()
                        for b in region_buckets:
                            b["region"] = r
                        buckets.extend(region_buckets)
                    except Exception:
                        logger.warning(f"Failed to list Lightsail buckets in region {r}", exc_info=True)
        return {"buckets": buckets}
    except LightsailProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


@aws_error_interceptor
async def POST(request: Request):
    credential_id = request.query_params.get("credential_id")
    cred_id = _parse_cred_id(credential_id)

    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    body = await request.json()
    req = BucketCreateRequest(**body)

    try:
        result = LightsailBucketFactory.create_bucket(
            access_key=access_key,
            secret_key=secret_key,
            region=req.region,
            bucket_name=req.bucket_name,
            bundle_id=req.bundle_id,
            endpoint_url=endpoint_url,
        )
        return {"message": "Lightsail bucket created successfully", "bucket": result}
    except LightsailProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)
