from app.k8s_helper import KubernetesResourceHelper
from typing import Optional,List
from app.k8s_helper.models.resources import ResourceScope, ResourceInfo

class ResourceResponse(ResourceInfo):
    count:Optional[int]=0

async def GET(scope:Optional[ResourceScope]=ResourceScope.ALL,resources:Optional[str]=None,namespace:Optional[str]=None)->List[ResourceResponse]:
    print("hello")
    try:
        k8s_helper = KubernetesResourceHelper()
        allResources = k8s_helper.get_api_resources(scope=scope)
        if not resources:
            return allResources
        filteredResources = []
        requested_resources = [r.strip().lower() for r in resources.split(",")]
        for resource in allResources:
            short_names = resource.short_names or []
            name_matches = resource.kind.lower() in requested_resources
            short_name_matches = any(req in short_names for req in requested_resources)
            if name_matches or short_name_matches:
                try:
                    resource_dict = resource.model_dump()
                    details = k8s_helper.get_resource_details(resource_type=resource.name.lower())
                    resource_dict['count'] = len(details)
                    filteredResources.append(resource_dict)
                except Exception as e:
                    print(f"Unable to get details: {e} for {resource.kind}")
                    continue
        return filteredResources
        
    except Exception as e:
        return {e}, 500

    
    