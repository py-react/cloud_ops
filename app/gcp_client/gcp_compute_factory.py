import logging
import gc
from typing import Any, Dict, List, Optional
from contextlib import contextmanager

from google.cloud import compute_v1
from google.oauth2 import service_account
from google.api_core import exceptions as gcp_exceptions

logger = logging.getLogger(__name__)


class GCPProvisioningError(Exception):
    def __init__(self, code: int, message: str, details: str = ""):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class GCPInstanceFactory:
    _GLOBAL_OS_IMAGES = {
        "Debian 12": {"image_id": "projects/debian-cloud/global/images/family/debian-12", "name": "debian-12"},
        "Ubuntu 22.04 LTS": {"image_id": "projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts", "name": "ubuntu-2204-lts"},
        "Rocky Linux 9": {"image_id": "projects/rocky-linux-cloud/global/images/family/rocky-linux-9", "name": "rocky-linux-9"},
        "Windows Server 2022 Core": {"image_id": "projects/windows-cloud/global/images/family/windows-2022-core", "name": "windows-2022-core"},
    }

    REGIONAL_OS_IMAGES: dict = {
        "asia-south1": _GLOBAL_OS_IMAGES,
        "asia-south2": _GLOBAL_OS_IMAGES,
        "asia-southeast1": _GLOBAL_OS_IMAGES,
        "asia-northeast1": _GLOBAL_OS_IMAGES,
        "asia-northeast3": _GLOBAL_OS_IMAGES,
        "australia-southeast1": _GLOBAL_OS_IMAGES,
        "us-central1": _GLOBAL_OS_IMAGES,
        "us-west1": _GLOBAL_OS_IMAGES,
        "europe-west1": _GLOBAL_OS_IMAGES,
        "europe-west2": _GLOBAL_OS_IMAGES,
        "europe-west3": _GLOBAL_OS_IMAGES,
    }

    @classmethod
    def _build_credentials(cls, sa_data: Dict[str, Any]) -> service_account.Credentials:
        return service_account.Credentials.from_service_account_info(
            sa_data,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

    @classmethod
    def _safe_cleanup(cls, *refs: Any) -> None:
        for ref in refs:
            if ref is not None:
                del ref
        gc.collect()

    @classmethod
    @contextmanager
    def _gcp_client(cls, client_cls, sa_data: Dict[str, Any]):
        creds = cls._build_credentials(sa_data)
        client = client_cls(credentials=creds)
        try:
            yield client
        finally:
            cls._safe_cleanup(creds, client)

    @classmethod
    def _map_gcp_error(cls, exc: Exception, resource_type: str, action: str, name: str = "") -> GCPProvisioningError:
        if isinstance(exc, gcp_exceptions.Conflict) or (hasattr(exc, 'code') and exc.code == 409):
            return GCPProvisioningError(409, f"{resource_type} '{name}' already exists", str(exc))
        if isinstance(exc, gcp_exceptions.Forbidden) or (hasattr(exc, 'code') and exc.code == 403):
            return GCPProvisioningError(403, f"Insufficient permissions to {action} {resource_type}", str(exc))
        if isinstance(exc, gcp_exceptions.TooManyRequests) or (hasattr(exc, 'code') and exc.code == 429):
            return GCPProvisioningError(429, f"Quota exceeded for {resource_type}", str(exc))
        if isinstance(exc, gcp_exceptions.NotFound) or (hasattr(exc, 'code') and exc.code == 404):
            return GCPProvisioningError(404, f"{resource_type} '{name}' not found", str(exc))
        if isinstance(exc, gcp_exceptions.InvalidArgument) or (hasattr(exc, 'code') and exc.code == 400):
            return GCPProvisioningError(400, f"Invalid request for {resource_type} {action}", str(exc))
        return GCPProvisioningError(500, f"Failed to {action} {resource_type}", str(exc))

    @classmethod
    def list_instances(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        with cls._gcp_client(compute_v1.InstancesClient, sa_data) as client:
            try:
                request_list = compute_v1.AggregatedListInstancesRequest(project=project_id)
                pager = client.aggregated_list(request=request_list)
                instances = []
                for zone, response in pager:
                    if response.instances:
                        zone_name = zone.split("/")[-1]
                        for instance in response.instances:
                            external_ip = "N/A"
                            internal_ip = "N/A"
                            for interface in instance.network_interfaces:
                                internal_ip = interface.network_i_p
                                for access_config in interface.access_configs:
                                    if access_config.nat_i_p:
                                        external_ip = access_config.nat_i_p
                            instances.append({
                                "name": instance.name,
                                "status": instance.status,
                                "zone": zone_name,
                                "machine_type": instance.machine_type.split("/")[-1],
                                "internal_ip": internal_ip,
                                "external_ip": external_ip,
                                "creation_timestamp": instance.creation_timestamp,
                            })
                return instances
            except Exception as e:
                raise cls._map_gcp_error(e, "instances", "list")

    @classmethod
    def get_instance(cls, sa_data: Dict[str, Any], project_id: str, zone: str, instance_name: str) -> Dict[str, Any]:
        with cls._gcp_client(compute_v1.InstancesClient, sa_data) as client:
            try:
                instance = client.get(project=project_id, zone=zone, instance=instance_name)
                external_ip = None
                internal_ip = None
                if instance.network_interfaces:
                    internal_ip = instance.network_interfaces[0].network_i_p
                    if instance.network_interfaces[0].access_configs:
                        external_ip = instance.network_interfaces[0].access_configs[0].nat_i_p

                return {
                    "name": instance.name,
                    "status": instance.status,
                    "zone": zone,
                    "machine_type": instance.machine_type.split("/")[-1],
                    "internal_ip": internal_ip,
                    "external_ip": external_ip,
                    "creation_timestamp": instance.creation_timestamp,
                    "description": instance.description,
                    "tags": [item.key for item in instance.metadata.items] if instance.metadata else [],
                    "disks": [
                        {
                            "device_name": disk.device_name,
                            "type": disk.type_,
                            "boot": disk.boot,
                            "size_gb": disk.disk_size_gb
                        } for disk in instance.disks
                    ],
                    "network_interfaces": [
                        {
                            "network": ni.network.split("/")[-1],
                            "ip": ni.network_i_p,
                            "external_ip": ni.access_configs[0].nat_i_p if ni.access_configs else None
                        } for ni in instance.network_interfaces
                    ],
                    "gcp_resource_id": str(instance.id),
                }
            except Exception as e:
                raise cls._map_gcp_error(e, "instance", "get", instance_name)

    @classmethod
    def create_instance(
        cls,
        sa_data: Dict[str, Any],
        project_id: str,
        instance_name: str,
        zone: str,
        machine_type: str,
        boot_disk_size_gb: int,
        boot_disk_type: str,
        os_image: str,
        metadata_items: List[Dict[str, str]],
        target_tags: Optional[List[str]] = None,
        firewall_rule_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        with cls._gcp_client(compute_v1.InstancesClient, sa_data) as client:
            try:
                instance = compute_v1.Instance()
                instance.name = instance_name
                instance.machine_type = f"zones/{zone}/machineTypes/{machine_type}"

                network_interface = compute_v1.NetworkInterface()
                network_interface.network = "global/networks/default"
                access_config = compute_v1.AccessConfig()
                access_config.name = "External NAT"
                access_config.type_ = "ONE_TO_ONE_NAT"
                network_interface.access_configs = [access_config]
                instance.network_interfaces = [network_interface]

                disk = compute_v1.AttachedDisk()
                disk.boot = True
                disk.auto_delete = True
                initialize_params = compute_v1.AttachedDiskInitializeParams()
                initialize_params.source_image = os_image
                initialize_params.disk_size_gb = boot_disk_size_gb
                initialize_params.disk_type = f"zones/{zone}/diskTypes/{boot_disk_type}"
                disk.initialize_params = initialize_params
                instance.disks = [disk]

                instance.metadata = compute_v1.Metadata()
                instance.metadata.items = [
                    compute_v1.Items(key=item["key"], value=item["value"])
                    for item in metadata_items
                ]

                if target_tags:
                    instance.tags = compute_v1.Tags(items=target_tags)

                operation = client.insert(
                    project=project_id,
                    zone=zone,
                    instance_resource=instance
                )

                # Inject the Windows per-instance firewall before waiting so both ops run concurrently
                if firewall_rule_name and target_tags:
                    try:
                        with cls._gcp_client(compute_v1.FirewallsClient, sa_data) as fw_client:
                            individual_firewall = compute_v1.Firewall(
                                name=firewall_rule_name,
                                direction="INGRESS",
                                allowed=[compute_v1.Allowed(I_p_protocol="tcp", ports=["3389"])],
                                source_ranges=["0.0.0.0/0"],
                                target_tags=[t for t in target_tags if t.startswith("rdp-target-")],
                                network=f"projects/{project_id}/global/networks/default",
                                description=f"Automated isolated RDP ingress rule for {instance_name}"
                            )
                            logger.info(f"Creating Windows firewall rule: {firewall_rule_name}")
                            fw_op = fw_client.insert(project=project_id, firewall_resource=individual_firewall)
                            fw_op.result()
                            logger.info(f"Firewall rule {firewall_rule_name} initialized")
                    except Exception as fw_err:
                        logger.error(f"Failed to create firewall rule {firewall_rule_name}: {fw_err}")

                operation.result()
                logger.info(f"GCP Instance {instance_name} fully deployed")

                instance_data = client.get(project=project_id, zone=zone, instance=instance_name)
                external_ip = None
                internal_ip = None
                if instance_data.network_interfaces:
                    internal_ip = instance_data.network_interfaces[0].network_i_p
                    if instance_data.network_interfaces[0].access_configs:
                        external_ip = instance_data.network_interfaces[0].access_configs[0].nat_i_p

                return {
                    "name": instance_name,
                    "status": "RUNNING",
                    "internal_ip": internal_ip,
                    "external_ip": external_ip,
                    "gcp_resource_id": str(instance_data.id),
                }
            except Exception as e:
                raise cls._map_gcp_error(e, "instance", "create", instance_name)

    @classmethod
    def start_instance(cls, sa_data: Dict[str, Any], project_id: str, zone: str, instance_name: str) -> Dict[str, Any]:
        with cls._gcp_client(compute_v1.InstancesClient, sa_data) as client:
            try:
                operation = client.start(project=project_id, zone=zone, instance=instance_name)
                return {"message": f"VM '{instance_name}' is starting", "status": "STARTING", "operation_id": operation.name}
            except Exception as e:
                raise cls._map_gcp_error(e, "instance", "start", instance_name)

    @classmethod
    def stop_instance(cls, sa_data: Dict[str, Any], project_id: str, zone: str, instance_name: str) -> Dict[str, Any]:
        with cls._gcp_client(compute_v1.InstancesClient, sa_data) as client:
            try:
                operation = client.stop(project=project_id, zone=zone, instance=instance_name)
                return {"message": f"VM '{instance_name}' is stopping", "status": "STOPPING", "operation_id": operation.name}
            except Exception as e:
                raise cls._map_gcp_error(e, "instance", "stop", instance_name)

    @classmethod
    def delete_instance(cls, sa_data: Dict[str, Any], project_id: str, zone: str, instance_name: str) -> Dict[str, Any]:
        with cls._gcp_client(compute_v1.InstancesClient, sa_data) as client:
            try:
                operation = client.delete(project=project_id, zone=zone, instance=instance_name)
                operation.result()

                firewall_rule_name = f"allow-rdp-{instance_name}"
                try:
                    with cls._gcp_client(compute_v1.FirewallsClient, sa_data) as fw_client:
                        fw_operation = fw_client.delete(project=project_id, firewall=firewall_rule_name)
                        fw_operation.result()
                        logger.info(f"Cleaned up per-instance firewall rule {firewall_rule_name}")
                except Exception:
                    pass

                return {"message": f"VM '{instance_name}' deletion completed", "instance_name": instance_name}
            except Exception as e:
                raise cls._map_gcp_error(e, "instance", "delete", instance_name)


class ComputeDiscovery:
    """Dynamically fetch Compute Engine metadata from GCP APIs."""

    @classmethod
    @contextmanager
    def _gcp_client(cls, client_cls, sa_data: Dict[str, Any]):
        creds = GCPInstanceFactory._build_credentials(sa_data)
        client = client_cls(credentials=creds)
        try:
            yield client
        finally:
            GCPInstanceFactory._safe_cleanup(creds, client)

    @classmethod
    def list_regions(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        """Fetch all available regions for the project."""
        try:
            with cls._gcp_client(compute_v1.RegionsClient, sa_data) as client:
                regions = list(client.list(project=project_id))
                return [{"id": r.name, "name": r.name.upper(), "zones_count": len(r.zones) if r.zones else 0} for r in regions]
        except Exception as e:
            logger.error(f"Failed to fetch regions: {e}")
            return []

    @classmethod
    def list_zones(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        """Fetch all available zones for the project."""
        try:
            with cls._gcp_client(compute_v1.ZonesClient, sa_data) as client:
                zones = list(client.list(project=project_id))
                return [{"id": z.name, "name": z.name, "region": z.region.split("/")[-1] if z.region else ""} for z in zones]
        except Exception as e:
            logger.error(f"Failed to fetch zones: {e}")
            return []

    @classmethod
    def list_disk_types(cls, sa_data: Dict[str, Any], project_id: str, zone: str) -> List[Dict[str, Any]]:
        """Fetch available disk types for a specific zone."""
        try:
            with cls._gcp_client(compute_v1.DiskTypesClient, sa_data) as client:
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

    @classmethod
    def list_machine_types(cls, sa_data: Dict[str, Any], project_id: str, zone: str) -> List[Dict[str, Any]]:
        """Fetch available machine types for a specific zone."""
        FREE_TIER_MACHINE_TYPES = {
            "e2-micro": ["us-central1-a", "us-central1-b", "us-central1-c", "us-central1-f",
                        "us-east1-b", "us-east1-c", "us-east1-d",
                        "us-west1-a", "us-west1-b", "us-west1-c"]
        }
        try:
            with cls._gcp_client(compute_v1.MachineTypesClient, sa_data) as client:
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

    @classmethod
    def list_images(cls, sa_data: Dict[str, Any], project_id: str) -> List[Dict[str, Any]]:
        """Fetch available image families from standard cloud image projects."""
        try:
            with cls._gcp_client(compute_v1.ImagesClient, sa_data) as client:
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

    @classmethod
    def get_live_image_catalog(cls, sa_data: Dict[str, Any], project_id: str) -> Dict[str, Dict[str, Any]]:
        """Fetch live GCP image catalog with official API resolution."""
        try:
            with cls._gcp_client(compute_v1.ImagesClient, sa_data) as client:
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
