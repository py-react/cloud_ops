"""
/api/v1/pricing/debug

Returns the first N raw SKU descriptions for a given service_id.
Used to diagnose SKU keyword matching failures.

Uses the active GCP credential from the Credential Hub automatically.

Query params:
  service_id : e.g. 95FF-2F03-F381 (GCS) or 6F81-5844-456A (Compute)
  limit      : number of SKUs to return (default 20)
  keyword    : optional filter substring in description
"""
import logging
from fastapi import Request, HTTPException
from app.gcp_client.gcp_pricing import get_cache_status, GCS_SERVICE_ID, COMPUTE_SERVICE_ID
from app.gcp_client import get_gcp_credentials, GCPAuthError

logger = logging.getLogger(__name__)


async def GET(request: Request):
    service_id = request.query_params.get("service_id", GCS_SERVICE_ID)
    limit = int(request.query_params.get("limit", "20"))
    keyword = request.query_params.get("keyword", "").lower()

    try:
        credentials, project_id = get_gcp_credentials()
    except GCPAuthError as e:
        return {"error": "AUTHENTICATION_FAILED", "message": str(e)}

    from google.cloud import billing_v1
    try:
        client = billing_v1.CloudCatalogClient(credentials=credentials)
        skus = list(client.list_skus(parent=f"services/{service_id}"))
    except Exception as e:
        return {"total": 0, "skus": [], "message": str(e), "cache": get_cache_status()}

    if not skus:
        return {"total": 0, "skus": [], "message": "No SKUs returned", "cache": get_cache_status()}

    filtered = skus
    if keyword:
        filtered = [s for s in skus if keyword in s.description.lower()]

    sample = []
    for sku in filtered[:limit]:
        sample.append({
            "id": sku.sku_id,
            "description": sku.description,
            "service_regions": list(sku.service_regions),
        })

    return {
        "service_id": service_id,
        "project_id": project_id,
        "total_skus": len(skus),
        "filtered_by_keyword": keyword or "(none)",
        "showing": len(sample),
        "skus": sample,
        "cache": get_cache_status(),
    }