from fastapi import Request
from google.cloud import compute_v1
from app.gcp_client import get_gcp_credentials
from app.gcp_client.gcp_auth import GCPAuthError
import pydantic

class ProvisionRequest(pydantic.BaseModel):
    project_id: str
    instance_name: str
    zone: str = "us-central1-a"

async def POST(request: Request):
    try:
        credential_id = request.query_params.get("credential_id")
        cred_id = int(credential_id) if credential_id and credential_id != "undefined" else None
        creds, _ = get_gcp_credentials(cred_id)

        body = await request.json()
        req = ProvisionRequest(**body)

        # Initialize the compute client with user's credentials
        instance_client = compute_v1.InstancesClient(credentials=creds)

        # Free Tier spec: e2-micro
        # Supported zones for free tier: us-west1, us-central1, us-east1
        machine_type = f"zones/{req.zone}/machineTypes/e2-micro"

        instance = compute_v1.Instance()
        instance.name = req.instance_name
        instance.machine_type = machine_type

        # Boot disk (using public image)
        disk = compute_v1.AttachedDisk()
        initialize_params = compute_v1.AttachedDiskInitializeParams()
        initialize_params.source_image = "projects/debian-cloud/global/images/family/debian-11"
        initialize_params.disk_size_gb = 30 # Free tier max is 30GB
        disk.initialize_params = initialize_params
        disk.auto_delete = True
        disk.boot = True
        instance.disks = [disk]

        # Network interface
        network_interface = compute_v1.NetworkInterface()
        network_interface.name = "global/networks/default"
        # Access config to give an external IP
        access_config = compute_v1.AccessConfig()
        access_config.name = "External NAT"
        access_config.type_ = compute_v1.AccessConfig.Type.ONE_TO_ONE_NAT.name
        network_interface.access_configs = [access_config]
        instance.network_interfaces = [network_interface]

        operation = instance_client.insert(
            project=req.project_id,
            zone=req.zone,
            instance_resource=instance
        )

        return {
            "message": "Provisioning started",
            "operation_id": operation.name,
            "instance_name": req.instance_name,
            "status": "PENDING"
        }

    except GCPAuthError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": str(e)}
