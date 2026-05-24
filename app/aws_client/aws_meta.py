import logging
from typing import Any, Dict, List, Optional

import boto3
from botocore.exceptions import ClientError, BotoCoreError

from app.aws_client.aws_auth import aws_client

logger = logging.getLogger(__name__)


S3_STORAGE_CLASSES: List[Dict[str, str]] = [
    {"value": "STANDARD", "label": "Standard", "description": "Frequent access, low latency"},
    {"value": "INTELLIGENT_TIERING", "label": "Intelligent-Tiering", "description": "Auto cost optimization"},
    {"value": "STANDARD_IA", "label": "Standard-IA", "description": "Infrequent access"},
    {"value": "ONEZONE_IA", "label": "One Zone-IA", "description": "Less resilient, lower cost"},
    {"value": "GLACIER", "label": "Glacier", "description": "Archive, minutes retrieval"},
    {"value": "DEEP_ARCHIVE", "label": "Deep Archive", "description": "Archive, hours retrieval"},
]

S3_ENCRYPTION_OPTIONS: List[Dict[str, str]] = [
    {"value": "AES256", "label": "SSE-S3 (AES-256)"},
    {"value": "aws:kms", "label": "SSE-KMS (AWS KMS)"},
]

OBJECT_LOCK_MODES: List[Dict[str, str]] = [
    {"value": "GOVERNANCE", "label": "Governance", "description": "Can be overridden with IAM permissions"},
    {"value": "COMPLIANCE", "label": "Compliance", "description": "No one can override, not even root"},
]


def list_aws_regions(access_key: str, secret_key: str, endpoint_url: Optional[str] = None) -> List[Dict[str, str]]:
    """Fetch real AWS regions via EC2 DescribeRegions API."""
    client = aws_client("ec2", access_key, secret_key, "us-east-1", endpoint_url)
    response = client.describe_regions(AllRegions=False)
    regions = [
        {
            "value": r["RegionName"],
            "label": r["RegionName"],
            "endpoint": r.get("Endpoint", ""),
        }
        for r in response.get("Regions", [])
    ]
    regions.sort(key=lambda r: r["value"])
    client.close()
    return regions


def get_aws_meta(access_key: str, secret_key: str, endpoint_url: Optional[str] = None) -> Dict[str, Any]:
    regions = list_aws_regions(access_key, secret_key, endpoint_url)
    return {
        "regions": regions,
        "s3_storage_classes": S3_STORAGE_CLASSES,
        "s3_encryption_options": S3_ENCRYPTION_OPTIONS,
        "object_lock_modes": OBJECT_LOCK_MODES,
    }
