"""
/api/v1/pricing/estimate

Query params (GET):
  resource_type            : "bucket" | "disk" | "filestore" | "vm"
  size_gb                  : float
  location                 : GCS location (for bucket)
  storage_class            : STANDARD | NEARLINE | COLDLINE | ARCHIVE
  zone                     : GCP zone (for disk/vm/filestore)
  disk_type                : pd-standard | pd-ssd | pd-balanced
  machine_type             : e.g. e2-micro, n2-standard-2
  tier                     : STANDARD | PREMIUM (for filestore)
  autoclass_enabled        : true | false
  versioning_enabled       : true | false
  soft_delete_days         : int
  encryption_kms_key       : string

Uses the active GCP credential from the Credential Hub automatically.
"""
import logging
from fastapi import Request, HTTPException
from app.gcp_client.gcp_pricing import estimate_storage_cost, estimate_disk_cost, estimate_filestore_cost, estimate_vm_cost
from app.gcp_client import GCPAuthError

logger = logging.getLogger(__name__)


async def GET(request: Request):
    resource_type = request.query_params.get("resource_type", "").lower()
    credential_id = request.headers.get("X-GCP-Credential-ID")
    credential_id_int = int(credential_id) if credential_id and credential_id != "undefined" else None

    if not resource_type:
        raise HTTPException(status_code=400, detail="resource_type is required (bucket | disk | filestore | vm)")

    try:
        if resource_type == "bucket":
            storage_class = request.query_params.get("storage_class", "STANDARD")
            size_gb = float(request.query_params.get("size_gb", "10"))
            location = request.query_params.get("location", "US")
            autoclass_enabled = request.query_params.get("autoclass_enabled", "false").lower() == "true"
            versioning_enabled = request.query_params.get("versioning_enabled", "false").lower() == "true"
            soft_delete_days = int(request.query_params["soft_delete_days"]) if request.query_params.get("soft_delete_days") else None
            encryption_kms_key = request.query_params.get("encryption_kms_key") or None
            hierarchical_namespace_enabled = request.query_params.get("hierarchical_namespace_enabled", "false").lower() == "true"

            result = estimate_storage_cost(
                size_gb, location, storage_class, credential_id_int,
                autoclass_enabled=autoclass_enabled,
                versioning_enabled=versioning_enabled,
                soft_delete_days=soft_delete_days,
                encryption_kms_key=encryption_kms_key,
                hierarchical_namespace_enabled=hierarchical_namespace_enabled,
            )
            return result

        elif resource_type == "disk":
            disk_type = request.query_params.get("disk_type", "pd-balanced")
            size_gb = float(request.query_params.get("size_gb", "50"))
            zone = request.query_params.get("zone", "us-central1-a")
            result = estimate_disk_cost(size_gb, zone, disk_type, credential_id_int)
            if result.get("available"):
                logger.info(f"✓ Matched SKU: {result.get('sku_description')}")
            return result

        elif resource_type == "filestore":
            tier = request.query_params.get("tier", "STANDARD")
            size_gb = float(request.query_params.get("size_gb", "1024"))
            zone = request.query_params.get("zone", "us-central1-a")
            result = estimate_filestore_cost(size_gb, zone, tier, credential_id_int)
            if result.get("available"):
                logger.info(f"✓ Matched Filestore SKU: {result.get('sku_description')}")
            return result

        elif resource_type == "vm":
            machine_type = request.query_params.get("machine_type", "e2-medium")
            zone = request.query_params.get("zone", "us-central1-a")
            boot_disk_size_gb = float(request.query_params.get("size_gb", "10"))
            result = estimate_vm_cost(machine_type, zone, boot_disk_size_gb, credential_id_int)
            return result

        else:
            raise HTTPException(status_code=400, detail=f"Unknown resource_type: {resource_type}")

    except HTTPException:
        raise
    except GCPAuthError as e:
        logger.error(f"GCP Auth error: {e}")
        return {"available": False, "reason": str(e), "estimated_cost_monthly": 0.0}
    except Exception as e:
        logger.error(f"Pricing estimate error: {e}", exc_info=True)
        return {"available": False, "reason": str(e), "estimated_cost_monthly": 0.0}