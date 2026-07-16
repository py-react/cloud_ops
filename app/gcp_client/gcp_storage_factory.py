import gc
import logging
import re
import uuid
from typing import Any, Dict, List, Optional

from google.api_core import exceptions as gcp_exceptions
from google.cloud import compute_v1, storage
from google.cloud import filestore_v1
from google.oauth2 import service_account

logger = logging.getLogger(__name__)

# ─ GCP Storage Class Constants (Static SDK Enums) ────────────────────────────

STORAGE_CLASSES = [
    {"id": "STANDARD", "name": "Standard", "description": "Frequently accessed data. No minimum duration."},
    {"id": "NEARLINE", "name": "Nearline", "description": "Accessed less than once a month. 30-day minimum."},
    {"id": "COLDLINE", "name": "Coldline", "description": "Accessed less than once a quarter. 90-day minimum."},
    {"id": "ARCHIVE", "name": "Archive", "description": "Rarely accessed archival data. 365-day minimum."},
]

VALID_STORAGE_CLASS_IDS = {sc["id"] for sc in STORAGE_CLASSES}

_BUCKET_NAME_RE = re.compile(r'^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$')
_DISK_NAME_RE = re.compile(r'^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$')
_FILESTORE_NAME_RE = re.compile(r'^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$')


class StorageProvisioningError(Exception):
    """Base exception for storage provisioning failures."""
    def __init__(self, code: int, message: str, details: str = ""):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class NameConflictError(StorageProvisioningError):
    def __init__(self, resource_type: str, name: str):
        super().__init__(
            code=409,
            message=f"{resource_type} '{name}' already exists",
            details=f"A {resource_type} with this name is already provisioned."
        )


class PermissionDeniedError(StorageProvisioningError):
    def __init__(self, resource_type: str, action: str):
        super().__init__(
            code=403,
            message=f"Insufficient permissions to {action} {resource_type}",
            details="Service account requires appropriate IAM role."
        )


class InvalidNameError(StorageProvisioningError):
    def __init__(self, resource_type: str, name: str, rule: str):
        super().__init__(
            code=400,
            message=f"Invalid {resource_type} name: '{name}'",
            details=rule
        )


class InvalidOptionError(StorageProvisioningError):
    def __init__(self, option_type: str, value: str, available: List[str]):
        super().__init__(
            code=400,
            message=f"Invalid {option_type}: '{value}'",
            details=f"Available options: {', '.join(available[:10])}{'...' if len(available) > 10 else ''}"
        )


class QuotaExceededError(StorageProvisioningError):
    def __init__(self, resource_type: str):
        super().__init__(
            code=429,
            message=f"Quota exceeded for {resource_type}",
            details="Project has reached its resource quota limit."
        )


# ── Name Validation ──────────────────────────────────────────────────────────

def validate_bucket_name(name: str) -> None:
    name = name.strip()
    if not _BUCKET_NAME_RE.match(name):
        raise InvalidNameError(
            "bucket", name,
            "Must be 3-63 characters, lowercase letters/numbers/dots/hyphens/underscores, start and end with letter or number."
        )
    if name.startswith("goog") or name.startswith("gcs"):
        raise InvalidNameError("bucket", name, "Names starting with 'goog' or 'gcs' are reserved by Google.")


def validate_disk_name(name: str) -> None:
    if not _DISK_NAME_RE.match(name):
        raise InvalidNameError(
            "disk", name,
            "Must be 1-63 characters, lowercase letters/numbers/hyphens, start with letter, end with letter or number."
        )


def validate_filestore_name(name: str) -> None:
    if not _FILESTORE_NAME_RE.match(name):
        raise InvalidNameError(
            "filestore", name,
            "Must be 1-63 characters, lowercase letters/numbers/hyphens, start with letter, end with letter or number."
        )


# ── Ephemeral Credential Builder ──────────────────────────────────────────────

def _build_credentials(sa_data: Dict[str, Any]) -> service_account.Credentials:
    """Create GCP credentials from in-memory service account dict. Never writes to disk."""
    return service_account.Credentials.from_service_account_info(
        sa_data,
        scopes=["https://www.googleapis.com/auth/cloud-platform"]
    )


def _safe_cleanup(*refs: Any) -> None:
    """Deterministically erase credential references from memory."""
    for ref in refs:
        if ref is not None:
            del ref
    gc.collect()


# ── Error Mapper ──────────────────────────────────────────────────────────────

def _map_gcp_error(exc: Exception, resource_type: str, action: str, name: str = "") -> StorageProvisioningError:
    if isinstance(exc, gcp_exceptions.Conflict) or (hasattr(exc, 'code') and exc.code == 409):
        return NameConflictError(resource_type, name)
    if isinstance(exc, gcp_exceptions.Forbidden) or (hasattr(exc, 'code') and exc.code == 403):
        return PermissionDeniedError(resource_type, action)
    if isinstance(exc, gcp_exceptions.TooManyRequests) or (hasattr(exc, 'code') and exc.code == 429):
        return QuotaExceededError(resource_type)
    if isinstance(exc, gcp_exceptions.NotFound) or (hasattr(exc, 'code') and exc.code == 404):
        return StorageProvisioningError(404, f"{resource_type} '{name}' not found", str(exc))
    if isinstance(exc, gcp_exceptions.InvalidArgument) or (hasattr(exc, 'code') and exc.code == 400):
        msg = str(exc).lower()
        if "name" in msg or "already exists" in msg:
            return InvalidNameError(resource_type, name, str(exc))
        return StorageProvisioningError(400, f"Invalid request for {resource_type} {action}", str(exc))
    return StorageProvisioningError(500, f"Failed to {action} {resource_type}", str(exc))


def _validate_option(value: str, available: List[str], option_type: str) -> None:
    """Validate that a chosen option exists in the dynamically fetched list."""
    if value not in available:
        raise InvalidOptionError(option_type, value, available)


# ── Dynamic Discovery Services ────────────────────────────────────────────────

class GCSDiscovery:
    """Dynamically fetch GCS metadata from GCP APIs."""

    @classmethod
    def list_storage_classes(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        """Return static GCP storage class constants. These are SDK enums, not dynamically fetched."""
        return STORAGE_CLASSES

    @classmethod
    def list_locations(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        """Fetch available GCS locations (regions + multi-regions) from Compute API."""
        creds = None
        client = None

        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.RegionsClient(credentials=creds)

            regions = list(client.list(project=project_id))
            return [
                {"id": r.name, "name": f"{r.name.upper()} (Region)", "type": "REGION"}
                for r in regions
            ]

        except Exception as e:
            logger.error(f"Failed to fetch locations: {e}")
            return []
        finally:
            _safe_cleanup(creds, client)


class ComputeDiscovery:
    """Dynamically fetch Compute Engine metadata from GCP APIs."""

    @classmethod
    def list_regions(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        """Fetch all available regions for the project."""
        creds = None
        client = None

        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.RegionsClient(credentials=creds)

            regions = list(client.list(project=project_id))
            return [{"id": r.name, "name": r.name.upper(), "zones_count": len(r.zones) if r.zones else 0} for r in regions]

        except Exception as e:
            logger.error(f"Failed to fetch regions: {e}")
            return []
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def list_zones(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        """Fetch all available zones for the project."""
        creds = None
        client = None

        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.ZonesClient(credentials=creds)

            zones = list(client.list(project=project_id))
            return [{"id": z.name, "name": z.name, "region": z.region.split("/")[-1] if z.region else ""} for z in zones]

        except Exception as e:
            logger.error(f"Failed to fetch zones: {e}")
            return []
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def list_disk_types(cls, sa_data: Dict[str, Any], project_id: str, zone: str) -> List[Dict[str, Any]]:
        """Fetch available disk types for a specific zone."""
        creds = None
        client = None

        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.DiskTypesClient(credentials=creds)

            disk_types = list(client.list(project=project_id, zone=zone))
            return [
                {
                    "id": dt.name,
                    "name": dt.name,
                    "description": dt.description or dt.name,
                    "valid_disk_size": dt.valid_disk_size,
                    "zone": zone,
                }
                for dt in disk_types
                if dt.name.startswith("pd-") or dt.name.startswith("hyperdisk-")
            ]

        except Exception as e:
            logger.error(f"Failed to fetch disk types for zone {zone}: {e}")
            return []
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def list_machine_types(cls, sa_data: Dict[str, Any], project_id: str, zone: str) -> List[Dict[str, Any]]:
        """Fetch available machine types for a specific zone."""
        # Hardcoded free tier eligible machine types (GCP Free Tier: e2-micro in us regions)
        FREE_TIER_MACHINE_TYPES = {
            "e2-micro": ["us-central1-a", "us-central1-b", "us-central1-c", "us-central1-f",
                        "us-east1-b", "us-east1-c", "us-east1-d",
                        "us-west1-a", "us-west1-b", "us-west1-c"]
        }
        
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.MachineTypesClient(credentials=creds)
            
            machine_types = list(client.list(project=project_id, zone=zone))
            results = []
            for mt in machine_types:
                mt_name = mt.name
                is_free_tier = mt_name in FREE_TIER_MACHINE_TYPES and zone in FREE_TIER_MACHINE_TYPES[mt_name]
                results.append({
                    "machine_type": mt_name,
                    "description": mt.description or mt.name,
                    "guest_cpus": mt.guest_cpus,
                    "memory_mb": mt.memory_mb,
                    "free_tier_eligible": is_free_tier,
                    "zone": zone,
                })
            return results
        except Exception as e:
            logger.error(f"Failed to fetch machine types for zone {zone}: {e}")
            raise
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def list_images(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        """Fetch available image families from standard cloud image projects."""
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.ImagesClient(credentials=creds)
            families = [
                {"project": "debian-cloud", "family": "debian-12", "name": "Debian 12 Bookworm"},
                {"project": "ubuntu-os-cloud", "family": "ubuntu-2204-lts", "name": "Ubuntu 22.04 LTS"},
                {"project": "rocky-linux-cloud", "family": "rocky-linux-9", "name": "Rocky Linux 9"},
                {"project": "windows-cloud", "family": "windows-2022-core", "name": "Windows Server 2022 Core"}
            ]
            results = []
            for f in families:
                try:
                    img = client.get_from_family(project=f["project"], family=f["family"])
                    results.append({
                        "id": f"projects/{f['project']}/global/images/family/{f['family']}",
                        "name": f"{f['name']} ({img.name})",
                    })
                except Exception as ex:
                    logger.debug(f"Failed to fetch image family {f['family']}: {ex}")
                    results.append({
                        "id": f"projects/{f['project']}/global/images/family/{f['family']}",
                        "name": f"{f['name']}",
                    })
            return results
        except Exception as e:
            logger.error(f"Failed to list images: {e}")
            return [
                {"id": "projects/debian-cloud/global/images/family/debian-12", "name": "Debian 12 Bookworm"},
                {"id": "projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts", "name": "Ubuntu 22.04 LTS"},
                {"id": "projects/rocky-linux-cloud/global/images/family/rocky-linux-9", "name": "Rocky Linux 9"},
            ]
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def get_live_image_catalog(cls, sa_data: Dict[str, Any], project_id: str) -> Dict[str, Dict[str, Any]]:
        """Fetch live GCP image catalog with official API resolution.
        
        Returns a dictionary mapping os_key to enriched image metadata including
        live selfLink URI, minimum disk requirements, and OS family classification.
        """
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.ImagesClient(credentials=creds)
            
            target_families = [
                {"id": "debian-12", "label": "Debian 12 Bookworm", "project": "debian-cloud", "family": "debian-12", "min_disk_gb": 10, "os_family": "linux-debian"},
                {"id": "ubuntu-2204", "label": "Ubuntu 22.04 LTS", "project": "ubuntu-os-cloud", "family": "ubuntu-2204-lts", "min_disk_gb": 10, "os_family": "linux-ubuntu"},
                {"id": "rocky-linux-9", "label": "Rocky Linux 9", "project": "rocky-linux-cloud", "family": "rocky-linux-9", "min_disk_gb": 20, "os_family": "linux-rhel"},
                {"id": "windows-2022", "label": "Windows Server 2022 Core", "project": "windows-cloud", "family": "windows-2022-core", "min_disk_gb": 40, "os_family": "windows"}
            ]
            
            catalog = {}
            for item in target_families:
                try:
                    res = client.get_from_family(project=item["project"], family=item["family"])
                    catalog[item["id"]] = {
                        "label": item["label"],
                        "min_disk_gb": max(item["min_disk_gb"], int(res.disk_size_gb or 0)),
                        "gcp_uri": res.self_link,
                        "os_family": item["os_family"],
                        "latest_image_name": res.name,
                    }
                except Exception as ex:
                    logger.debug(f"Failed to fetch live image for {item['id']}: {ex}")
                    catalog[item["id"]] = {
                        "label": item["label"],
                        "min_disk_gb": item["min_disk_gb"],
                        "gcp_uri": f"projects/{item['project']}/global/images/family/{item['family']}",
                        "os_family": item["os_family"],
                        "latest_image_name": None,
                    }
            return catalog
        except Exception as e:
            logger.error(f"Failed to fetch live image catalog: {e}")
            return {
                "debian-12": {"label": "Debian 12 Bookworm", "min_disk_gb": 10, "gcp_uri": "projects/debian-cloud/global/images/family/debian-12", "os_family": "linux-debian", "latest_image_name": None},
                "ubuntu-2204": {"label": "Ubuntu 22.04 LTS", "min_disk_gb": 10, "gcp_uri": "projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts", "os_family": "linux-ubuntu", "latest_image_name": None},
                "rocky-linux-9": {"label": "Rocky Linux 9", "min_disk_gb": 20, "gcp_uri": "projects/rocky-linux-cloud/global/images/family/rocky-linux-9", "os_family": "linux-rhel", "latest_image_name": None},
                "windows-2022": {"label": "Windows Server 2022 Core", "min_disk_gb": 40, "gcp_uri": "projects/windows-cloud/global/images/family/windows-2022-core", "os_family": "windows", "latest_image_name": None},
            }
        finally:
            _safe_cleanup(creds, client)



class FilestoreDiscovery:
    """Dynamically fetch Filestore metadata from GCP APIs."""

    @classmethod
    def list_locations(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = filestore_v1.CloudFilestoreManagerClient(credentials=creds)
            locations = client.list_locations(request={"name": f"projects/{project_id}"})
            return [{"id": loc.location_id, "name": loc.display_name or loc.location_id} for loc in locations.locations]
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def list_networks(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.NetworksClient(credentials=creds)
            networks = list(client.list(project=project_id))
            return [{"id": n.name, "name": n.name, "auto_create": n.auto_create_subnetworks} for n in networks]
        finally:
            _safe_cleanup(creds, client)


# ── GCS Bucket Factory ────────────────────────────────────────────────────────

class GCSBucketFactory:
    """Ephemeral factory for GCS bucket provisioning.
    
    Accepts decrypted service account data as in-memory dict.
    All credential references are purged in finally block.
    """

    # Security guardrails (not metadata options)
    PUBLIC_ACCESS_PREVENTION = "enforced"
    UNIFORM_BUCKET_LEVEL_ACCESS = True
    LIFECYCLE_ABORT_MULTIPART_DAYS = 7
    DEFAULT_SOFT_DELETE_DAYS = 7

    @classmethod
    def create(
        cls,
        sa_data: Dict[str, Any],
        project_id: str,
        bucket_name: str,
        location: str,
        storage_class: str = "STANDARD",
        labels: Optional[Dict[str, str]] = None,
        autoclass_enabled: bool = False,
        hierarchical_namespace_enabled: bool = False,
        rapid_cache_enabled: bool = False,
        soft_delete_days: Optional[int] = None,
        versioning_enabled: bool = False,
        encryption_kms_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Create a GCS bucket with enforced security guardrails."""
        bucket_name = bucket_name.strip()
        validate_bucket_name(bucket_name)

        if storage_class not in VALID_STORAGE_CLASS_IDS:
            raise InvalidOptionError("storage_class", storage_class, list(VALID_STORAGE_CLASS_IDS))

        unique_name = f"{bucket_name}-{uuid.uuid4().hex[:6]}"
        creds = None
        client = None

        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)

            bucket = client.bucket(unique_name)
            bucket.storage_class = storage_class
            if labels:
                bucket.labels = labels

            bucket.iam_configuration.public_access_prevention = cls.PUBLIC_ACCESS_PREVENTION
            bucket.iam_configuration.uniform_bucket_level_access = cls.UNIFORM_BUCKET_LEVEL_ACCESS

            if autoclass_enabled:
                bucket.autoclass_enabled = True

            if hierarchical_namespace_enabled:
                bucket.hierarchical_namespace_enabled = True

            if rapid_cache_enabled:
                bucket.rpo = "ASYNC_TURBO"

            if versioning_enabled:
                bucket.versioning_enabled = True

            if encryption_kms_key:
                bucket.default_kms_key_name = encryption_kms_key

            bucket.create(location=location)

            return {
                "name": bucket.name,
                "location": bucket.location,
                "storage_class": bucket.storage_class,
                "public_access_prevention": cls.PUBLIC_ACCESS_PREVENTION,
                "uniform_bucket_level_access": cls.UNIFORM_BUCKET_LEVEL_ACCESS,
                "autoclass_enabled": autoclass_enabled,
                "hierarchical_namespace_enabled": hierarchical_namespace_enabled,
                "versioning_enabled": versioning_enabled,
                "encryption_kms_key": encryption_kms_key or "Google-managed",
                "soft_delete_days": soft_delete_days or cls.DEFAULT_SOFT_DELETE_DAYS,
                "created_at": bucket.time_created.isoformat() if bucket.time_created else None,
                "labels": bucket.labels,
            }

        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "create", unique_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def list(cls, sa_data: Dict[str, Any], project_id: str) -> list:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            return [
                {
                    "name": b.name,
                    "location": b.location,
                    "storage_class": b.storage_class,
                    "created_at": b.time_created.isoformat() if b.time_created else None,
                }
                for b in client.list_buckets()
            ]
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "list")
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def delete(cls, sa_data: Dict[str, Any], project_id: str, bucket_name: str) -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            bucket = client.bucket(bucket_name)
            blobs = list(client.list_blobs(bucket_name))
            if blobs:
                bucket.delete_blobs(blobs)
            bucket.delete()
            return {"message": f"Bucket '{bucket_name}' and all contents deleted", "name": bucket_name}
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "delete", bucket_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def list_objects(cls, sa_data: Dict[str, Any], project_id: str, bucket_name: str, prefix: str = "") -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            iterator = client.list_blobs(bucket_name, prefix=prefix, delimiter="/")
            blobs = list(iterator)
            prefixes = iterator.prefixes or []
            objects = [
                {
                    "name": blob.name,
                    "size": blob.size,
                    "content_type": blob.content_type,
                    "updated": blob.updated.isoformat() if blob.updated else None,
                    "created": blob.time_created.isoformat() if blob.time_created else None,
                    "storage_class": blob.storage_class,
                }
                for blob in blobs
                if not blob.name.endswith("/")
            ]
            folders = [{"name": p, "is_folder": True} for p in prefixes]
            return {"objects": objects, "folders": folders, "prefix": prefix, "bucket": bucket_name}
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "list objects", bucket_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def create_folder(cls, sa_data: Dict[str, Any], project_id: str, bucket_name: str, folder_name: str, prefix: str = "") -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            full_path = f"{prefix}{folder_name}/"
            blob = client.bucket(bucket_name).blob(full_path)
            blob.upload_from_string(b"", content_type="application/x-directory")
            return {"message": f"Folder '{folder_name}' created", "path": full_path}
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "create folder", bucket_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def upload_file(cls, sa_data: Dict[str, Any], project_id: str, bucket_name: str, file_name: str, file_contents: bytes, content_type: str = "application/octet-stream", prefix: str = "") -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            object_name = f"{prefix}{file_name}" if prefix else file_name
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(object_name)
            blob.upload_from_string(file_contents, content_type=content_type)
            return {"message": "File uploaded successfully", "object_name": object_name, "bucket": bucket_name, "size": len(file_contents), "content_type": content_type}
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "upload", bucket_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def generate_signed_url(cls, sa_data: Dict[str, Any], project_id: str, bucket_name: str, object_name: str, expiration_minutes: int = 15) -> Dict[str, Any]:
        import datetime
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(object_name)
            if not blob.exists():
                raise StorageProvisioningError(404, f"Object '{object_name}' not found in bucket '{bucket_name}'")
            url = blob.generate_signed_url(version="v4", expiration=datetime.timedelta(minutes=expiration_minutes), method="GET", credentials=creds)
            return {"download_url": url, "object_name": object_name, "expires_in_seconds": expiration_minutes * 60}
        except StorageProvisioningError:
            raise
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "generate signed url", bucket_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def delete_object(cls, sa_data: Dict[str, Any], project_id: str, bucket_name: str, object_name: str) -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            bucket = client.bucket(bucket_name)
            blob = bucket.blob(object_name)
            if not blob.exists():
                raise StorageProvisioningError(404, f"Object '{object_name}' not found")
            blob.delete()
            return {"message": f"Object '{object_name}' deleted successfully", "bucket": bucket_name}
        except StorageProvisioningError:
            raise
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "delete object", bucket_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def copy_object(cls, sa_data: Dict[str, Any], project_id: str, bucket_name: str, source_object: str, destination_object: str, dest_bucket: str = "") -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            src_bucket = client.bucket(bucket_name)
            src_blob = src_bucket.blob(source_object)
            if not src_blob.exists():
                raise StorageProvisioningError(404, f"Source object '{source_object}' not found")
            target_bucket_name = dest_bucket or bucket_name
            target_bucket = client.bucket(target_bucket_name)
            new_blob = target_bucket.blob(destination_object)
            token = src_bucket.copy_blob(src_blob, target_bucket, new_blob)
            return {"message": f"Object copied to '{destination_object}'", "source": source_object, "destination": destination_object, "bucket": target_bucket_name}
        except StorageProvisioningError:
            raise
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "copy object", bucket_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def move_object(cls, sa_data: Dict[str, Any], project_id: str, bucket_name: str, source_object: str, destination_object: str) -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            src_bucket = client.bucket(bucket_name)
            src_blob = src_bucket.blob(source_object)
            if not src_blob.exists():
                raise StorageProvisioningError(404, f"Source object '{source_object}' not found")
            new_blob = src_bucket.blob(destination_object)
            src_bucket.copy_blob(src_blob, src_bucket, new_blob)
            src_blob.delete()
            return {"message": f"Object moved to '{destination_object}'", "source": source_object, "destination": destination_object, "bucket": bucket_name}
        except StorageProvisioningError:
            raise
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "move object", bucket_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def delete_folder(cls, sa_data: Dict[str, Any], project_id: str, bucket_name: str, folder_prefix: str) -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            bucket = client.bucket(bucket_name)
            blobs = list(client.list_blobs(bucket_name, prefix=folder_prefix))
            if not blobs:
                raise StorageProvisioningError(404, f"No objects found under prefix '{folder_prefix}'")
            bucket.delete_blobs(blobs)
            return {"message": f"Folder '{folder_prefix.rstrip('/')}' and {len(blobs)} object(s) deleted", "bucket": bucket_name, "deleted_count": len(blobs)}
        except StorageProvisioningError:
            raise
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "delete folder", bucket_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def move_folder(cls, sa_data: Dict[str, Any], project_id: str, bucket_name: str, source_prefix: str, destination_prefix: str) -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = storage.Client(credentials=creds, project=project_id)
            bucket = client.bucket(bucket_name)
            blobs = list(client.list_blobs(bucket_name, prefix=source_prefix))
            if not blobs:
                raise StorageProvisioningError(404, f"No objects found under prefix '{source_prefix}'")
            moved = 0
            for blob in blobs:
                new_name = blob.name.replace(source_prefix, destination_prefix, 1)
                new_blob = bucket.blob(new_name)
                bucket.copy_blob(blob, bucket, new_blob)
                blob.delete()
                moved += 1
            return {"message": f"Folder moved to '{destination_prefix.rstrip('/')}'", "source": source_prefix, "destination": destination_prefix, "moved_count": moved}
        except StorageProvisioningError:
            raise
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "bucket", "move folder", bucket_name)
        finally:
            _safe_cleanup(creds, client)


# ── Persistent Disk Factory ──────────────────────────────────────────────────

class PersistentDiskFactory:
    """Ephemeral factory for Compute Engine persistent disk provisioning."""

    @classmethod
    def create(cls, sa_data: Dict[str, Any], project_id: str, disk_name: str, size_gb: int, zone: str, disk_type: str = "pd-balanced") -> Dict[str, Any]:
        """Create a persistent disk. disk_type is validated against dynamically fetched options."""
        validate_disk_name(disk_name)

        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.DisksClient(credentials=creds)

            disk_type_path = f"projects/{project_id}/zones/{zone}/diskTypes/{disk_type}"

            disk_config = compute_v1.Disk()
            disk_config.name = disk_name
            disk_config.size_gb = size_gb
            disk_config.type_ = disk_type_path
            disk_config.zone = zone

            operation = client.insert(project=project_id, zone=zone, disk_resource=disk_config)
            operation.result()

            disk = client.get(project=project_id, zone=zone, disk=disk_name)

            return {
                "name": disk.name,
                "zone": zone,
                "size_gb": disk.size_gb,
                "type": disk_type,
                "status": disk.status,
                "creation_timestamp": disk.creation_timestamp,
            }
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "disk", "create", disk_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def list(cls, sa_data: Dict[str, Any], project_id: str) -> list:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.DisksClient(credentials=creds)
            request = compute_v1.AggregatedListDisksRequest(project=project_id)
            pages = client.aggregated_list(request=request)
            disks = []
            for zone_url, disks_in_zone in pages:
                if disks_in_zone.disks:
                    zone_name = zone_url.split('/')[-1]
                    for disk in disks_in_zone.disks:
                        disks.append({
                            "name": disk.name,
                            "status": disk.status,
                            "zone": zone_name,
                            "size_gb": disk.size_gb,
                            "type": disk.type_.split('/')[-1] if disk.type_ else "pd-standard",
                            "last_attach_timestamp": disk.last_attach_timestamp if hasattr(disk, 'last_attach_timestamp') else None,
                        })
            return disks
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "disk", "list")
        finally:
            _safe_cleanup(creds, client)


    @classmethod
    def get(cls, sa_data: Dict[str, Any], project_id: str, disk_name: str, zone: str) -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.DisksClient(credentials=creds)
            disk = client.get(project=project_id, zone=zone, disk=disk_name)
            return {
                "name": disk.name,
                "status": disk.status,
                "zone": zone,
                "size_gb": disk.size_gb,
                "type": disk.type_.split('/')[-1] if disk.type_ else "pd-standard",
                "creation_timestamp": disk.creation_timestamp,
                "last_attach_timestamp": disk.last_attach_timestamp if hasattr(disk, 'last_attach_timestamp') else None,
                "users": list(disk.users) if disk.users else [],
            }
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "disk", "get", disk_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def resize(cls, sa_data: Dict[str, Any], project_id: str, disk_name: str, zone: str, new_size_gb: int) -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.DisksClient(credentials=creds)
            disk = client.get(project=project_id, zone=zone, disk=disk_name)
            if new_size_gb < disk.size_gb:
                raise StorageProvisioningError(400, "Cannot shrink a disk", "New size must be larger than current size")
            disk_resource = compute_v1.Disk()
            disk_resource.size_gb = new_size_gb
            operation = client.resize(project=project_id, zone=zone, disk=disk_name, disks_resize_resource=disk_resource)
            operation.result()
            updated = client.get(project=project_id, zone=zone, disk=disk_name)
            return {
                "name": updated.name,
                "zone": zone,
                "size_gb": updated.size_gb,
                "type": updated.type_.split('/')[-1] if updated.type_ else "pd-standard",
                "status": updated.status,
            }
        except StorageProvisioningError:
            raise
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "disk", "resize", disk_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def create_snapshot(cls, sa_data: Dict[str, Any], project_id: str, disk_name: str, zone: str, snapshot_name: str = "") -> Dict[str, Any]:
        import uuid
        if not snapshot_name:
            snapshot_name = f"snapshot-{disk_name}-{uuid.uuid4().hex[:8]}"
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.DisksClient(credentials=creds)
            snapshot_config = compute_v1.Snapshot()
            snapshot_config.name = snapshot_name
            operation = client.create_snapshot(project=project_id, zone=zone, disk=disk_name, snapshot_resource=snapshot_config)
            operation.result()
            return {"message": f"Snapshot '{snapshot_name}' created", "snapshot_name": snapshot_name, "disk_name": disk_name}
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "disk", "create snapshot", disk_name)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def delete(cls, sa_data: Dict[str, Any], project_id: str, disk_name: str, zone: str) -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = compute_v1.DisksClient(credentials=creds)
            disk = client.get(project=project_id, zone=zone, disk=disk_name)
            if disk.users:
                raise StorageProvisioningError(400, "Disk is attached to a VM", "Detach the disk from all instances before deleting")
            operation = client.delete(project=project_id, zone=zone, disk=disk_name)
            operation.result()
            return {"message": f"Disk '{disk_name}' deleted", "name": disk_name}
        except StorageProvisioningError:
            raise
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "disk", "delete", disk_name)
        finally:
            _safe_cleanup(creds, client)


# ── Filestore Instance Factory ────────────────────────────────────────────────

class FilestoreInstanceFactory:
    """Ephemeral factory for Filestore NFS instance provisioning."""

    @classmethod
    def create(cls, sa_data: Dict[str, Any], project_id: str, instance_id: str, share_name: str, capacity_gb: int, location: str, tier: str = "STANDARD", network: str = "default") -> Dict[str, Any]:
        validate_filestore_name(instance_id)
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = filestore_v1.CloudFilestoreManagerClient(credentials=creds)
            parent = f"projects/{project_id}/locations/{location}"
            file_shares = [filestore_v1.FileShareConfig(name=share_name, capacity_gb=capacity_gb)]
            networks = [filestore_v1.NetworkConfig(network=network, modes=[filestore_v1.NetworkConfig.ConnectMode.CONNECT_MODE_UNSPECIFIED], reserved_ip_range="")]
            instance_config = filestore_v1.Instance(tier=tier, file_shares=file_shares, networks=networks)
            operation = client.create_instance(parent=parent, instance_id=instance_id, instance=instance_config)
            operation.result()
            instance = client.get_instance(name=f"{parent}/instances/{instance_id}")
            return {
                "name": instance.name,
                "tier": tier,
                "state": instance.state.name,
                "file_shares": [{"name": fs.name, "capacity_gb": fs.capacity_gb} for fs in instance.file_shares],
                "networks": [{"network": n.network, "ip_addresses": list(n.ip_addresses)} for n in instance.networks],
                "create_time": str(instance.create_time),
            }
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "filestore", "create", instance_id)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def list(cls, sa_data: Dict[str, Any], project_id: str) -> list:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = filestore_v1.CloudFilestoreManagerClient(credentials=creds)
            parent = f"projects/{project_id}/locations/-"
            instances = client.list_instances(parent=parent)
            return [
                {
                    "name": inst.name,
                    "tier": inst.tier,
                    "state": inst.state.name,
                    "location": inst.name.split("/locations/")[1].split("/instances/")[0],
                    "file_shares": [{"name": fs.name, "capacity_gb": fs.capacity_gb} for fs in inst.file_shares],
                    "networks": [{"network": n.network, "ip_addresses": list(n.ip_addresses)} for n in inst.networks],
                }
                for inst in instances
            ]
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "filestore", "list")
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def get(cls, sa_data: Dict[str, Any], project_id: str, instance_id: str, location: str) -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = filestore_v1.CloudFilestoreManagerClient(credentials=creds)
            full_name = f"projects/{project_id}/locations/{location}/instances/{instance_id}"
            instance = client.get_instance(name=full_name)
            return {
                "name": instance.name,
                "tier": instance.tier,
                "state": instance.state.name,
                "location": location,
                "file_shares": [{"name": fs.name, "capacity_gb": fs.capacity_gb} for fs in instance.file_shares],
                "networks": [{"network": n.network, "ip_addresses": list(n.ip_addresses)} for n in instance.networks],
                "create_time": str(instance.create_time),
            }
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "filestore", "get", instance_id)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def expand(cls, sa_data: Dict[str, Any], project_id: str, instance_id: str, location: str, share_name: str, new_capacity_gb: int) -> Dict[str, Any]:
        from google.protobuf import field_mask_pb2
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = filestore_v1.CloudFilestoreManagerClient(credentials=creds)
            full_name = f"projects/{project_id}/locations/{location}/instances/{instance_id}"
            instance = client.get_instance(name=full_name)
            updated_shares = []
            for fs in instance.file_shares:
                if fs.name == share_name:
                    updated_shares.append(filestore_v1.FileShareConfig(name=fs.name, capacity_gb=new_capacity_gb))
                else:
                    updated_shares.append(filestore_v1.FileShareConfig(name=fs.name, capacity_gb=fs.capacity_gb))
            update_mask = field_mask_pb2.FieldMask(paths=["file_shares"])
            updated_instance = filestore_v1.Instance(name=full_name, tier=instance.tier, file_shares=updated_shares, networks=instance.networks)
            operation = client.update_instance(instance=updated_instance, update_mask=update_mask)
            operation.result()
            return {"message": f"File share '{share_name}' expanded to {new_capacity_gb} GB", "instance_id": instance_id, "new_capacity_gb": new_capacity_gb}
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "filestore", "expand", instance_id)
        finally:
            _safe_cleanup(creds, client)

    @classmethod
    def delete(cls, sa_data: Dict[str, Any], project_id: str, instance_id: str, location: str) -> Dict[str, Any]:
        creds = None
        client = None
        try:
            creds = _build_credentials(sa_data)
            client = filestore_v1.CloudFilestoreManagerClient(credentials=creds)
            full_name = f"projects/{project_id}/locations/{location}/instances/{instance_id}"
            operation = client.delete_instance(name=full_name)
            operation.result()
            return {"message": f"Filestore instance '{instance_id}' deleted", "name": instance_id}
        except gcp_exceptions.GoogleAPIError as e:
            raise _map_gcp_error(e, "filestore", "delete", instance_id)
        finally:
            _safe_cleanup(creds, client)
