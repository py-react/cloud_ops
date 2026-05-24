import logging
from typing import Any, Dict, List, Optional

from botocore.exceptions import ClientError

from app.aws_client.aws_auth import aws_client

logger = logging.getLogger(__name__)


class LightsailProvisioningError(Exception):
    def __init__(self, code: int, message: str, details: str = ""):
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


class LightsailBucketFactory:
    @classmethod
    def _get_client(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None):
        return aws_client("lightsail", access_key, secret_key, region, endpoint_url)

    @classmethod
    def _get_s3_client(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None):
        return aws_client("s3", access_key, secret_key, region, endpoint_url)

    @classmethod
    def list_buckets(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            response = client.get_buckets()
            buckets = response.get("buckets", [])
            result = []
            for b in buckets:
                result.append({
                    "name": b.get("name"),
                    "region": b.get("region"),
                    "url": b.get("url"),
                    "created_at": b.get("createdAt").isoformat() if b.get("createdAt") else None,
                    "capacity_gb": b.get("capacityGb"),
                    "object_count": b.get("objectCount", 0),
                    "size_gb": b.get("sizeGb", 0),
                    "state": b.get("state", {}).get("code"),
                    "bundle_id": b.get("bundleId"),
                })
            return result
        except ClientError as e:
            raise cls._map_error(e, "list", "buckets")
        finally:
            client.close()

    @classmethod
    def get_bucket(cls, access_key: str, secret_key: str, region: str, bucket_name: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            response = client.get_bucket(bucketName=bucket_name)
            b = response.get("bucket", {})
            return {
                "name": b.get("name"),
                "region": b.get("region"),
                "url": b.get("url"),
                "created_at": b.get("createdAt").isoformat() if b.get("createdAt") else None,
                "capacity_gb": b.get("capacityGb"),
                "object_count": b.get("objectCount", 0),
                "size_gb": b.get("sizeGb", 0),
                "state": b.get("state", {}).get("code"),
                "bundle_id": b.get("bundleId"),
                "able_to_update_bundle": b.get("ableToUpdateBundle"),
                "access_logging_enabled": b.get("accessLoggingEnabled", False),
                "resources": b.get("resourceReceivingAccess", []),
            }
        except ClientError as e:
            raise cls._map_error(e, "get", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def create_bucket(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        bundle_id: str = "small_1_0",
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            response = client.create_bucket(
                bucketName=bucket_name,
                bundleId=bundle_id,
            )
            ops = response.get("operations", [])
            return {
                "name": bucket_name,
                "bundle_id": bundle_id,
                "region": region,
                "operations": [
                    {"id": op.get("id"), "status": op.get("status"), "type": op.get("operationType")}
                    for op in ops
                ],
            }
        except ClientError as e:
            raise cls._map_error(e, "create", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def delete_bucket(cls, access_key: str, secret_key: str, region: str, bucket_name: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            response = client.delete_bucket(bucketName=bucket_name, forceDelete=True)
            ops = response.get("operations", [])
            return {
                "message": f"Bucket '{bucket_name}' deleted",
                "operations": [
                    {"id": op.get("id"), "status": op.get("status"), "type": op.get("operationType")}
                    for op in ops
                ],
            }
        except ClientError as e:
            raise cls._map_error(e, "delete", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def get_bundles(cls, access_key: str, secret_key: str, region: str, endpoint_url: Optional[str] = None) -> List[Dict[str, Any]]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            response = client.get_bucket_bundles()
            bundles = response.get("bundles", [])
            return [
                {
                    "bundle_id": b.get("bundleId"),
                    "name": b.get("name"),
                    "price": b.get("price"),
                    "capacity_gb": b.get("capacityGb"),
                    "is_active": b.get("isActive"),
                }
                for b in bundles
            ]
        except ClientError as e:
            raise cls._map_error(e, "list", "bundles")
        finally:
            client.close()

    @classmethod
    def list_objects(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        bucket_url: str,
        prefix: str = "",
        delimiter: str = "/",
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        s3_client = cls._get_s3_client(access_key, secret_key, region, bucket_url)
        try:
            params = {"Bucket": bucket_name, "Prefix": prefix, "Delimiter": delimiter}
            response = s3_client.list_objects_v2(**params)
            objects = []
            for obj in response.get("Contents", []):
                if obj["Key"] != prefix:
                    objects.append({
                        "name": obj["Key"],
                        "size": obj.get("Size", 0),
                        "updated": obj.get("LastModified").isoformat() if obj.get("LastModified") else None,
                    })
            folders = [{"name": p["Prefix"], "is_folder": True} for p in response.get("CommonPrefixes", [])]
            return {"objects": objects, "folders": folders, "prefix": prefix, "bucket": bucket_name}
        except ClientError as e:
            raise cls._map_error(e, "list objects", "bucket", bucket_name)
        finally:
            s3_client.close()

    @classmethod
    def generate_presigned_url(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        bucket_url: str,
        object_key: str,
        expiration: int = 3600,
        endpoint_url: Optional[str] = None,
    ) -> str:
        s3_client = cls._get_s3_client(access_key, secret_key, region, bucket_url)
        try:
            url = s3_client.generate_presigned_url(
                "get_object",
                Params={"Bucket": bucket_name, "Key": object_key},
                ExpiresIn=expiration,
            )
            return url
        except ClientError as e:
            raise cls._map_error(e, "generate presigned url", "bucket", bucket_name)
        finally:
            s3_client.close()

    @classmethod
    def upload_file(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        bucket_url: str,
        file_name: str,
        file_contents: bytes,
        prefix: str = "",
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        s3_client = cls._get_s3_client(access_key, secret_key, region, bucket_url)
        try:
            object_name = f"{prefix}{file_name}" if prefix else file_name
            s3_client.put_object(Bucket=bucket_name, Key=object_name, Body=file_contents)
            return {
                "message": "File uploaded successfully",
                "object_name": object_name,
                "bucket": bucket_name,
                "size": len(file_contents),
            }
        except ClientError as e:
            raise cls._map_error(e, "upload", "bucket", bucket_name)
        finally:
            s3_client.close()

    @classmethod
    def delete_object(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        bucket_url: str,
        object_name: str,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        s3_client = cls._get_s3_client(access_key, secret_key, region, bucket_url)
        try:
            s3_client.delete_object(Bucket=bucket_name, Key=object_name)
            return {"message": f"Object '{object_name}' deleted successfully", "bucket": bucket_name}
        except ClientError as e:
            raise cls._map_error(e, "delete object", "bucket", bucket_name)
        finally:
            s3_client.close()

    @classmethod
    def get_bucket_access_keys(
        cls,
        access_key: str,
        secret_key: str,
        region: str,
        bucket_name: str,
        endpoint_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = cls._get_client(access_key, secret_key, region, endpoint_url)
        try:
            response = client.get_bucket_access_keys(bucketName=bucket_name)
            keys = response.get("accessKeys", [])
            return {
                "access_keys": [
                    {
                        "access_key_id": k.get("accessKeyId"),
                        "secret_access_key": k.get("secretAccessKey"),
                        "status": k.get("status"),
                    }
                    for k in keys
                ]
            }
        except ClientError as e:
            raise cls._map_error(e, "get access keys", "bucket", bucket_name)
        finally:
            client.close()

    @classmethod
    def _map_error(cls, exc: ClientError, action: str, resource_type: str, name: str = "") -> LightsailProvisioningError:
        error_code = exc.response.get("Error", {}).get("Code", "")
        error_msg = exc.response.get("Error", {}).get("Message", str(exc))
        logger.error("Lightsail ClientError [%s] during %s %s '%s': %s", error_code, action, resource_type, name, error_msg)
        if error_code in ("InvalidInputException",):
            return LightsailProvisioningError(400, f"Invalid input for {resource_type}: {error_msg}", str(exc))
        if error_code in ("NotFoundException", "ResourceNotFoundException"):
            return LightsailProvisioningError(404, f"{resource_type.title()} '{name}' not found", str(exc))
        if error_code in ("AccessDenied", "AccessDeniedException"):
            return LightsailProvisioningError(403, f"Insufficient permissions to {action} {resource_type}", str(exc))
        if error_code in ("ServiceException",):
            return LightsailProvisioningError(500, f"Lightsail service error: {error_msg}", str(exc))
        if error_code in ("AccountSetupInProgress",):
            return LightsailProvisioningError(409, "Lightsail account setup in progress, please try again later", str(exc))
        return LightsailProvisioningError(500, f"Failed to {action} {resource_type}", str(exc))
