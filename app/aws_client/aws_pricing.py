import logging
import json
from typing import Any, Dict, Optional
from datetime import datetime, timezone

from app.aws_client.aws_auth import aws_client

logger = logging.getLogger(__name__)

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
            for term in term_group.values():
                for dim in term.get("priceDimensions", {}).values():
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


def get_cache_status() -> Dict[str, Any]:
    return {
        "cached_keys": list(_price_cache["data"].keys()),
        "last_updated": _price_cache["last_updated"],
        "count": len(_price_cache["data"]),
    }
