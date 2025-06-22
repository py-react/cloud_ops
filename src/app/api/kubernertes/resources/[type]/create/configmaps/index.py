from fastapi import Request, HTTPException
from kubernetes import client, config
from typing import Dict, Any, TypedDict, Optional

# --- TypedDicts for ConfigMap creation ---
class MetadataDict(TypedDict, total=False):
    name: str
    namespace: str
    labels: Dict[str, str]
    annotations: Dict[str, str]

class ConfigMapCreatePayload(TypedDict, total=False):
    metadata: MetadataDict
    data: Dict[str, str]
    binaryData: Dict[str, str]
    immutable: bool

async def POST(type: str, request: Request, data: ConfigMapCreatePayload):
    try:
        # Load kubernetes configuration
        config.load_kube_config()
        
        # Initialize the CoreV1Api client
        core_api = client.CoreV1Api()
        
        if type.lower() == "configmaps":
            # Extract required fields from the request data
            name = data.get("metadata", {}).get("name")
            namespace = data.get("metadata", {}).get("namespace", "default")
            configmap_data = data.get("data", {})
            binary_data = data.get("binaryData", {})
            labels = data.get("metadata", {}).get("labels", {})
            annotations = data.get("metadata", {}).get("annotations", {})
            immutable = data.get("immutable", False)
            
            if not name:
                raise HTTPException(status_code=400, detail="ConfigMap name is required")
            
            # Create ConfigMap object
            configmap = client.V1ConfigMap(
                api_version="v1",
                kind="ConfigMap",
                metadata=client.V1ObjectMeta(
                    name=name,
                    namespace=namespace,
                    labels=labels,
                    annotations=annotations
                ),
                data=configmap_data,
                binary_data=binary_data,
                immutable=immutable
            )
            
            # Create the ConfigMap in the cluster
            created_configmap = core_api.create_namespaced_config_map(
                namespace=namespace,
                body=configmap
            )
            
            return {
                "message": f"ConfigMap {name} created successfully",
                "configmap": created_configmap.to_dict()
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported resource type: {type}")
            
    except client.rest.ApiException as e:
        raise HTTPException(status_code=e.status, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))