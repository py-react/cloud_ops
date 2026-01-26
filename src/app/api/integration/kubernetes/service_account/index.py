from fastapi import Request
from app.k8s_helper import KubernetesResourceHelper
from typing import List

async def GET(request: Request, namespace: str) -> List[str]:
    try:
        k8s_helper = KubernetesResourceHelper()
        sa_details = k8s_helper.get_resource_details(resource_type="serviceaccounts", namespace=namespace)
        return [sa['metadata']['name'] for sa in sa_details]
    except Exception as e:
        print(f"Error listing service accounts: {e}")
        return ["default"]
