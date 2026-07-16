import logging
import json
from typing import Any, Dict, Optional
from datetime import datetime, timezone

from app.aws_client.aws_auth import aws_client

logger = logging.getLogger(__name__)

_AWS_REGION_MAP: Dict[str, str] = {
    "us-east-1":      "us-east-1",
    "us-east-2":      "us-east-2",
    "us-west-1":      "us-west-1",
    "us-west-2":      "us-west-2",
    "eu-west-1":      "eu-west-1",
    "eu-west-2":      "eu-west-2",
    "eu-central-1":   "eu-central-1",
    "ap-south-1":     "ap-south-1",
    "ap-south-2":     "ap-south-2",
    "ap-northeast-1": "ap-northeast-1",
    "ap-northeast-2": "ap-northeast-2",
    "ap-southeast-1": "ap-southeast-1",
    "ap-southeast-2": "ap-southeast-2",
    "ca-central-1":   "ca-central-1",
    "sa-east-1":      "sa-east-1",
}

_VOLUME_TYPE_MAP: Dict[str, str] = {
    "STANDARD": "Standard",
    "INTELLIGENT_TIERING": "Intelligent-Tiering Frequent Access",
    "STANDARD_IA": "Standard - Infrequent Access",
    "ONEZONE_IA": "One Zone - Infrequent Access",
    "GLACIER": "Amazon Glacier",
    "DEEP_ARCHIVE": "Glacier Deep Archive",
}

CACHE_TTL = 86400
_price_cache: Dict[str, Any] = {"data": {}, "last_updated": 0.0}


class AWSPricingError(Exception):
    def __init__(self, message: str, details: str = ""):
        self.message = message
        self.details = details
        super().__init__(message)


def _get_pricing_client(access_key: str, secret_key: str):
    return aws_client("pricing", access_key, secret_key, "us-east-1")


def _extract_price(terms: Dict) -> Optional[float]:
    try:
        for term_group in terms.values():
            for dim in term_group.get("priceDimensions", {}).values():
                p = dim.get("pricePerUnit", {}).get("USD")
                if p is not None:
                    return float(p)
    except Exception:
        pass
    return None


def _fetch_s3_price_per_gb(
    access_key: str, secret_key: str, region: str, storage_class: str
) -> float:
    volume_type = _VOLUME_TYPE_MAP.get(storage_class)
    if not volume_type:
        raise AWSPricingError(f"Unknown storage class: {storage_class}")

    client = _get_pricing_client(access_key, secret_key)
    response = client.get_products(
        ServiceCode="AmazonS3",
        Filters=[
            {"Type": "TERM_MATCH", "Field": "regionCode", "Value": region},
            {"Type": "TERM_MATCH", "Field": "productFamily", "Value": "Storage"},
            {"Type": "TERM_MATCH", "Field": "volumeType", "Value": volume_type},
        ],
        MaxResults=1,
    )
    for item in response.get("PriceList", []):
        product = json.loads(item) if isinstance(item, str) else item
        ondemand = product.get("terms", {}).get("OnDemand", {})
        price = _extract_price(ondemand)
        if price is not None:
            return price

    raise AWSPricingError(f"No pricing found for {storage_class} in {region}")


def estimate_s3_storage_cost(
    access_key: str,
    secret_key: str,
    region: str,
    storage_class: str,
    size_gb: int = 10,
) -> Dict[str, Any]:
    global _price_cache

    cache_key = f"s3:{region}:{storage_class}"
    now = datetime.now(timezone.utc).timestamp()

    cached_info = _price_cache["data"].get(cache_key)
    if cached_info is not None and (now - _price_cache["last_updated"]) < CACHE_TTL:
        price_per_gb = cached_info
    else:
        price_per_gb = _fetch_s3_price_per_gb(access_key, secret_key, region, storage_class)
        _price_cache["data"][cache_key] = price_per_gb
        _price_cache["last_updated"] = now

    monthly = round(price_per_gb * size_gb, 6)
    daily = round(monthly / 30, 6)

    return {
        "estimated_cost_monthly": monthly,
        "estimated_cost_daily": daily,
        "currency": "USD",
        "service_name": "Amazon S3",
        "storage_class": storage_class,
        "region": region,
        "size_gb": size_gb,
        "breakdown": {
            "per_gb_price": price_per_gb,
            "base_storage": monthly,
            "surcharges": {},
            "total_surcharges": 0,
        },
        "sku_description": f"S3 {storage_class} storage in {region} (live via AWS Pricing API)",
    }


def _fetch_ebs_price_per_gb(
    access_key: str, secret_key: str, region: str, volume_api_name: str
) -> float:
    client = _get_pricing_client(access_key, secret_key)
    response = client.get_products(
        ServiceCode="AmazonEC2",
        Filters=[
            {"Type": "TERM_MATCH", "Field": "productFamily", "Value": "Storage"},
            {"Type": "TERM_MATCH", "Field": "volumeApiName", "Value": volume_api_name},
            {"Type": "TERM_MATCH", "Field": "regionCode", "Value": region},
        ],
        MaxResults=1,
    )
    for item in response.get("PriceList", []):
        product = json.loads(item) if isinstance(item, str) else item
        ondemand = product.get("terms", {}).get("OnDemand", {})
        price = _extract_price(ondemand)
        if price is not None:
            return price
    raise AWSPricingError(f"No EBS pricing found for {volume_api_name} in {region}")


def estimate_ebs_cost(
    access_key: str,
    secret_key: str,
    region: str,
    volume_api_name: str = "gp3",
    size_gb: int = 10,
) -> float:
    """Return monthly EBS cost for a given volume type and size."""
    price_per_gb = _fetch_ebs_price_per_gb(access_key, secret_key, region, volume_api_name)
    monthly = round(price_per_gb * size_gb, 6)
    return monthly


def estimate_ec2_instance_cost(
    access_key: str,
    secret_key: str,
    instance_type: str,
    region: str = "us-east-1",
    operating_system: str = "Linux",
    volume_size: int = 0,
    volume_type: str = "gp3",
) -> Dict[str, Any]:
    global _price_cache

    cache_key = f"ec2:{region}:{instance_type}:{operating_system}"
    now = datetime.now(timezone.utc).timestamp()

    cached = _price_cache["data"].get(cache_key)
    if cached is not None and (now - _price_cache["last_updated"]) < CACHE_TTL:
        hourly_rate = cached
    else:
        client = _get_pricing_client(access_key, secret_key)
        try:
            response = client.get_products(
                ServiceCode="AmazonEC2",
                Filters=[
                    {"Type": "TERM_MATCH", "Field": "instanceType", "Value": instance_type},
                    {"Type": "TERM_MATCH", "Field": "operatingSystem", "Value": "Linux"},
                    {"Type": "TERM_MATCH", "Field": "regionCode", "Value": region},
                    {"Type": "TERM_MATCH", "Field": "tenancy", "Value": "Shared"},
                    {"Type": "TERM_MATCH", "Field": "preInstalledSw", "Value": "NA"},
                    {"Type": "TERM_MATCH", "Field": "capacityStatus", "Value": "Used"},
                ],
                MaxResults=1,
            )
            hourly_rate = None
            for item in response.get("PriceList", []):
                product = json.loads(item) if isinstance(item, str) else item
                ondemand = product.get("terms", {}).get("OnDemand", {})
                price = _extract_price(ondemand)
                if price is not None:
                    hourly_rate = float(price)
                    break
        except Exception as e:
            logger.warning(f"AWS Pricing API error for {instance_type} in {region}: {str(e)}")
            raise

        if hourly_rate is None:
            raise AWSPricingError(f"No EC2 pricing found for {instance_type} in {region}")

        _price_cache["data"][cache_key] = hourly_rate
        _price_cache["last_updated"] = now

    compute_monthly = round(hourly_rate * 730, 6)

    ebs_monthly = 0.0
    ebs_hourly = 0.0
    if volume_size > 0:
        try:
            ebs_monthly = estimate_ebs_cost(access_key, secret_key, region, volume_type, volume_size)
            ebs_hourly = round(ebs_monthly / 730, 10)
        except AWSPricingError as e:
            logger.warning(f"EBS pricing unavailable: {e}")

    total_monthly = round(compute_monthly + ebs_monthly, 6)
    total_hourly = round(hourly_rate + ebs_hourly, 10)

    return {
        "estimated_cost_hourly": total_hourly,
        "estimated_cost_monthly": total_monthly,
        "currency": "USD",
        "service_name": "Amazon EC2",
        "instance_type": instance_type,
        "region": region,
        "breakdown": {
            "compute_monthly": compute_monthly,
            "ebs_monthly": ebs_monthly,
            "surcharges": {},
            "total_surcharges": 0,
        },
        "sku_description": f"EC2 {instance_type} on-demand in {region}",
    }


def get_cache_status() -> Dict[str, Any]:
    return {
        "cached_keys": list(_price_cache["data"].keys()),
        "last_updated": _price_cache["last_updated"],
        "count": len(_price_cache["data"]),
    }
