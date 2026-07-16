"""
/api/v1/vocab

Returns all unified vocabulary dictionaries (locations, plans, OS, disks).
Backend-maintained — frontend fetches these on mount.
"""
import logging
from fastapi import Request

from app.aws_client.aws_ec2_factory import EC2InstanceFactory
from app.gcp_client.gcp_compute_factory import GCPInstanceFactory

logger = logging.getLogger(__name__)

HARDCODED_LOCATIONS = [
    {"id": "mumbai",     "label": "Mumbai",     "gcp": "asia-south1-a",    "aws": "ap-south-1"},
    {"id": "delhi",      "label": "Delhi",      "gcp": "asia-south2-a"},
    {"id": "hyderabad",  "label": "Hyderabad",  "aws": "ap-south-2"},
    {"id": "singapore",  "label": "Singapore",  "gcp": "asia-southeast1-a", "aws": "ap-southeast-1"},
    {"id": "tokyo",      "label": "Tokyo",      "gcp": "asia-northeast1-a", "aws": "ap-northeast-1"},
    {"id": "seoul",      "label": "Seoul",      "gcp": "asia-northeast3-a", "aws": "ap-northeast-2"},
    {"id": "sydney",     "label": "Sydney",     "gcp": "australia-southeast1-a", "aws": "ap-southeast-2"},
    {"id": "iowa",       "label": "Iowa",       "gcp": "us-central1-a",    "aws": "us-east-1"},
    {"id": "california", "label": "California", "gcp": "us-west1-a",       "aws": "us-west-1"},
    {"id": "belgium",    "label": "Belgium",    "gcp": "europe-west1-b",   "aws": "eu-west-1"},
    {"id": "london",     "label": "London",     "gcp": "europe-west2-a",   "aws": "eu-west-2"},
    {"id": "frankfurt",  "label": "Frankfurt",  "gcp": "europe-west3-a",   "aws": "eu-central-1"},
]

HARDCODED_PLANS = [
    {"id": "micro",       "label": "Starter (1 vCPU · 1 GB)",       "desc": "1 vCPU · 1 GB",  "gcp": "e2-micro",       "aws": "t2.micro",     "freeTier": True,
     "aws_by_region": {"ap-south-1": "t3.micro", "ap-south-2": "t3.micro", "eu-south-1": "t3.micro", "eu-south-2": "t3.micro", "me-central-1": "t3.micro", "il-central-1": "t3.micro"}},
    {"id": "small",       "label": "Basic (2 vCPU · 2 GB)",       "desc": "2 vCPU · 2 GB",  "gcp": "e2-small",       "aws": "t2.small",
     "aws_by_region": {"ap-south-1": "t3.small", "ap-south-2": "t3.small", "eu-south-1": "t3.small", "eu-south-2": "t3.small", "me-central-1": "t3.small", "il-central-1": "t3.small"}},
    {"id": "medium",      "label": "Standard (2 vCPU · 4 GB)",      "desc": "2 vCPU · 4 GB",  "gcp": "e2-medium",      "aws": "t2.medium",
     "aws_by_region": {"ap-south-1": "t3.medium", "ap-south-2": "t3.medium", "eu-south-1": "t3.medium", "eu-south-2": "t3.medium", "me-central-1": "t3.medium", "il-central-1": "t3.medium"}},
    {"id": "standard-2",  "label": "Plus (2 vCPU · 8 GB)",  "desc": "2 vCPU · 8 GB",  "gcp": "e2-standard-2",  "aws": "t3.large"},
    {"id": "standard-4",  "label": "Pro (4 vCPU · 16 GB)",  "desc": "4 vCPU · 16 GB", "gcp": "e2-standard-4",  "aws": "t3.xlarge"},
    {"id": "standard-8",  "label": "Enterprise (8 vCPU · 32 GB)",  "desc": "8 vCPU · 32 GB", "gcp": "e2-standard-8",  "aws": "t3.2xlarge"},
    {"id": "nano",        "label": "Eco (2 vCPU · 0.5 GB)",        "desc": "2 vCPU · 0.5 GB", "gcp": "e2-micro",      "aws": "t3.nano",      "freeTier": True},
    {"id": "t4g-micro",   "label": "Starter (ARM, 2 vCPU · 1 GB)",   "desc": "2 vCPU · 1 GB",   "gcp": None,            "aws": "t4g.micro",    "freeTier": True,
     "aws_by_region": {"ap-south-1": "t4g.micro", "ap-south-2": "t4g.micro", "us-east-1": "t4g.micro", "us-west-2": "t4g.micro"}},
    {"id": "t3-micro",    "label": "Starter (x86, 2 vCPU · 1 GB)",    "desc": "2 vCPU · 1 GB",   "gcp": None,            "aws": "t3.micro",     "freeTier": True,
     "aws_by_region": {"ap-south-1": "t3.micro", "ap-south-2": "t3.micro", "us-east-1": "t3.micro", "us-west-2": "t3.micro"}},
]

HARDCODED_OS = [
    {"id": "debian-12",    "label": "Debian 12",    "os_family": "linux-debian", "min_disk_gb": 10, "key": "debian-12",    "gcp": "projects/debian-cloud/global/images/family/debian-12",       "ami_key": "Debian 12"},
    {"id": "ubuntu-2204",  "label": "Ubuntu 22.04", "os_family": "linux-ubuntu", "min_disk_gb": 10, "key": "ubuntu-2204",  "gcp": "projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts", "ami_key": "Ubuntu 22.04 LTS"},
    {"id": "rocky-linux-9","label": "Rocky Linux 9","os_family": "linux-rocky",  "min_disk_gb": 10, "key": "rocky-linux-9", "gcp": "projects/rocky-linux-cloud/global/images/family/rocky-linux-9", "ami_key": "Rocky Linux 9"},
]

HARDCODED_DISKS = [
    {"id": "balanced-10",  "label": "10 GB Balanced",  "gcp": "pd-balanced", "gcp_size": 10,  "aws": "gp3", "aws_size": 10},
    {"id": "balanced-50",  "label": "50 GB Balanced",  "gcp": "pd-balanced", "gcp_size": 50,  "aws": "gp3", "aws_size": 50},
    {"id": "balanced-100", "label": "100 GB Balanced", "gcp": "pd-balanced", "gcp_size": 100, "aws": "gp3", "aws_size": 100},
    {"id": "ssd-10",       "label": "10 GB SSD",       "gcp": "pd-ssd",     "gcp_size": 10,  "aws": "io1", "aws_size": 10},
    {"id": "ssd-50",       "label": "50 GB SSD",       "gcp": "pd-ssd",     "gcp_size": 50,  "aws": "io1", "aws_size": 50},
    {"id": "standard-10",  "label": "10 GB Standard",  "gcp": "pd-standard","gcp_size": 10,  "aws": "st1", "aws_size": 10},
]

DEFAULT_DISK_ID = "balanced-10"


async def GET(request: Request):
    # Use the requested AWS region to serve region-accurate AMI IDs.
    # If no region is provided, use us-east-1 as the reference.
    aws_region = request.query_params.get("region", "us-east-1")
    regional_amis = EC2InstanceFactory.REGIONAL_OS_IMAGES.get(aws_region, {})

    # GCP zone → derive region by stripping the trailing zone letter (e.g. "asia-south1-a" → "asia-south1")
    gcp_zone = request.query_params.get("gcp_zone", "")
    gcp_region = gcp_zone.rsplit("-", 1)[0] if gcp_zone else ""
    regional_gcp_images = GCPInstanceFactory.REGIONAL_OS_IMAGES.get(gcp_region, {})

    os_list = []
    for os_entry in HARDCODED_OS:
        enriched = {k: v for k, v in os_entry.items() if k != "ami_key"}
        ami_key = os_entry.get("ami_key")
        if ami_key:
            ami = regional_amis.get(ami_key)
            if ami:
                enriched["aws"] = ami["image_id"]
        # Override the static GCP image URI with the region-specific one if available
        os_key = os_entry.get("key")
        if os_key and regional_gcp_images:
            gcp_os = regional_gcp_images.get(
                next((k for k in regional_gcp_images if k.lower().replace(" ", "-") == os_key
                      or regional_gcp_images[k].get("name") == os_key), None)
            )
            if gcp_os:
                enriched["gcp"] = gcp_os["image_id"]
        os_list.append(enriched)

    return {
        "locations": HARDCODED_LOCATIONS,
        "plans": HARDCODED_PLANS,
        "os": os_list,
        "disks": HARDCODED_DISKS,
        "defaults": {
            "disk_id": DEFAULT_DISK_ID,
        },
    }
