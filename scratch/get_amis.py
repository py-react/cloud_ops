import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db_client.db import get_session
from app.db_client.models.github_pat.github_pat import IntegrationCredential
from sqlmodel import select
from app.aws_client.aws_auth import get_aws_credentials
from app.aws_client.aws_ec2_factory import EC2InstanceFactory

regions = [
    "ap-south-1",
    "ap-south-2",
    "ap-southeast-1",
    "ap-northeast-1",
    "ap-northeast-2",
    "ap-southeast-2",
    "us-east-1",
    "us-west-1",
    "eu-west-1",
    "eu-west-2",
    "eu-central-1",
]

def main():
    with get_session() as session:
        creds = session.exec(select(IntegrationCredential).where(IntegrationCredential.provider == "aws")).all()
    if not creds:
        print("No AWS credentials found in DB.")
        return
    
    cred_id = creds[0].id
    ak, sk, _, endpoint_url = get_aws_credentials(cred_id)
    
    mapping = {}
    for region in regions:
        print(f"Querying region {region}...")
        try:
            res = EC2InstanceFactory.list_public_images(ak, sk, region, use_hardcoded=False)
            mapping[region] = {}
            for img in res.get("public", []):
                mapping[region][img["os_family"]] = {
                    "image_id": img["image_id"],
                    "name": img["name"]
                }
        except Exception as e:
            print(f"Error querying region {region}: {e}")
            
    print("\n--- RESULTING MAP ---")
    print(json.dumps(mapping, indent=2))

if __name__ == "__main__":
    main()
