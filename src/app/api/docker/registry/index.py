from fastapi import Request
from app.k8s_helper.core import access_registry_via_api_proxy
from typing import Optional


async def GET(request:Request,namespace:Optional[str]="image-registry",service_name:Optional[str]="docker",service_port:Optional[int]=5000):
    try:
        return access_registry_via_api_proxy(namespace,service_name,service_port)
    except Exception as e:
        return {"error":True,"message":e.__dict__["explanation"]}