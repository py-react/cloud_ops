import logging
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError

from app.aws_client.aws_auth import aws_client, aws_resource

logger = logging.getLogger(__name__)


class S3ProvisioningError(Exception):
    def __init__(self, code: int, message: str, details: str = ""):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class S3BucketFactory:
    @classmethod
    def _get_client(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None):
        return aws_client("s3", access_key, secret_key, region, endpoint_url)

    @classmethod
    def _get_resource(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None):
        return aws_resource("s3", access_key, secret_key, region, endpoint_url)

    @classmethod
    def list_buckets(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            response = client.list_buckets()
            return [
                {
                    "name": b["Name"],
                    "creation_date": b["CreationDate"].isoformat() if b.get("CreationDate") else None,
                }
                for b in response.get("Buckets", [])
            ]
        except ClientError as e:
            raise cls._map_error(e, "list", "buckets")
        finally:
            client.close()

    @classmethod
    def create_bucket(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        object_lock_enabled: bool = False,
        object_lock_mode: str = "GOVERNANCE",
        object_lock_days: int = 30,
        versioning_enabled: bool = False,
        versioning_expire_days: int = 0,
        storage_class: str = "STANDARD",
        encryption: str = "AES256",
        kms_key_id: Optional[str] = None,
        block_public_acls: bool = True,
        block_public_policy: bool = True,
        ignore_public_acls: bool = True,
        restrict_public_buckets: bool = True,
        bucket_policy: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            params: Dict[str, Any] = {"Bucket": bucket_name}
            config: Dict[str, Any] = {}
            if region != "us-east-1":
                config["LocationConstraint"] = region
            if object_lock_enabled:
                config["ObjectLockEnabledForBucket"] = True
            if config:
                params["CreateBucketConfiguration"] = config
            client.create_bucket(**params)

            if versioning_enabled:
                client.put_bucket_versioning(
                    Bucket=bucket_name,
                    VersioningConfiguration={"Status": "Enabled"},
                )

            if versioning_enabled and versioning_expire_days > 0:
                client.put_bucket_lifecycle_configuration(
                    Bucket=bucket_name,
                    LifecycleConfiguration={
                        "Rules": [{
                            "ID": "expire-noncurrent-versions",
                            "Status": "Enabled",
                            "Filter": {"Prefix": ""},
                            "NoncurrentVersionExpiration": {
                                "NoncurrentDays": versioning_expire_days,
                            },
                        }]
                    },
                )

            if object_lock_enabled:
                client.put_object_lock_configuration(
                    Bucket=bucket_name,
                    ObjectLockConfiguration={
                        "ObjectLockEnabled": "Enabled",
                        "Rule": {
                            "DefaultRetention": {
                                "Mode": object_lock_mode,
                                "Days": object_lock_days,
                            }
                        },
                    },
                )

            if encryption == "AES256":
                client.put_bucket_encryption(
                    Bucket=bucket_name,
                    ServerSideEncryptionConfiguration={
                        "Rules": [{
                            "ApplyServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }]
                    },
                )
            elif encryption == "aws:kms" and kms_key_id:
                client.put_bucket_encryption(
                    Bucket=bucket_name,
                    ServerSideEncryptionConfiguration={
                        "Rules": [{
                            "ApplyServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms",
                                "KMSMasterKeyID": kms_key_id,
                            }
                        }]
                    },
                )

            if bucket_policy:
                import json as _json
                try:
                    _json.loads(bucket_policy)
                    block_public_policy = False
                    restrict_public_buckets = False
                except _json.JSONDecodeError:
                    logger.warning(f"Invalid bucket policy JSON for '{bucket_name}', skipping")

            block_config = {
                "BlockPublicAcls": block_public_acls,
                "BlockPublicPolicy": block_public_policy,
                "IgnorePublicAcls": ignore_public_acls,
                "RestrictPublicBuckets": restrict_public_buckets,
            }
            client.put_public_access_block(
                Bucket=bucket_name,
                PublicAccessBlockConfiguration=block_config,
            )

            if bucket_policy:
                import json as _json
                try:
                    _json.loads(bucket_policy)
                    client.put_bucket_policy(Bucket=bucket_name, Policy=bucket_policy)
                except _json.JSONDecodeError:
                    pass

            if tags:
                client.put_bucket_tagging(
                    Bucket=bucket_name,
                    Tagging={"TagSet": [{"Key": k, "Value": v} for k, v in tags.items()]},
                )

            return {
                "name": bucket_name,
                "region": region,
                "storage_class": storage_class,
                "versioning_enabled": versioning_enabled,
                "object_lock_enabled": object_lock_enabled,
                "encryption": encryption,
                "block_public_acls": block_public_acls,
                "tags": tags,
                "creation_date": None,
            }
        except ClientError as e:
            raise cls._map_error(e, "create", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def delete_bucket(cls, access_key: str, secret_key: str, region: str, bucket_name: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            objects = client.list_objects_v2(Bucket=bucket_name)
            if objects.get("Contents"):
                delete_keys = [{"Key": obj["Key"]} for obj in objects["Contents"]]
                client.delete_objects(Bucket=bucket_name, Delete={"Objects": delete_keys})
            client.delete_bucket(Bucket=bucket_name)
            return {"message": f"Bucket '{bucket_name}' and all contents deleted", "name": bucket_name}
        except ClientError as e:
            raise cls._map_error(e, "delete", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def list_objects(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        prefix: str = "",
        delimiter: str = "/",
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            params = {"Bucket": bucket_name, "Prefix": prefix, "Delimiter": delimiter}
            response = client.list_objects_v2(**params)
            objects = []
            for obj in response.get("Contents", []):
                if obj["Key"] != prefix:
                    objects.append({
                        "name": obj["Key"],
                        "size": obj.get("Size", 0),
                        "storage_class": obj.get("StorageClass", "STANDARD"),
                        "updated": obj.get("LastModified").isoformat() if obj.get("LastModified") else None,
                    })
            folders = [{"name": p["Prefix"], "is_folder": True} for p in response.get("CommonPrefixes", [])]
            return {"objects": objects, "folders": folders, "prefix": prefix, "bucket": bucket_name}
        except ClientError as e:
            raise cls._map_error(e, "list objects", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def create_folder(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        folder_name: str,
        prefix: str = "",
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            full_path = f"{prefix}{folder_name}/"
            client.put_object(Bucket=bucket_name, Key=full_path, Body=b"")
            return {"message": f"Folder '{folder_name}' created", "path": full_path}
        except ClientError as e:
            raise cls._map_error(e, "create folder", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def upload_file(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        file_name: str,
        file_contents: bytes,
        prefix: str = "",
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            object_name = f"{prefix}{file_name}" if prefix else file_name
            client.put_object(Bucket=bucket_name, Key=object_name, Body=file_contents)
            return {
                "message": "File uploaded successfully",
                "object_name": object_name,
                "bucket": bucket_name,
                "size": len(file_contents),
            }
        except ClientError as e:
            raise cls._map_error(e, "upload", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def generate_presigned_url(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        object_key: str,
        expiration: int = 3600,
        endpoint_url: Optional[str] = None,
    ) -> str:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            url = client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket_name, "Key": object_key},
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            raise cls._map_error(e, "generate presigned url", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def delete_object(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        object_name: str,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            client.delete_object(Bucket=bucket_name, Key=object_name)
            return {"message": f"Object '{object_name}' deleted successfully", "bucket": bucket_name}
        except ClientError as e:
            raise cls._map_error(e, "delete object", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def delete_folder(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        folder_prefix: str,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            objects = client.list_objects_v2(Bucket=bucket_name, Prefix=folder_prefix)
            if objects.get("Contents"):
                delete_keys = [{"Key": obj["Key"]} for obj in objects["Contents"]]
                client.delete_objects(Bucket=bucket_name, Delete={"Objects": delete_keys})
            return {"message": f"Folder '{folder_prefix.rstrip('/')}' deleted", "bucket": bucket_name}
        except ClientError as e:
            raise cls._map_error(e, "delete folder", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def copy_object(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        source_object: str,
        destination_object: str,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            copy_source = {"Bucket": bucket_name, "Key": source_object}
            client.copy_object(CopySource=copy_source, Bucket=bucket_name, Key=destination_object)
            return {
                "message": f"Object copied to '{destination_object}'",
                "source": source_object,
                "destination": destination_object,
            }
        except ClientError as e:
            raise cls._map_error(e, "copy object", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def move_object(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        source_object: str,
        destination_object: str,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            copy_source = {"Bucket": bucket_name, "Key": source_object}
            client.copy_object(CopySource=copy_source, Bucket=bucket_name, Key=destination_object)
            client.delete_object(Bucket=bucket_name, Key=source_object)
            return {
                "message": f"Object moved to '{destination_object}'",
                "source": source_object,
                "destination": destination_object,
            }
        except ClientError as e:
            raise cls._map_error(e, "move object", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def move_folder(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        source_prefix: str,
        destination_prefix: str,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            objects = client.list_objects_v2(Bucket=bucket_name, Prefix=source_prefix)
            if not objects.get("Contents"):
                return {"message": "No objects to move", "source": source_prefix, "destination": destination_prefix}
            for obj in objects["Contents"]:
                key = obj["Key"]
                new_key = key.replace(source_prefix, destination_prefix, 1)
                copy_source = {"Bucket": bucket_name, "Key": key}
                client.copy_object(CopySource=copy_source, Bucket=bucket_name, Key=new_key)
                client.delete_object(Bucket=bucket_name, Key=key)
            return {
                "message": f"Folder moved from '{source_prefix}' to '{destination_prefix}'",
                "source": source_prefix,
                "destination": destination_prefix,
            }
        except ClientError as e:
            raise cls._map_error(e, "move folder", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def get_config(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            try:
                loc = client.get_bucket_location(Bucket=bucket_name)
                detected = loc.get("LocationConstraint")
                if detected:
                    region = detected
            except ClientError:
                pass

            config: Dict[str, Any] = {"name": bucket_name, "region": region}

            try:
                v = client.get_bucket_versioning(Bucket=bucket_name)
                config["versioning_enabled"] = v.get("Status") == "Enabled"
            except ClientError:
                config["versioning_enabled"] = False

            try:
                lc = client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
                rules = lc.get("Rules", [])
                for rule in rules:
                    ne = rule.get("NoncurrentVersionExpiration", {})
                    if ne.get("NoncurrentDays"):
                        config["versioning_expire_days"] = ne["NoncurrentDays"]
                        break
            except ClientError:
                config["versioning_expire_days"] = 0

            try:
                ol = client.get_object_lock_configuration(Bucket=bucket_name)
                olc = ol.get("ObjectLockConfiguration", {})
                config["object_lock_enabled"] = olc.get("ObjectLockEnabled") == "Enabled"
                rule = olc.get("Rule", {})
                dr = rule.get("DefaultRetention", {})
                config["object_lock_mode"] = dr.get("Mode", "GOVERNANCE")
                config["object_lock_days"] = dr.get("Days", 30)
            except ClientError:
                config["object_lock_enabled"] = False
                config["object_lock_mode"] = "GOVERNANCE"
                config["object_lock_days"] = 30

            try:
                enc = client.get_bucket_encryption(Bucket=bucket_name)
                rules = enc.get("ServerSideEncryptionConfiguration", {}).get("Rules", [])
                if rules:
                    default_enc = rules[0].get("ApplyServerSideEncryptionByDefault", {})
                    config["encryption"] = default_enc.get("SSEAlgorithm", "AES256")
                    config["kms_key_id"] = default_enc.get("KMSMasterKeyID", "")
            except ClientError:
                config["encryption"] = "AES256"
                config["kms_key_id"] = ""

            try:
                pab = client.get_public_access_block(Bucket=bucket_name)
                pabc = pab.get("PublicAccessBlockConfiguration", {})
                config["block_public_acls"] = pabc.get("BlockPublicAcls", True)
                config["block_public_policy"] = pabc.get("BlockPublicPolicy", True)
                config["ignore_public_acls"] = pabc.get("IgnorePublicAcls", True)
                config["restrict_public_buckets"] = pabc.get("RestrictPublicBuckets", True)
            except ClientError:
                pass

            try:
                bp = client.get_bucket_policy(Bucket=bucket_name)
                config["bucket_policy"] = bp.get("Policy", "")
            except ClientError:
                config["bucket_policy"] = ""

            try:
                tag = client.get_bucket_tagging(Bucket=bucket_name)
                ts = tag.get("TagSet", [])
                config["tags"] = {t["Key"]: t["Value"] for t in ts}
            except ClientError:
                config["tags"] = {}

            return config
        except ClientError as e:
            raise cls._map_error(e, "get config", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def update_config(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        versioning_enabled: Optional[bool] = None,
        versioning_expire_days: Optional[int] = None,
        encryption: Optional[str] = None,
        kms_key_id: Optional[str] = None,
        block_public_acls: Optional[bool] = None,
        block_public_policy: Optional[bool] = None,
        ignore_public_acls: Optional[bool] = None,
        restrict_public_buckets: Optional[bool] = None,
        bucket_policy: Optional[str] = None,
        tags: Optional[Dict[str, str]] = None,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            if versioning_enabled is not None:
                client.put_bucket_versioning(
                    Bucket=bucket_name,
                    VersioningConfiguration={"Status": "Enabled" if versioning_enabled else "Suspended"},
                )

            if versioning_expire_days is not None and versioning_expire_days > 0:
                client.put_bucket_lifecycle_configuration(
                    Bucket=bucket_name,
                    LifecycleConfiguration={
                        "Rules": [{
                            "ID": "expire-noncurrent-versions",
                            "Status": "Enabled",
                            "Filter": {"Prefix": ""},
                            "NoncurrentVersionExpiration": {
                                "NoncurrentDays": versioning_expire_days,
                            },
                        }]
                    },
                )
            elif versioning_expire_days == 0:
                try:
                    client.delete_bucket_lifecycle(Bucket=bucket_name)
                except ClientError:
                    pass

            if encryption == "AES256":
                client.put_bucket_encryption(
                    Bucket=bucket_name,
                    ServerSideEncryptionConfiguration={
                        "Rules": [{
                            "ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}
                        }]
                    },
                )
            elif encryption == "aws:kms" and kms_key_id:
                client.put_bucket_encryption(
                    Bucket=bucket_name,
                    ServerSideEncryptionConfiguration={
                        "Rules": [{
                            "ApplyServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "aws:kms",
                                "KMSMasterKeyID": kms_key_id,
                            }
                        }]
                    },
                )

            if bucket_policy is not None:
                import json as _json
                if bucket_policy:
                    allow_policy = False
                    try:
                        _json.loads(bucket_policy)
                        allow_policy = True
                    except _json.JSONDecodeError:
                        pass
                    if allow_policy:
                        block_public_policy = False
                        restrict_public_buckets = False
                        client.put_bucket_policy(Bucket=bucket_name, Policy=bucket_policy)
                    else:
                        client.delete_bucket_policy(Bucket=bucket_name)

            pab_config: Dict[str, bool] = {}
            for k in ("block_public_acls", "block_public_policy", "ignore_public_acls", "restrict_public_buckets"):
                v = locals().get(k)
                if v is not None:
                    pab_key = "".join(word.capitalize() for word in k.split("_"))
                    pab_config[pab_key] = v
            if pab_config:
                client.put_public_access_block(
                    Bucket=bucket_name,
                    PublicAccessBlockConfiguration=pab_config,
                )

            if tags is not None:
                if tags:
                    client.put_bucket_tagging(
                        Bucket=bucket_name,
                        Tagging={"TagSet": [{"Key": k, "Value": v} for k, v in tags.items()]},
                    )
                else:
                    try:
                        client.delete_bucket_tagging(Bucket=bucket_name)
                    except ClientError:
                        pass

            return {"message": f"Bucket '{bucket_name}' configuration updated"}
        except ClientError as e:
            raise cls._map_error(e, "update config", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def _map_error(cls, exc: ClientError, action: str, resource_type: str, name: str = "") -> S3ProvisioningError:
        error_code = exc.response.get("Error", {}).get("Code", "")
        error_msg = exc.response.get("Error", {}).get("Message", str(exc))
        logger.error("S3 ClientError [%s] during %s %s '%s': %s", error_code, action, resource_type, name, error_msg)
        if error_code in ("NoSuchBucket",):
            return S3ProvisioningError(404, f"Bucket '{name}' not found", str(exc))
        if error_code in ("BucketAlreadyExists", "BucketAlreadyOwnedByYou"):
            return S3ProvisioningError(409, f"Bucket conflict: {error_code}", str(exc))
        if error_code in ("AccessDenied",):
            return S3ProvisioningError(403, f"Insufficient permissions to {action} {resource_type}", str(exc))
        if error_code in ("InvalidBucketName",):
            return S3ProvisioningError(400, f"Invalid bucket name '{name}'", str(exc))
        if error_code in ("MalformedPolicy",):
            return S3ProvisioningError(400, f"Invalid bucket policy: {error_msg}", str(exc))
        return S3ProvisioningError(500, f"Failed to {action} {resource_type}", str(exc))
