import logging
from fastapi import Request, HTTPException, Query

from app.gcp_client import (
    load_service_account_json,
    GCPAuthError,
    ComputeDiscovery,
)
from app.gcp_client.gcp_auth import get_active_gcp_credential, get_gcp_credential_by_id
from app.gcp_client.gcp_pricing import VM_MACHINE_TYPES
from app.gcp_client.gcp_error_handler import gcp_error_interceptor

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


def _get_sa_data(cred_id: int | None) -> tuple[dict, str]:
    """Resolve a credential to raw SA JSON dict + project_id for factory calls."""
    if cred_id:
        credential = get_gcp_credential_by_id(cred_id)
    else:
        credential = get_active_gcp_credential()
    if not credential:
        raise GCPAuthError("No GCP credential found")
    sa_data = load_service_account_json(credential)
    project_id = sa_data.get("project_id", "")
    return sa_data, project_id


@gcp_error_interceptor
async def GET(
    request: Request,
    credential_id: str | None = None,
    project_id: str = "",
    zone: str = "us-central1-a",
    category: str = "machine_types",
):
    cred_id = _parse_cred_id(credential_id)

    if category == "machine_types":
        # Return hardcoded machine types with free tier info (no credentials needed)
        free_tier_zones = [
            "us-central1-a", "us-central1-b", "us-central1-c", "us-central1-f",
            "us-east1-b", "us-east1-c", "us-east1-d",
            "us-west1-a", "us-west1-b", "us-west1-c"
        ]
        
        machine_types = []
        for mt_name, (cpus, ram_gb, family) in VM_MACHINE_TYPES.items():
            is_free_tier = mt_name == "e2-micro" and zone in free_tier_zones
            machine_types.append({
                "machine_type": mt_name,
                "description": f"{family} {mt_name.replace('e2-', '').replace('-', ' ').title()}",
                "guest_cpus": int(cpus * 4) if cpus < 1 else int(cpus),  # e2-micro shows 0.25 but actually 2 vCPUs
                "memory_mb": int(ram_gb * 1024),
                "free_tier_eligible": is_free_tier,
                "zone": zone,
            })
        
        free_count = sum(1 for m in machine_types if m.get("free_tier_eligible"))
        logger.info("GCP Machine types: %d total, %d free tier eligible in %s", len(machine_types), free_count, zone)
        return {"machine_types": machine_types}

    elif category == "images":
        # Images use backend-maintained hardcoded mapping — no credentials needed
        return {"images": []}

    elif category in ("regions", "zones", "disk_types"):
        # All other categories require live GCP credentials
        try:
            sa_data, sa_project = _get_sa_data(cred_id)
        except GCPAuthError as e:
            raise HTTPException(status_code=401, detail=str(e))

        target_project = project_id or sa_project

        if category == "regions":
            regions = ComputeDiscovery.list_regions(sa_data, target_project)
            return {"regions": regions}
        elif category == "zones":
            zones = ComputeDiscovery.list_zones(sa_data, target_project)
            return {"zones": zones}
        elif category == "disk_types":
            disk_types = ComputeDiscovery.list_disk_types(sa_data, target_project, zone)
            return {"disk_types": disk_types}
    else:
        raise HTTPException(status_code=400, detail=f"Unknown category: {category}")