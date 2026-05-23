from fastapi import Request
from app.gcp_client import get_gcp_credentials, GCPAuthError
from app.gcp_client.gcp_error_handler import gcp_error_interceptor, GCPErrorResponse
from app.gcp_client.gcp_storage_factory import (
    GCSDiscovery,
    ComputeDiscovery,
    FilestoreDiscovery,
)
import logging

logger = logging.getLogger(__name__)


def _parse_cred_id(credential_id: str | None) -> int | None:
    if not credential_id or credential_id == "undefined":
        return None
    try:
        return int(credential_id)
    except (ValueError, TypeError):
        return None


def _safe_fetch(project_id: str, service_name: str, fn, *args, **kwargs):
    """Fetch a discovery method independently. Returns (data, error_dict_or_None)."""
    try:
        result = fn(*args, **kwargs)
        return result, None
    except Exception as e:
        logger.error(f"Failed to fetch {service_name}: {e}", exc_info=True)
        return [], GCPErrorResponse.error_content(e, project_id=project_id, service_name=service_name)


@gcp_error_interceptor
async def GET(request: Request):
    """Dynamically fetch all GCP metadata options via SDK discovery services."""
    project_id = request.query_params.get("project_id")
    zone = request.query_params.get("zone")
    credential_id = request.query_params.get("credential_id")

    if not project_id:
        return {
            "regions": [],
            "zones": [],
            "images": [],
            "storage_locations": [],
            "disk_types": [],
            "storage_classes": [],
            "filestore_locations": [],
            "networks": [],
            "errors": {},
        }

    cred_id = _parse_cred_id(credential_id)
    try:
        credentials, _ = get_gcp_credentials(cred_id)
    except GCPAuthError as e:
        logger.error(f"Failed to get GCP credentials: {e}")
        return {
            "regions": [],
            "zones": [],
            "images": [],
            "storage_locations": [],
            "disk_types": [],
            "storage_classes": [],
            "filestore_locations": [],
            "networks": [],
            "errors": {},
        }

    from app.db_client.db import get_session
    from app.db_client.models.github_pat.github_pat import IntegrationCredential
    from sqlmodel import select
    from app.gcp_client import load_service_account_json

    sa_data = None
    try:
        with get_session() as session:
            if cred_id:
                statement = select(IntegrationCredential).where(IntegrationCredential.id == cred_id)
            else:
                statement = select(IntegrationCredential).where(
                    IntegrationCredential.provider == "gcp"
                ).order_by(IntegrationCredential.id)
            credential = session.exec(statement).first()
        
        if credential:
            sa_data = load_service_account_json(credential)
    except Exception as e:
        logger.error(f"Failed to load SA data for discovery: {e}")

    if not sa_data:
        return {
            "regions": [],
            "zones": [],
            "storage_locations": [],
            "disk_types": [],
            "storage_classes": [],
            "filestore_locations": [],
            "networks": [],
            "errors": {},
        }

    errors = {}

    regions, err = _safe_fetch(project_id, "regions", ComputeDiscovery.list_regions, sa_data, project_id)
    if err: errors["regions"] = err

    zones, err = _safe_fetch(project_id, "zones", ComputeDiscovery.list_zones, sa_data, project_id)
    if err: errors["zones"] = err

    images, err = _safe_fetch(project_id, "images", ComputeDiscovery.list_images, sa_data, project_id)
    if err: errors["images"] = err

    ref_zone = zone or (zones[0]["id"] if zones else "us-central1-a")
    disk_types, err = _safe_fetch(project_id, "disk_types", ComputeDiscovery.list_disk_types, sa_data, project_id, ref_zone)
    if err: errors["disk_types"] = err

    storage_classes, err = _safe_fetch(project_id, "storage_classes", GCSDiscovery.list_storage_classes, sa_data, project_id)
    if err: errors["storage_classes"] = err

    storage_locations, err = _safe_fetch(project_id, "storage_locations", GCSDiscovery.list_locations, sa_data, project_id)
    if err: errors["storage_locations"] = err

    filestore_locations, err = _safe_fetch(project_id, "filestore_locations", FilestoreDiscovery.list_locations, sa_data, project_id)
    if err: errors["filestore_locations"] = err

    networks, err = _safe_fetch(project_id, "networks", FilestoreDiscovery.list_networks, sa_data, project_id)
    if err: errors["networks"] = err

    return {
        "regions": regions,
        "zones": zones,
        "images": images,
        "storage_locations": storage_locations,
        "disk_types": disk_types,
        "storage_classes": storage_classes,
        "filestore_locations": filestore_locations,
        "networks": networks,
        "errors": errors,
    }

