from fastapi import Request
from typing import Optional
from app.k8s_helper.registry.patch_registry import PatchRegistry
from app.k8s_helper import KubernetesResourceHelper

def normalize_kind(resource_type: str) -> str:
    """
    Normalizes plural/lowercase resource types to singular/capitalized Kinds.
    Example: storageclasses -> StorageClass, pods -> Pod
    """
    # Common mappings
    mapping = {
        "storageclasses": "StorageClass",
        "persistentvolumeclaims": "PersistentVolumeClaim",
        "persistentvolumes": "PersistentVolume",
        "namespaces": "Namespace",
        "deployments": "Deployment",
        "daemonsets": "DaemonSet",
        "statefulsets": "StatefulSet",
        "services": "Service",
        "pods": "Pod",
        "configmaps": "ConfigMap",
        "secrets": "Secret",
        "ingresses": "Ingress"
    }
    return mapping.get(resource_type.lower(), resource_type)

async def GET(request: Request, type: str, namespace: Optional[str] = None, api_version: Optional[str] = None, field_selector: Optional[str] = None, label_selector: Optional[str] = None):
    """
    Generic GET for any Kubernetes resource.
    Usage: /api/kubernertes/resources/[type]?namespace=...&api_version=...
    """
    k8s_helper = KubernetesResourceHelper()
    namespace = request.query_params.get("namespace")
    field_selector = request.query_params.get("field_selector")
    label_selector = request.query_params.get("label_selector")
    api_version = request.query_params.get("api_version")
    
    data_list = k8s_helper.get_resource_details(
        resource_type=type, 
        namespace=namespace, 
        field_selector=field_selector, 
        label_selector=label_selector, 
        api_version=api_version
    )
    return data_list

async def POST(type: str, resource: dict):
    k8s_helper = KubernetesResourceHelper()
    return k8s_helper.apply_resource(resource)

async def PUT(request: Request, type: str, apiVersion: Optional[str] = None, name: Optional[str] = None, modifytype: Optional[str] = None, namespace: Optional[str] = None):
    """
    Generic PUT for editing resources.
    """
    k8s_helper = KubernetesResourceHelper()
    params = request.query_params
    apiVersion = params.get("apiVersion")
    name = params.get("name")
    modifytype = params.get("modifytype")
    namespace = params.get("namespace")
    
    data = await request.json()
    metadata = {"name": name}
    if namespace:
        metadata["namespace"] = namespace
        
    resource = {
        "apiVersion": apiVersion,
        "kind": normalize_kind(type),
        "metadata": metadata
    }
    patch_registry = PatchRegistry({})
    modify_fn_allowed = k8s_helper.get_supported_operations(modifytype)
    modify_fn = getattr(patch_registry, modifytype, None)({"new_data": data})
    if modify_fn and normalize_kind(type) in modify_fn_allowed:
        return k8s_helper.edit_resource(resource, modify_fn)
    return "provide supported modifytype "

async def DELETE(request: Request, type: str, apiVersion: Optional[str] = None, name: Optional[str] = None, namespace: Optional[str] = None):
    """
    Generic DELETE for any Kubernetes resource.
    Usage: /api/kubernertes/resources/[type]?apiVersion=...&name=...&namespace=...
    """
    k8s_helper = KubernetesResourceHelper()
    params = request.query_params
    apiVersion = params.get("apiVersion")
    name = params.get("name")
    namespace = params.get("namespace")

    metadata = {"name": name}
    if namespace:
        metadata["namespace"] = namespace
        
    resource = {
        "apiVersion": apiVersion,
        "kind": normalize_kind(type),
        "metadata": metadata
    }
    print(f"Deleting resource: {resource}")
    return k8s_helper.delete_resource(resource)
