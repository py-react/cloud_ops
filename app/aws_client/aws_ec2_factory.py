import logging
from typing import Any, Dict, List, Optional

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
    def list_instances(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
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
        finally:
            client.close()

    @classmethod
    def get_instance(cls, access_key: str, secret_key: str, region: str, instance_id: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
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
        finally:
            client.close()

    @classmethod
    def resolve_ami(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> str:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
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
        finally:
            client.close()
        raise EC2ProvisioningError(500, "No suitable AMI found for region", f"region={region}")

    @classmethod
    def resolve_os_ami(cls, access_key: str, secret_key: str, region: str, os_family: str, endpoint_url: Optional[str] = None) -> str:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
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
        finally:
            client.close()

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
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
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
        finally:
            client.close()

    @classmethod
    def start_instance(cls, access_key: str, secret_key: str, region: str, instance_id: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            client.start_instances(InstanceIds=[instance_id])
            return {"message": f"Instance '{instance_id}' is starting", "status": "STARTING"}
        except ClientError as e:
            raise cls._map_error(e, "start", "instance", instance_id)
        finally:
            client.close()

    @classmethod
    def stop_instance(cls, access_key: str, secret_key: str, region: str, instance_id: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            client.stop_instances(InstanceIds=[instance_id])
            return {"message": f"Instance '{instance_id}' is stopping", "status": "STOPPING"}
        except ClientError as e:
            raise cls._map_error(e, "stop", "instance", instance_id)
        finally:
            client.close()

    @classmethod
    def delete_instance(cls, access_key: str, secret_key: str, region: str, instance_id: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            client.terminate_instances(InstanceIds=[instance_id])
            return {"message": f"Instance '{instance_id}' termination initiated", "name": instance_id}
        except ClientError as e:
            raise cls._map_error(e, "terminate", "instance", instance_id)
        finally:
            client.close()

    @classmethod
    def cleanup_instance_resources(cls, access_key: str, secret_key: str, region: str, instance_id: str, endpoint_url: Optional[str] = None) -> Dict[str, list]:
        """Terminate instance and clean up volumes, snapshots, and Elastic IPs."""
        import time
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        cleaned = {"volumes": [], "snapshots": [], "elastic_ips": []}

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
        finally:
            client.close()

        terminate_client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            terminate_client.terminate_instances(InstanceIds=[instance_id])
            logger.info(f"Instance {instance_id} termination initiated for cleanup")
        except Exception as e:
            logger.warning(f"Failed to terminate instance {instance_id}: {e}")
        finally:
            terminate_client.close()

        time.sleep(2)

        if volume_ids:
            ec2 = cls._get_client(access_key, secret_key, region, endpoint_url)
            try:
                vol_response = ec2.describe_volumes(VolumeIds=volume_ids)
                for vol in vol_response.get("Volumes", []):
                    vol_id = vol["VolumeId"]
                    state = vol.get("State")
                    if state == "available":
                        try:
                            snap_response = ec2.describe_snapshots(
                                Filters=[{"Name": "volume-id", "Values": [vol_id]}],
                                OwnerIds=["self"],
                            )
                            for snap in snap_response.get("Snapshots", []):
                                try:
                                    ec2.delete_snapshot(SnapshotId=snap["SnapshotId"])
                                    cleaned["snapshots"].append(snap["SnapshotId"])
                                    logger.info(f"Deleted snapshot {snap['SnapshotId']} for volume {vol_id}")
                                except Exception as e:
                                    logger.warning(f"Failed to delete snapshot {snap['SnapshotId']}: {e}")
                        except Exception:
                            pass
                        try:
                            ec2.delete_volume(VolumeId=vol_id)
                            cleaned["volumes"].append(vol_id)
                            logger.info(f"Deleted unattached volume {vol_id}")
                        except Exception as e:
                            logger.warning(f"Failed to delete volume {vol_id}: {e}")
            except Exception as e:
                logger.warning(f"Failed to clean up volumes: {e}")
            finally:
                ec2.close()

        if allocation_id:
            ec2 = cls._get_client(access_key, secret_key, region, endpoint_url)
            try:
                if association_id:
                    try:
                        ec2.disassociate_address(AssociationId=association_id)
                    except Exception:
                        pass
                ec2.release_address(AllocationId=allocation_id)
                cleaned["elastic_ips"].append(allocation_id)
                logger.info(f"Released Elastic IP allocation {allocation_id}")
            except Exception as e:
                logger.warning(f"Failed to release Elastic IP {allocation_id}: {e}")
            finally:
                ec2.close()

        return cleaned

    @classmethod
    def list_public_images(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            results = []
            for query in cls._OS_QUERIES:
                try:
                    response = client.describe_images(Filters=query["filters"], Owners=query["owners"])
                    images = response.get("Images", [])
                    if images:
                        images.sort(key=lambda x: x.get("CreationDate", ""), reverse=True)
                        latest = images[0]
                        logger.info("list_public_images: region=%s os=%s ami=%s name=%s",
                                     region, query["os_family"], latest["ImageId"], latest.get("Name", ""))
                        results.append({
                            "os_family": query["os_family"],
                            "image_id": latest["ImageId"],
                            "name": latest.get("Name", ""),
                            "description": latest.get("Description", ""),
                            "architecture": latest.get("Architecture", "x86_64"),
                        })
                except Exception as e:
                    logger.warning(f"Failed to query {query['os_family']} images: {e}")
            custom = cls._list_custom_images(client)
            return {"public": results, "custom": custom}
        finally:
            client.close()

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
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
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
            return [
                {"instance_type": "t2.micro", "free_tier_eligible": True},
                {"instance_type": "t2.small", "free_tier_eligible": False},
                {"instance_type": "t2.medium", "free_tier_eligible": False},
                {"instance_type": "t2.large", "free_tier_eligible": False},
                {"instance_type": "m5.large", "free_tier_eligible": False},
                {"instance_type": "m5.xlarge", "free_tier_eligible": False},
            ]
        finally:
            client.close()

    @classmethod
    def list_availability_zones(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            response = client.describe_availability_zones()
            return [
                {"zone_name": z["ZoneName"], "state": z["State"]}
                for z in response.get("AvailabilityZones", [])
            ]
        except ClientError:
            return [{"zone_name": f"{region}a", "state": "available"}]
        finally:
            client.close()

    @classmethod
    def list_security_groups(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
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
        finally:
            client.close()

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
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
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
        finally:
            client.close()

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
            return EC2ProvisioningError(400, f"Invalid parameter for {resource_type}", str(exc))
        if error_code in ("InvalidParameterCombination",):
            msg = exc.response.get("Error", {}).get("Message", f"Invalid combination of parameters for {resource_type}")
            return EC2ProvisioningError(400, msg, str(exc))
        if error_code in ("InvalidAMIID.NotFound", "InvalidAMIID.Unavailable", "InvalidAMIID.Malformed"):
            msg = exc.response.get("Error", {}).get("Message", f"AMI not found")
            return EC2ProvisioningError(400, msg, str(exc))
        return EC2ProvisioningError(500, f"Failed to {action} {resource_type}", str(exc))
