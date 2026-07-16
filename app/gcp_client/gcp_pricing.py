import gc
import time
import logging
from decimal import Decimal
from typing import Dict, Any, List, Optional

from google.cloud import billing_v1
from google.api_core.exceptions import GoogleAPIError
from google.oauth2 import service_account

from app.gcp_client import get_gcp_credentials, GCPAuthError

logger = logging.getLogger(__name__)

GCS_SERVICE_ID = "95FF-2EF5-5EA1"
COMPUTE_SERVICE_ID = "6F81-5844-456A"

GCS_CLASS_TO_BILLING = {
    "STANDARD": "Standard Storage",
    "NEARLINE": "Nearline Storage",
    "COLDLINE": "Coldline Storage",
    "ARCHIVE": "Archive Storage",
}

DISK_TYPE_TO_BILLING = {
    "pd-standard": "Storage PD Capacity",
    "pd-balanced": "Balanced PD Capacity",
    "pd-ssd": "SSD backed PD Capacity",
}

FILESTORE_TIER_TO_BILLING = {
    "STANDARD": "Filestore Capacity Standard",
    "PREMIUM": "Filestore Capacity Premium",
    "BASIC_HDD": "Filestore Capacity Standard",
    "BASIC_SSD": "Filestore Capacity Premium",
}

class GCPPricingError(Exception):
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)

_sku_cache: Dict[str, Dict[str, Any]] = {"data": {}, "last_updated": 0}
_services_cache: List[Any] = []
CACHE_TTL = 86400


def _safe_cleanup(*refs: Any) -> None:
    for ref in refs:
        if ref is not None:
            del ref
    gc.collect()


def _build_credentials_from_db(credential_id: Optional[int] = None):
    credentials, project_id = get_gcp_credentials(credential_id)
    return credentials, project_id


def get_cache_status() -> Dict[str, Any]:
    now = time.time()
    return {
        "is_active": len(_sku_cache["data"]) > 0,
        "last_updated": _sku_cache["last_updated"],
        "age_seconds": int(now - _sku_cache["last_updated"]) if _sku_cache["last_updated"] > 0 else 0,
        "cached_services": list(_sku_cache["data"].keys())
    }


def _fetch_skus_for_service(service_id: str, credential_id: Optional[int] = None) -> List[Any]:
    creds = None
    client = None
    try:
        now = time.time()
        if service_id in _sku_cache["data"] and (now - _sku_cache["last_updated"]) < CACHE_TTL:
            return _sku_cache["data"][service_id]

        creds, project_id = _build_credentials_from_db(credential_id)
        client = billing_v1.CloudCatalogClient(credentials=creds)

        service_name = f"services/{service_id}"
        skus = list(client.list_skus(parent=service_name))

        _sku_cache["data"][service_id] = skus
        _sku_cache["last_updated"] = now

        logger.info(f"Fetched {len(skus)} SKUs for service {service_id}")
        return skus

    except GCPAuthError as e:
        logger.error(f"Auth error fetching SKUs for {service_id}: {e}")
        return []
    except GoogleAPIError as e:
        logger.error(f"API error fetching SKUs for {service_id}: {e}")
        return []
    except Exception as e:
        logger.error(f"Failed to fetch SKUs for {service_id}: {e}")
        return []
    finally:
        _safe_cleanup(creds, client)


def _extract_price(sku) -> Optional[Decimal]:
    try:
        pricing_info = sku.pricing_info[0]
        pricing_expression = pricing_info.pricing_expression
        tiered_rates = pricing_expression.tiered_rates
        first_tier = tiered_rates[0]
        unit_price = first_tier.unit_price

        units = float(unit_price.units)
        nanos = float(unit_price.nanos)
        price = Decimal(str(units)) + (Decimal(str(nanos)) / Decimal("1000000000"))

        if price <= 0:
            return None

        return price

    except (IndexError, AttributeError, ValueError) as e:
        logger.error(f"Failed to extract price from SKU: {e}")
        return None


def _find_gcs_sku(skus: List[Any], storage_class: str, region: str) -> Optional[Any]:
    class_keyword = GCS_CLASS_TO_BILLING.get(storage_class.upper())
    if not class_keyword:
        logger.warning(f"Unknown storage class: {storage_class}")
        return None

    region_lower = region.lower().strip()

    exclude_terms = {
        "download", "retrieval", "metadata", "egress", "early deletion",
        "minimum", "data retrieval", "bucket", "request", "inter-region",
        "interregion", "cross-region", "cross region", "replication",
        "dual-region", "dual region", "class a", "class b", "operations",
    }

    for sku in skus:
        desc = sku.description or ""
        desc_lower = desc.lower()

        if class_keyword.lower() not in desc_lower:
            continue

        if any(skip in desc_lower for skip in exclude_terms):
            continue

        service_regions = getattr(sku, "service_regions", [])
        region_matches = [r.lower() for r in service_regions]

        if region_lower in region_matches:
            logger.info(f"Matched GCS SKU: {sku.description} (region: {region})")
            return sku

    return None


def _find_disk_sku(skus: List[Any], disk_type: str, zone: str) -> Optional[Any]:
    disk_type_lower = disk_type.lower()

    billing_keyword = None
    for dt_key, billing_str in DISK_TYPE_TO_BILLING.items():
        if dt_key in disk_type_lower:
            billing_keyword = billing_str
            break

    if not billing_keyword:
        billing_keyword = "Storage PD Capacity"

    zone_lower = zone.lower().strip()
    region_prefix = "-".join(zone.split("-")[:-1]) if "-" in zone else zone

    for sku in skus:
        desc = sku.description or ""
        desc_lower = desc.lower()

        if billing_keyword.lower() not in desc_lower:
            continue

        service_regions = getattr(sku, "service_regions", [])
        region_matches = [r.lower() for r in service_regions]

        if zone_lower in region_matches or region_prefix in region_matches:
            logger.info(f"Matched Disk SKU: {sku.description} (zone: {zone})")
            return sku

    return None


def estimate_storage_cost(
    size_gb: float,
    region: str,
    storage_class: str = "STANDARD",
    credential_id: Optional[int] = None,
    autoclass_enabled: bool = False,
    versioning_enabled: bool = False,
    soft_delete_days: Optional[int] = None,
    encryption_kms_key: Optional[str] = None,
    hierarchical_namespace_enabled: bool = False,
) -> Dict[str, Any]:
    skus = _fetch_skus_for_service(GCS_SERVICE_ID, credential_id)

    if not skus:
        raise GCPPricingError(f"Billing API returned empty SKU list for GCS")

    target_sku = _find_gcs_sku(skus, storage_class, region)
    if not target_sku:
        raise GCPPricingError(f"No SKU match for {storage_class} in {region}")

    base_price_per_gb = _extract_price(target_sku)

    if autoclass_enabled and (base_price_per_gb is None or base_price_per_gb <= 0):
        standard_sku = _find_gcs_sku(skus, "STANDARD", region)
        if standard_sku:
            standard_price = _extract_price(standard_sku)
            if standard_price and standard_price > 0:
                base_price_per_gb = standard_price
                target_sku = standard_sku

    if base_price_per_gb is None or base_price_per_gb <= 0:
        raise GCPPricingError(f"Could not extract price from SKU for {storage_class} in {region}")

    return _calculate_gcs_cost_with_surcharges(
        size_gb, base_price_per_gb, target_sku, storage_class, region,
        autoclass_enabled, versioning_enabled, soft_delete_days,
        encryption_kms_key, hierarchical_namespace_enabled,
    )


def _calculate_gcs_cost_with_surcharges(
    size_gb: float,
    base_price_per_gb: Decimal,
    target_sku,
    storage_class: str,
    region: str,
    autoclass_enabled: bool,
    versioning_enabled: bool,
    soft_delete_days: Optional[int],
    encryption_kms_key: Optional[str],
    hierarchical_namespace_enabled: bool,
) -> Dict[str, Any]:
    base_cost = Decimal(str(size_gb)) * base_price_per_gb

    surcharges: Dict[str, Decimal] = {}
    total_surcharges = Decimal("0")

    if versioning_enabled:
        versioning_surcharge = base_cost * Decimal("0.15")
        surcharges["versioning"] = versioning_surcharge.quantize(Decimal("0.01"))
        total_surcharges += versioning_surcharge

    if soft_delete_days and soft_delete_days > 0:
        retention_factor = Decimal(str(min(soft_delete_days, 30))) / Decimal("30")
        soft_delete_surcharge = base_cost * retention_factor * Decimal("0.10")
        surcharges["soft_delete"] = soft_delete_surcharge.quantize(Decimal("0.01"))
        total_surcharges += soft_delete_surcharge

    if encryption_kms_key:
        kms_surcharge = Decimal("0.03") + Decimal("0.03")
        surcharges["cmek"] = kms_surcharge.quantize(Decimal("0.01"))
        total_surcharges += kms_surcharge

    total = (base_cost + total_surcharges).quantize(Decimal("0.01"))

    return {
        "available": True,
        "monthly_estimate": float(total),
        "currency": "USD",
        "unit": "GB/month",
        "sku_description": target_sku.description,
        "price_per_unit": float(base_price_per_gb),
        "estimated_cost_monthly": float(total),
        "breakdown": {
            "base_storage": float(base_cost.quantize(Decimal("0.01"))),
            "per_gb_price": float(base_price_per_gb),
            "surcharges": {k: float(v) for k, v in surcharges.items()},
            "total_surcharges": float(total_surcharges.quantize(Decimal("0.01"))),
        },
        "features_applied": {
            "autoclass": autoclass_enabled,
            "versioning": versioning_enabled,
            "soft_delete_days": soft_delete_days,
            "cmek_enabled": bool(encryption_kms_key),
            "hierarchical_namespace": hierarchical_namespace_enabled,
        },
    }


def estimate_disk_cost(size_gb: float, zone: str, disk_type: str, credential_id: Optional[int] = None) -> Dict[str, Any]:
    skus = _fetch_skus_for_service(COMPUTE_SERVICE_ID, credential_id)

    if not skus:
        raise GCPPricingError(f"Billing API returned empty SKU list for Compute")

    target_sku = _find_disk_sku(skus, disk_type, zone)

    if not target_sku:
        raise GCPPricingError(f"No SKU match for {disk_type} in {zone}")

    price_per_gb = _extract_price(target_sku)
    if price_per_gb is None:
        raise GCPPricingError(f"Could not extract price from disk SKU: {disk_type} in {zone}")

    total = (Decimal(str(size_gb)) * price_per_gb).quantize(Decimal("0.01"))

    return {
        "available": True,
        "monthly_estimate": float(total),
        "per_gb_price": float(price_per_gb),
        "currency": "USD",
        "sku_description": target_sku.description,
        "price_per_unit": float(price_per_gb),
        "estimated_cost_monthly": float(total),
        "breakdown": {
            "base_storage": float(total),
            "per_gb_price": float(price_per_gb),
            "surcharges": {},
            "total_surcharges": 0.0,
        },
        "features_applied": {
            "disk_type": disk_type,
            "zone": zone,
        },
    }


VM_MACHINE_TYPES = {
    "e2-micro": (0.25, 1.0, "E2"),
    "e2-small": (0.5, 2.0, "E2"),
    "e2-medium": (1.0, 4.0, "E2"),
    "e2-standard-2": (2.0, 8.0, "E2"),
    "e2-standard-4": (4.0, 16.0, "E2"),
    "e2-standard-8": (8.0, 32.0, "E2"),
}

def estimate_vm_cost(
    machine_type: str,
    zone: str,
    boot_disk_size_gb: float = 10.0,
    credential_id: Optional[int] = None,
) -> Dict[str, Any]:
    machine_type_lower = machine_type.lower()
    specs = VM_MACHINE_TYPES.get(machine_type_lower)
    if not specs:
        raise GCPPricingError(f"Unknown machine type: {machine_type}")
        
    cores, ram_gb, family = specs
    region = "-".join(zone.split("-")[:-1]) if "-" in zone else zone
    
    skus = _fetch_skus_for_service(COMPUTE_SERVICE_ID, credential_id)
    if not skus:
        raise GCPPricingError(f"Billing API returned empty SKU list for Compute")
    
    core_price = None
    ram_price = None
    family_lower = family.lower()
    region_lower = region.lower().strip()
    
    for sku in skus:
        desc = sku.description or ""
        desc_lower = desc.lower()
        
        if family_lower in desc_lower and "instance" in desc_lower:
            service_regions = getattr(sku, "service_regions", [])
            region_matches = [r.lower() for r in service_regions]
            if region_lower not in region_matches:
                continue
                
            if "core" in desc_lower and core_price is None:
                core_price = _extract_price(sku)
            elif "ram" in desc_lower and ram_price is None:
                ram_price = _extract_price(sku)
                
            if core_price is not None and ram_price is not None:
                break

    if core_price is None or ram_price is None:
        raise GCPPricingError(f"Could not find CPU/RAM pricing for {machine_type} in {zone}")

    hourly_rate = (Decimal(str(cores)) * core_price) + (Decimal(str(ram_gb)) * ram_price)
    sku_desc = f"{family} CPU/RAM SKUs in {region}"
    vm_monthly_cost = (hourly_rate * Decimal("730")).quantize(Decimal("0.01"))
    
    disk_cost_result = estimate_disk_cost(boot_disk_size_gb, zone, "pd-balanced", credential_id)
    boot_disk_cost = Decimal(str(disk_cost_result.get("monthly_estimate", 0)))
    
    total_monthly = (vm_monthly_cost + boot_disk_cost).quantize(Decimal("0.01"))
    
    return {
        "available": True,
        "monthly_estimate": float(total_monthly),
        "currency": "USD",
        "sku_description": sku_desc,
        "price_per_unit": float(hourly_rate),
        "estimated_cost_monthly": float(total_monthly),
        "breakdown": {
            "compute_monthly": float(vm_monthly_cost),
            "boot_disk_monthly": float(boot_disk_cost),
            "per_gb_price": float(hourly_rate),
            "surcharges": {
                "boot_disk": float(boot_disk_cost),
            },
            "total_surcharges": float(boot_disk_cost),
        },
        "features_applied": {
            "machine_type": machine_type_lower,
            "zone": zone,
            "boot_disk_size_gb": boot_disk_size_gb,
        }
    }


def _find_filestore_sku(skus: List[Any], tier: str, zone: str) -> Optional[Any]:
    tier_upper = tier.upper()
    billing_keyword = FILESTORE_TIER_TO_BILLING.get(tier_upper, "Filestore Capacity")

    zone_lower = zone.lower().strip()
    region_prefix = "-".join(zone.split("-")[:-1]) if "-" in zone else zone

    for sku in skus:
        desc = sku.description or ""
        desc_lower = desc.lower()

        if billing_keyword.lower() not in desc_lower:
            continue

        service_regions = getattr(sku, "service_regions", [])
        region_matches = [r.lower() for r in service_regions]

        if zone_lower in region_matches or region_prefix in region_matches:
            logger.info(f"Matched Filestore SKU: {sku.description} (zone: {zone})")
            return sku

    return None


def estimate_filestore_cost(size_gb: float, zone: str, tier: str = "STANDARD", credential_id: Optional[int] = None) -> Dict[str, Any]:
    skus = _fetch_skus_for_service(COMPUTE_SERVICE_ID, credential_id)

    if not skus:
        raise GCPPricingError(f"Billing API returned empty SKU list for Compute")

    target_sku = _find_filestore_sku(skus, tier, zone)

    if not target_sku:
        raise GCPPricingError(f"No SKU match for Filestore {tier} in {zone}")

    price_per_gb = _extract_price(target_sku)
    if price_per_gb is None:
        raise GCPPricingError(f"Could not extract price from Filestore SKU: {tier} in {zone}")

    total = (Decimal(str(size_gb)) * price_per_gb).quantize(Decimal("0.01"))

    return {
        "available": True,
        "monthly_estimate": float(total),
        "per_gb_price": float(price_per_gb),
        "currency": "USD",
        "sku_description": target_sku.description,
        "price_per_unit": float(price_per_gb),
        "estimated_cost_monthly": float(total),
        "breakdown": {
            "base_storage": float(total),
            "per_gb_price": float(price_per_gb),
            "surcharges": {},
            "total_surcharges": 0.0,
        },
        "features_applied": {
            "tier": tier,
            "zone": zone,
            "resource_type": "filestore",
        },
    }

