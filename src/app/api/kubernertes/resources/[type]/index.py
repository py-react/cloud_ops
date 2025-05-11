from fastapi import Request
from typing import Optional
from app.k8s_helper.registry.patch_registry import PatchRegistry
from app.k8s_helper import KubernetesResourceHelper

async def GET(type:str,namespace:Optional[str]=None,field_selector: Optional[str] = None,
                           label_selector: Optional[str] = None,
                           api_version: Optional[str] = None):
    k8s_helper = KubernetesResourceHelper()
    data_list = k8s_helper.get_resource_details(resource_type=type, namespace=namespace,field_selector=field_selector,label_selector=label_selector,api_version=api_version)
    return data_list


async def POST(type:str,resource:dict):
    k8s_helper = KubernetesResourceHelper()
    return k8s_helper.apply_resource(resource)


async def PUT(type:str,apiVersion:str,name:str,modifytype:str,data:dict,namespace:Optional[str]=None):
    k8s_helper = KubernetesResourceHelper()
    resource = {
        "apiVersion":apiVersion,
        "kind":type,
        "metadata":{
            "name":name,
            "namespace":namespace or "default"
        }
    }
    patch_registry = PatchRegistry({})
    modify_fn_allowed = k8s_helper.get_supported_operations(modifytype)
    modify_fn = getattr(patch_registry,modifytype,None)({"new_data":data})
    if modify_fn and type in modify_fn_allowed:
        return k8s_helper.edit_resource(resource,modify_fn)
    return "provide supported modifytype "


async def DELETE(type:str,apiVersion:str,name:str,namespace:Optional[str]=None):
    k8s_helper = KubernetesResourceHelper()
    resource = {
        "apiVersion":apiVersion,
        "kind":type,
        "metadata":{
            "name":name,
            "namespace":namespace or "default"
        }
    }
    print(resource)
    return k8s_helper.delete_resource(resource)


    
    
    