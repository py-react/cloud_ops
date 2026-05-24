import logging
from fastapi import Request, HTTPException

from app.aws_client import (
    get_aws_credentials,
    AWSAuthError,
    EC2InstanceFactory,
    EC2ProvisioningError,
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
    region = request.query_params.get("region", "us-east-1")
    credential_id = request.query_params.get("credential_id")
    category = request.query_params.get("category", "instance_types")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    try:
        if category == "instance_types":
            types = EC2InstanceFactory.list_instance_types(access_key, secret_key, region, endpoint_url=endpoint_url)
            free_count = sum(1 for t in types if t.get("free_tier_eligible"))
            logger.info("Instance types: %d total, %d free tier eligible in %s", len(types), free_count, region)
            return {"instance_types": types}
        elif category == "images":
            result = EC2InstanceFactory.list_public_images(access_key, secret_key, region, endpoint_url=endpoint_url)
            return result
        elif category == "availability_zones":
            zones = EC2InstanceFactory.list_availability_zones(access_key, secret_key, region, endpoint_url=endpoint_url)
            return {"availability_zones": zones}
        elif category == "security_groups":
            groups = EC2InstanceFactory.list_security_groups(access_key, secret_key, region, endpoint_url=endpoint_url)
            return {"security_groups": groups}
        else:
            raise HTTPException(status_code=400, detail=f"Unknown category: {category}")
    except EC2ProvisioningError as e:
        raise HTTPException(status_code=e.code, detail=e.message)


async def POST(request: Request):
    credential_id = request.query_params.get("credential_id")
    region = request.query_params.get("region", "us-east-1")

    cred_id = _parse_cred_id(credential_id)
    try:
        access_key, secret_key, _, endpoint_url = get_aws_credentials(cred_id)
    except AWSAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))

    body = await request.json()
    action = body.get("action")

    if action == "create_security_group":
        group_name = body.get("group_name")
        description = body.get("description", "")
        vpc_id = body.get("vpc_id", "")
        ingress_rules = body.get("ingress_rules")
        egress_rules = body.get("egress_rules")
        if not group_name:
            raise HTTPException(status_code=400, detail="group_name is required")
        try:
            result = EC2InstanceFactory.create_security_group(
                access_key=access_key,
                secret_key=secret_key,
                region=region,
                group_name=group_name,
                description=description,
                vpc_id=vpc_id,
                ingress_rules=ingress_rules,
                egress_rules=egress_rules,
                endpoint_url=endpoint_url,
            )
            return result
        except EC2ProvisioningError as e:
            raise HTTPException(status_code=e.code, detail=e.message)

    raise HTTPException(status_code=400, detail=f"Unknown action: {action}")
