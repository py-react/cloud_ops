import logging
from typing import Any, Dict, List, Optional
from contextlib import contextmanager

import boto3
from botocore.exceptions import ClientError

from app.aws_client.aws_auth import aws_client, aws_resource

logger = logging.getLogger(__name__)


class EC2ProvisioningError(Exception):
    def __init__(self, code: int, message: str, details: str = ""):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class EC2InstanceFactory:
    # Helper base maps for identical regions to reduce copy-paste duplication
    _US_EAST_BASE = {
        "Amazon Linux 2023": {"image_id": "ami-083eb03ee8ae87bb1", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
        "Ubuntu 24.04 LTS":  {"image_id": "ami-0f8a61b66d1accaee", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
        "Ubuntu 22.04 LTS":  {"image_id": "ami-0d7405d05f836d0d4", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
        "Debian 12":         {"image_id": "ami-0f12b789ef9e8d242", "name": "debian-12-backports-amd64-20260601-2496"},
    }

    _US_WEST_BASE = {
        "Amazon Linux 2023": {"image_id": "ami-0a61c0ba9d612c9c9", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
        "Ubuntu 24.04 LTS":  {"image_id": "ami-032cd1a6d943449a4", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
        "Ubuntu 22.04 LTS":  {"image_id": "ami-006fec91d8fcb1812", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
        "Debian 12":         {"image_id": "ami-0fa0fcf53ea0880ad", "name": "debian-12-backports-amd64-20260601-2496"},
    }

    # Per-region OS → AMI mapping (queried 2026-06-15, updated regularly)
    REGIONAL_OS_IMAGES: dict = {
        "ap-south-1": {
            "Amazon Linux 2023": {"image_id": "ami-008fcda0e14df9543", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
            "Ubuntu 24.04 LTS":  {"image_id": "ami-006f82a1d5a27da54", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
            "Ubuntu 22.04 LTS":  {"image_id": "ami-0326c8c1e2d6bf78c", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
            "Debian 12":         {"image_id": "ami-0602ab4cab440ed0a", "name": "debian-12-backports-amd64-20260601-2496"},
        },
        "ap-south-2": {
            "Amazon Linux 2023": {"image_id": "ami-062de6a77703795e2", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
            "Ubuntu 24.04 LTS":  {"image_id": "ami-03f1d2b3639314198", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
            "Ubuntu 22.04 LTS":  {"image_id": "ami-0e13f22a9a802a6d3", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
            "Debian 12":         {"image_id": "ami-0d8062f39d717788a", "name": "debian-12-backports-amd64-20260601-2496"},
        },
        "ap-southeast-1": {
            "Amazon Linux 2023": {"image_id": "ami-060de26aaf47d9bcd", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
            "Ubuntu 24.04 LTS":  {"image_id": "ami-03acbba64aef9bf5c", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
            "Ubuntu 22.04 LTS":  {"image_id": "ami-06c2685db9a20aac5", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
            "Debian 12":         {"image_id": "ami-0abbbda664cb1cde2", "name": "debian-12-backports-amd64-20260601-2496"},
        },
        "ap-northeast-1": {
            "Amazon Linux 2023": {"image_id": "ami-035adaa9c1e774480", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
            "Ubuntu 24.04 LTS":  {"image_id": "ami-05f4eb3328c0dabc5", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
            "Ubuntu 22.04 LTS":  {"image_id": "ami-091de58da07595152", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
            "Debian 12":         {"image_id": "ami-095266aff722ae2b7", "name": "debian-12-backports-amd64-20260601-2496"},
        },
        "ap-northeast-2": {
            "Amazon Linux 2023": {"image_id": "ami-0c403d5d2023df54e", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
            "Ubuntu 24.04 LTS":  {"image_id": "ami-0e4ab31f1847c850c", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
            "Ubuntu 22.04 LTS":  {"image_id": "ami-0afe1fd15675c3f15", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
            "Debian 12":         {"image_id": "ami-035cdcb68f941467f", "name": "debian-12-backports-amd64-20260601-2496"},
        },
        "ap-southeast-2": {
            "Amazon Linux 2023": {"image_id": "ami-04ad1ab9bb4d65c44", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
            "Ubuntu 24.04 LTS":  {"image_id": "ami-020728ad6199d7fa0", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
            "Ubuntu 22.04 LTS":  {"image_id": "ami-0111f46977d33b84b", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
            "Debian 12":         {"image_id": "ami-07e609aaed540ccc3", "name": "debian-12-backports-amd64-20260601-2496"},
        },
        "us-east-1": {**_US_EAST_BASE, "Rocky Linux 9": {"image_id": "ami-0e71979b7a61175fc", "name": "rocky-linux-9-ec2-9.5-20250121-x86_64"}},
        "us-east-2": _US_EAST_BASE,
        "us-west-1": _US_WEST_BASE,
        "us-west-2": _US_WEST_BASE,
        "ca-central-1": _US_EAST_BASE,
        "sa-east-1": _US_EAST_BASE,
        "eu-west-1": {
            "Amazon Linux 2023": {"image_id": "ami-037feb57876ebed85", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
            "Ubuntu 24.04 LTS":  {"image_id": "ami-04df7d76c1b804451", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
            "Ubuntu 22.04 LTS":  {"image_id": "ami-0dbc125eb45c6bfb0", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
            "Debian 12":         {"image_id": "ami-0832ab973c08c4a01", "name": "debian-12-backports-amd64-20260601-2496"},
        },
        "eu-west-2": {
            "Amazon Linux 2023": {"image_id": "ami-01d3d515884b3a8da", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
            "Ubuntu 24.04 LTS":  {"image_id": "ami-07f936ee1f9a0de0e", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
            "Ubuntu 22.04 LTS":  {"image_id": "ami-0add4e75149fe4c81", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
            "Debian 12":         {"image_id": "ami-027d6ab6b9f62bd6d", "name": "debian-12-backports-amd64-20260601-2496"},
        },
        "eu-central-1": {
            "Amazon Linux 2023": {"image_id": "ami-0f66b1d1db0aa26b7", "name": "al2023-ami-minimal-2023.12.20260611.0-kernel-6.18-x86_64"},
            "Ubuntu 24.04 LTS":  {"image_id": "ami-042dc8681de073ac4", "name": "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20260610"},
            "Ubuntu 22.04 LTS":  {"image_id": "ami-0c42a2b384b315690", "name": "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-20260610"},
            "Debian 12":         {"image_id": "ami-0f4a585ba7d08ffa2", "name": "debian-12-backports-amd64-20260601-2496"},
        },
    }

    _OS_QUERIES = [
        {
            "os_family": "Amazon Linux 2023",
            "filters": [
                {"Name": "name", "Values": ["al2023-ami-*-x86_64"]},
                {"Name": "state", "Values": ["available"]},
            ],
            "owners": ["amazon"],
        },
        {
            "os_family": "Ubuntu 24.04 LTS",
            "filters": [
                {"Name": "name", "Values": ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]},
                {"Name": "state", "Values": ["available"]},
            ],
            "owners": ["099720109477"],
        },
        {
            "os_family": "Ubuntu 22.04 LTS",
            "filters": [
                {"Name": "name", "Values": ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]},
                {"Name": "state", "Values": ["available"]},
            ],
            "owners": ["099720109477"],
        },
        {
            "os_family": "Debian 12",
            "filters": [
                {"Name": "name", "Values": ["debian-12-*"]},
                {"Name": "state", "Values": ["available"]},
                {"Name": "architecture", "Values": ["x86_64"]},
            ],
            "owners": ["136693071363"],
        },
        {
            "os_family": "Rocky Linux 9",
            "filters": [
                {"Name": "name", "Values": ["Rocky-9-*-x86_64-*"]},
                {"Name": "state", "Values": ["available"]},
            ],
            "owners": ["792107900814"],
        },
    ]

    @classmethod
    def _get_client(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None):
        return aws_client("ec2", access_key, secret_key, region, endpoint_url)

    @classmethod
    def _get_resource(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None):
        return aws_resource("ec2", access_key, secret_key, region, endpoint_url)

    @classmethod
    @contextmanager
    def _ec2_client(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None):
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            yield client
        finally:
            client.close()

    @classmethod
    def list_instances(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                response = client.describe_instances()
                instances = []
                for reservation in response.get("Reservations", []):
                    for inst in reservation.get("Instances", []):
                        name_tag = ""
                        if inst.get("Tags"):
                            for tag in inst["Tags"]:
                                if tag["Key"] == "Name":
                                    name_tag = tag["Value"]
                        instances.append({
                            "instance_id": inst["InstanceId"],
                            "name": name_tag or inst["InstanceId"],
                            "state": inst.get("State", {}).get("Name", "unknown"),
                            "instance_type": inst.get("InstanceType", ""),
                            "availability_zone": inst.get("Placement", {}).get("AvailabilityZone", ""),
                            "private_ip": inst.get("PrivateIpAddress", ""),
                            "public_ip": inst.get("PublicIpAddress", ""),
                            "launch_time": inst.get("LaunchTime").isoformat() if inst.get("LaunchTime") else None,
                            "vpc_id": inst.get("VpcId", ""),
                            "subnet_id": inst.get("SubnetId", ""),
                        })
                return instances
            except ClientError as e:
                raise cls._map_error(e, "list", "instances")

    @classmethod
    def get_instance(cls, access_key: str, secret_key: str, region: str, instance_id: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                response = client.describe_instances(InstanceIds=[instance_id])
                reservations = response.get("Reservations", [])
                if not reservations or not reservations[0].get("Instances"):
                    raise EC2ProvisioningError(404, f"Instance '{instance_id}' not found")
                inst = reservations[0]["Instances"][0]
                name_tag = ""
                if inst.get("Tags"):
                    for tag in inst["Tags"]:
                        if tag["Key"] == "Name":
                            name_tag = tag["Value"]
                return {
                    "instance_id": inst["InstanceId"],
                    "name": name_tag or inst["InstanceId"],
                    "state": inst.get("State", {}).get("Name", "unknown"),
                    "instance_type": inst.get("InstanceType", ""),
                    "availability_zone": inst.get("Placement", {}).get("AvailabilityZone", ""),
                    "private_ip": inst.get("PrivateIpAddress", ""),
                    "public_ip": inst.get("PublicIpAddress", ""),
                    "launch_time": inst.get("LaunchTime").isoformat() if inst.get("LaunchTime") else None,
                    "vpc_id": inst.get("VpcId", ""),
                    "subnet_id": inst.get("SubnetId", ""),
                    "image_id": inst.get("ImageId", ""),
                    "key_name": inst.get("KeyName", ""),
                    "security_groups": [sg["GroupName"] for sg in inst.get("SecurityGroups", [])],
                    "tags": {t["Key"]: t["Value"] for t in inst.get("Tags", [])},
                }
            except ClientError as e:
                raise cls._map_error(e, "get", "instance", instance_id)

    @classmethod
    def resolve_ami(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> str:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                for filters in [
                    [{"Name": "name", "Values": ["al2023-ami-*-x86_64"]}, {"Name": "state", "Values": ["available"]}],
                    [{"Name": "name", "Values": ["amzn2-ami-hvm-*-x86_64-gp2"]}, {"Name": "state", "Values": ["available"]}],
                ]:
                    response = client.describe_images(Filters=filters, Owners=["amazon"])
                    images = response.get("Images", [])
                    images.sort(key=lambda x: x.get("CreationDate", ""), reverse=True)
                    if images:
                        ami = images[0]["ImageId"]
                        logger.info("resolve_ami: region=%s ami=%s name=%s", region, ami, images[0].get("Name", ""))
                        return ami
            except Exception as e:
                logger.error("resolve_ami: error for region=%s: %s", region, e)
                pass
            raise EC2ProvisioningError(500, "No suitable AMI found for region", f"region={region}")

    @classmethod
    def resolve_os_ami(cls, access_key: str, secret_key: str, region: str, os_family: str, endpoint_url: Optional[str] = None) -> str:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                for query in cls._OS_QUERIES:
                    if query["os_family"] == os_family:
                        response = client.describe_images(Filters=query["filters"], Owners=query["owners"])
                        images = response.get("Images", [])
                        if images:
                            images.sort(key=lambda x: x.get("CreationDate", ""), reverse=True)
                            latest = images[0]
                            ami = latest["ImageId"]
                            logger.info("resolve_os_ami: region=%s os=%s ami=%s name=%s",
                                         region, os_family, ami, latest.get("Name", ""))
                            return ami
                        raise EC2ProvisioningError(404, f"No AMI found for {os_family} in {region}")
                raise EC2ProvisioningError(400, f"Unknown OS family: {os_family}")
            except ClientError as e:
                raise cls._map_error(e, "resolve OS AMI", os_family)

    @classmethod
    def create_instance(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        instance_name: str,
        image_id: str,
        instance_type: str = "t2.micro",
        key_name: Optional[str] = None,
        security_group_ids: Optional[List[str]] = None,
        subnet_id: Optional[str] = None,
        user_data: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                instance_tags = [{"Key": "Name", "Value": instance_name}]
                if tags:
                    for k, v in tags.items():
                        if k != "Name":
                            instance_tags.append({"Key": k, "Value": v})

                params = {
                    "ImageId": image_id,
                    "InstanceType": instance_type,
                    "MaxCount": 1,
                    "MinCount": 1,
                    "TagSpecifications": [
                        {
                            "ResourceType": "instance",
                            "Tags": instance_tags,
                        }
                    ],
                }
                if key_name:
                    params["KeyName"] = key_name
                if security_group_ids:
                    params["SecurityGroupIds"] = security_group_ids
                if subnet_id:
                    params["SubnetId"] = subnet_id
                if user_data:
                    import base64
                    params["UserData"] = base64.b64encode(user_data.encode()).decode()

                logger.info("RunInstances params: region=%s image_id=%s type=%s subnet=%s sg=%s key=%s user_data_len=%d",
                             region, image_id, instance_type, subnet_id, security_group_ids, key_name, len(user_data or ""))
                response = client.run_instances(**params)
                instance = response["Instances"][0]
                return {
                    "instance_id": instance["InstanceId"],
                    "name": instance_name,
                    "state": instance.get("State", {}).get("Name", "pending"),
                    "instance_type": instance.get("InstanceType", instance_type),
                    "availability_zone": instance.get("Placement", {}).get("AvailabilityZone", ""),
                    "private_ip": instance.get("PrivateIpAddress", ""),
                    "launch_time": instance.get("LaunchTime").isoformat() if instance.get("LaunchTime") else None,
                }
            except ClientError as e:
                raise cls._map_error(e, "create", "instance")

    @classmethod
    def start_instance(cls, access_key: str, secret_key: str, region: str, instance_id: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                client.start_instances(InstanceIds=[instance_id])
                return {"message": f"Instance '{instance_id}' is starting", "status": "STARTING"}
            except ClientError as e:
                raise cls._map_error(e, "start", "instance", instance_id)

    @classmethod
    def stop_instance(cls, access_key: str, secret_key: str, region: str, instance_id: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                client.stop_instances(InstanceIds=[instance_id])
                return {"message": f"Instance '{instance_id}' is stopping", "status": "STOPPING"}
            except ClientError as e:
                raise cls._map_error(e, "stop", "instance", instance_id)

    @classmethod
    def delete_instance(cls, access_key: str, secret_key: str, region: str, instance_id: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                client.terminate_instances(InstanceIds=[instance_id])
                return {"message": f"Instance '{instance_id}' termination initiated", "name": instance_id}
            except ClientError as e:
                raise cls._map_error(e, "terminate", "instance", instance_id)

    @classmethod
    def cleanup_instance_resources(cls, access_key: str, secret_key: str, region: str, instance_id: str, endpoint_url: Optional[str] = None) -> Dict[str, list]:
        """Terminate instance and clean up volumes, snapshots, and Elastic IPs."""
        import time
        cleaned = {"volumes": [], "snapshots": [], "elastic_ips": []}

        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                response = client.describe_instances(InstanceIds=[instance_id])
                reservations = response.get("Reservations", [])
                if not reservations or not reservations[0].get("Instances"):
                    logger.warning(f"Instance {instance_id} not found for cleanup")
                    return cleaned
                inst = reservations[0]["Instances"][0]

                volume_ids = []
                for bdm in inst.get("BlockDeviceMappings", []):
                    ebs = bdm.get("Ebs", {})
                    vol_id = ebs.get("VolumeId")
                    if vol_id:
                        volume_ids.append(vol_id)

                association_id = None
                allocation_id = None
                for nic in inst.get("NetworkInterfaces", []):
                    assoc = nic.get("Association")
                    if isinstance(assoc, dict):
                        association_id = assoc.get("AssociationId") or association_id
                        allocation_id = assoc.get("AllocationId") or allocation_id
                if not allocation_id:
                    pub_ip = inst.get("PublicIpAddress")
                    if pub_ip:
                        try:
                            addr_response = client.describe_addresses(PublicIps=[pub_ip])
                            for addr in addr_response.get("Addresses", []):
                                allocation_id = addr.get("AllocationId")
                                association_id = addr.get("AssociationId")
                        except Exception:
                            pass
            except Exception as e:
                logger.warning(f"Failed to describe instance {instance_id} for cleanup: {e}")
                return cleaned

            try:
                client.terminate_instances(InstanceIds=[instance_id])
                logger.info(f"Instance {instance_id} termination initiated for cleanup")
            except Exception as e:
                logger.warning(f"Failed to terminate instance {instance_id}: {e}")

            time.sleep(2)

            if volume_ids:
                try:
                    vol_response = client.describe_volumes(VolumeIds=volume_ids)
                    for vol in vol_response.get("Volumes", []):
                        vol_id = vol["VolumeId"]
                        state = vol.get("State")
                        if state == "available":
                            try:
                                snap_response = client.describe_snapshots(
                                    Filters=[{"Name": "volume-id", "Values": [vol_id]}],
                                    OwnerIds=["self"],
                                )
                                for snap in snap_response.get("Snapshots", []):
                                    try:
                                        client.delete_snapshot(SnapshotId=snap["SnapshotId"])
                                        cleaned["snapshots"].append(snap["SnapshotId"])
                                        logger.info(f"Deleted snapshot {snap['SnapshotId']} for volume {vol_id}")
                                    except Exception as e:
                                        logger.warning(f"Failed to delete snapshot {snap['SnapshotId']}: {e}")
                            except Exception:
                                pass
                            try:
                                client.delete_volume(VolumeId=vol_id)
                                cleaned["volumes"].append(vol_id)
                                logger.info(f"Deleted unattached volume {vol_id}")
                            except Exception as e:
                                logger.warning(f"Failed to delete volume {vol_id}: {e}")
                except Exception as e:
                    logger.warning(f"Failed to clean up volumes: {e}")

            if allocation_id:
                try:
                    if association_id:
                        try:
                            client.disassociate_address(AssociationId=association_id)
                        except Exception:
                            pass
                    client.release_address(AllocationId=allocation_id)
                    cleaned["elastic_ips"].append(allocation_id)
                    logger.info(f"Released Elastic IP allocation {allocation_id}")
                except Exception as e:
                    logger.warning(f"Failed to release Elastic IP {allocation_id}: {e}")

        return cleaned

    @classmethod
    def list_public_images(cls, access_key: str = "", secret_key: str = "", region: str = "us-east-1",
                           endpoint_url: Optional[str] = None, use_hardcoded: bool = True) -> List[Dict[str, Any]]:
        """Return AMI list. When use_hardcoded=True (default), returns instant regional mapping."""
        if use_hardcoded:
            # Try region-specific map first; if not present, perform a live query to prevent incorrect cross-region AMI IDs
            regional = cls.REGIONAL_OS_IMAGES.get(region)
            if regional:
                results = []
                for os_family, info in regional.items():
                    results.append({
                        "os_family": os_family,
                        "image_id": info["image_id"],
                        "name": info["name"],
                        "description": "",
                        "architecture": "x86_64",
                    })
                logger.info("list_public_images: returning %d regional images for %s (fast path)", len(results), region)
                return {"public": results, "custom": []}
            else:
                logger.info("list_public_images: region %s not in hardcoded map, executing live queries for absolute accuracy", region)

        from concurrent.futures import ThreadPoolExecutor, as_completed
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                def fetch_one(query: Dict) -> Optional[Dict]:
                    try:
                        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as c:
                            response = c.describe_images(Filters=query["filters"], Owners=query["owners"])
                            images = response.get("Images", [])
                            if images:
                                images.sort(key=lambda x: x.get("CreationDate", ""), reverse=True)
                                latest = images[0]
                                logger.info("list_public_images: region=%s os=%s ami=%s name=%s",
                                             region, query["os_family"], latest["ImageId"], latest.get("Name", ""))
                                return {
                                    "os_family": query["os_family"],
                                    "image_id": latest["ImageId"],
                                    "name": latest.get("Name", ""),
                                    "description": latest.get("Description", ""),
                                    "architecture": latest.get("Architecture", "x86_64"),
                                }
                    except Exception as e:
                        logger.warning(f"Failed to query {query['os_family']} images: {e}")
                    return None

                results = []
                with ThreadPoolExecutor(max_workers=len(cls._OS_QUERIES)) as pool:
                    futures = [pool.submit(fetch_one, q) for q in cls._OS_QUERIES]
                    for f in as_completed(futures):
                        r = f.result()
                        if r:
                            results.append(r)
                custom = cls._list_custom_images(client)
                return {"public": results, "custom": custom}
            except ClientError as e:
                raise cls._map_error(e, "list public images", region)

    @classmethod
    def _list_custom_images(cls, client) -> List[Dict[str, Any]]:
        try:
            response = client.describe_images(Owners=["self"])
            images = []
            for img in response.get("Images", []):
                images.append({
                    "image_id": img["ImageId"],
                    "name": img.get("Name", ""),
                    "description": img.get("Description", ""),
                    "architecture": img.get("Architecture", ""),
                })
            return images
        except Exception:
            return []

    @classmethod
    def list_instance_types(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                types = []
                paginator = client.get_paginator("describe_instance_types")
                for page in paginator.paginate():
                    for it in page.get("InstanceTypes", []):
                        types.append({
                            "instance_type": it["InstanceType"],
                            "free_tier_eligible": it.get("FreeTierEligible", False),
                        })
                return types
            except ClientError as e:
                logger.error(f"Failed to list instance types: {e}")
                raise EC2ProvisioningError(500, f"Failed to list instance types: {e}")

    @classmethod
    def list_availability_zones(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                response = client.describe_availability_zones()
                return [
                    {"zone_name": z["ZoneName"], "state": z["State"]}
                    for z in response.get("AvailabilityZones", [])
                ]
            except ClientError as e:
                logger.error(f"Failed to list availability zones: {e}")
                raise EC2ProvisioningError(500, f"Failed to list availability zones: {e}")

    @classmethod
    def list_security_groups(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                response = client.describe_security_groups()
                result = []
                for sg in response.get("SecurityGroups", []):
                    ingress = []
                    for perm in sg.get("IpPermissions", []):
                        for rng in perm.get("IpRanges", []):
                            ingress.append({
                                "protocol": perm.get("IpProtocol", "-1"),
                                "from_port": perm.get("FromPort"),
                                "to_port": perm.get("ToPort"),
                                "cidr": rng.get("CidrIp", ""),
                                "description": rng.get("Description", ""),
                            })
                    egress = []
                    for perm in sg.get("IpPermissionsEgress", []):
                        for rng in perm.get("IpRanges", []):
                            egress.append({
                                "protocol": perm.get("IpProtocol", "-1"),
                                "from_port": perm.get("FromPort"),
                                "to_port": perm.get("ToPort"),
                                "cidr": rng.get("CidrIp", ""),
                                "description": rng.get("Description", ""),
                            })
                    result.append({
                        "group_id": sg["GroupId"],
                        "group_name": sg["GroupName"],
                        "vpc_id": sg.get("VpcId", ""),
                        "description": sg.get("Description", ""),
                        "ingress_rules": ingress,
                        "egress_rules": egress,
                    })
                return result
            except ClientError:
                return []

    @classmethod
    def create_security_group(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        group_name: str,
        description: str = "",
        vpc_id: str = "",
        ingress_rules: Optional[List[Dict[str, Any]]] = None,
        egress_rules: Optional[List[Dict[str, Any]]] = None,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        with cls._ec2_client(access_key, secret_key, region, endpoint_url) as client:
            try:
                params: Dict[str, Any] = {
                    "GroupName": group_name,
                    "Description": description or f"Security group for {group_name}",
                }
                if vpc_id:
                    params["VpcId"] = vpc_id
                response = client.create_security_group(**params)
                group_id = response["GroupId"]

                if ingress_rules:
                    for rule in ingress_rules:
                        ip_permission = cls._build_ip_permission(rule)
                        client.authorize_security_group_ingress(
                            GroupId=group_id,
                            IpPermissions=[ip_permission],
                        )

                if egress_rules:
                    for rule in egress_rules:
                        ip_permission = cls._build_ip_permission(rule)
                        client.authorize_security_group_egress(
                            GroupId=group_id,
                            IpPermissions=[ip_permission],
                        )

                return {
                    "group_id": group_id,
                    "group_name": group_name,
                    "message": f"Security group '{group_name}' created with {len(ingress_rules or [])} inbound and {len(egress_rules or [])} outbound rules",
                }
            except ClientError as e:
                raise cls._map_error(e, "create", "security group")

    @classmethod
    def _build_ip_permission(cls, rule: Dict[str, Any]) -> Dict[str, Any]:
        protocol = rule.get("protocol", "tcp")
        ip_permission: Dict[str, Any] = {
            "IpProtocol": protocol,
        }
        if protocol != "-1":
            ip_permission["FromPort"] = rule.get("from_port", 0)
            ip_permission["ToPort"] = rule.get("to_port", 65535)
        cidr = rule.get("cidr", "0.0.0.0/0")
        ip_permission["IpRanges"] = [{"CidrIp": cidr, "Description": rule.get("description", "")}]
        return ip_permission

    @classmethod
    def _map_error(cls, exc: ClientError, action: str, resource_type: str, name: str = "") -> EC2ProvisioningError:
        error_code = exc.response.get("Error", {}).get("Code", "")
        if error_code in ("InvalidInstanceID.NotFound",):
            return EC2ProvisioningError(404, f"{resource_type} '{name}' not found", str(exc))
        if error_code in ("InstanceLimitExceeded",):
            return EC2ProvisioningError(429, f"Quota exceeded for {resource_type}", str(exc))
        if error_code in ("UnauthorizedOperation", "AuthFailure", "AccessDenied"):
            return EC2ProvisioningError(403, f"Insufficient permissions to {action} {resource_type}", str(exc))
        if error_code in ("InvalidParameterValue", "MissingParameter"):
            msg = exc.response.get("Error", {}).get("Message", f"Invalid parameter for {resource_type}")
            if "free tier" in msg.lower() or "freetier" in msg.lower():
                return EC2ProvisioningError(400, msg, str(exc))
            return EC2ProvisioningError(400, f"Invalid parameter for {resource_type}", str(exc))
        if error_code in ("InvalidParameterCombination",):
            msg = exc.response.get("Error", {}).get("Message", f"Invalid combination of parameters for {resource_type}")
            return EC2ProvisioningError(400, msg, str(exc))
        if error_code in ("InvalidAMIID.NotFound", "InvalidAMIID.Unavailable", "InvalidAMIID.Malformed"):
            msg = exc.response.get("Error", {}).get("Message", f"AMI not found")
            return EC2ProvisioningError(400, msg, str(exc))
        return EC2ProvisioningError(500, f"Failed to {action} {resource_type}", str(exc))
