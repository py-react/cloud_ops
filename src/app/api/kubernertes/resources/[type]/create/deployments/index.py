from kubernetes import client, config
from kubernetes.client.rest import ApiException
from fastapi import HTTPException, Request
from typing import Dict, Any, TypedDict, Optional, List
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# --- TypedDicts for Deployment creation ---
class ContainerPort(TypedDict, total=False):
    name: str
    containerPort: int
    protocol: str

class Container(TypedDict, total=False):
    name: str
    image: str
    ports: List[ContainerPort]
    env: List[Dict[str, Any]]
    resources: Dict[str, Any]
    command: List[str]
    args: List[str]

class PodSpec(TypedDict, total=False):
    containers: List[Container]
    restartPolicy: str
    terminationGracePeriodSeconds: int

class PodTemplateMetadata(TypedDict, total=False):
    labels: Dict[str, str]
    annotations: Dict[str, str]

class PodTemplateSpec(TypedDict, total=False):
    metadata: PodTemplateMetadata
    spec: PodSpec

class Selector(TypedDict, total=False):
    matchLabels: Dict[str, str]

class DeploymentSpec(TypedDict, total=False):
    replicas: int
    selector: Selector
    template: PodTemplateSpec
    strategy: Dict[str, Any]

class MetadataDict(TypedDict, total=False):
    name: str
    namespace: str
    labels: Dict[str, str]
    annotations: Dict[str, str]

class DeploymentCreatePayload(TypedDict, total=False):
    metadata: MetadataDict
    spec: DeploymentSpec

async def POST(type: str, request: Request, data: DeploymentCreatePayload):
    try:
        # Load kubernetes configuration
        config.load_kube_config()
        
        # Initialize the AppsV1Api client
        apps_api = client.AppsV1Api()
        
        if type.lower() == "deployments":
            # Extract required fields from the request data
            name = data.get("metadata", {}).get("name")
            namespace = data.get("metadata", {}).get("namespace", "default")
            spec = data.get("spec", {})
            labels = data.get("metadata", {}).get("labels", {})
            annotations = data.get("metadata", {}).get("annotations", {})
            
            if not name:
                raise HTTPException(status_code=400, detail="Deployment name is required")
            
            # Debug logging
            logger.debug(f"Received data: {data}")
            logger.debug(f"Spec: {spec}")
            
            # Validate template structure
            if not spec.get("template"):
                raise HTTPException(
                    status_code=400,
                    detail="Template is required in spec. Please include spec.template with metadata and spec"
                )
            
            template = spec.get("template", {})
            if not template.get("spec"):
                raise HTTPException(
                    status_code=400,
                    detail="Template spec is required. Please include spec.template.spec with containers"
                )
            
            template_spec = template.get("spec", {})
            containers = template_spec.get("containers", [])
            
            logger.debug(f"Template: {template}")
            logger.debug(f"Template spec: {template_spec}")
            logger.debug(f"Containers: {containers}")
            
            if not containers:
                raise HTTPException(
                    status_code=400,
                    detail="At least one container is required in spec.template.spec.containers"
                )
            
            # Ensure the first container has required fields
            first_container = containers[0]
            if not first_container.get("name"):
                raise HTTPException(
                    status_code=400,
                    detail="Container name is required in spec.template.spec.containers[0]"
                )
            if not first_container.get("image"):
                raise HTTPException(
                    status_code=400,
                    detail="Container image is required in spec.template.spec.containers[0]"
                )
            
            # Get template labels and ensure they match selector labels
            template_labels = template.get("metadata", {}).get("labels", {})
            selector_labels = spec.get("selector", {}).get("matchLabels", {})
            
            # If template labels are empty but selector labels exist, use selector labels
            if not template_labels and selector_labels:
                template_labels = selector_labels
            # If selector labels are empty but template labels exist, use template labels
            elif not selector_labels and template_labels:
                selector_labels = template_labels
            
            # Create container objects
            container_objects = []
            for container in containers:
                container_obj = client.V1Container(
                    name=container.get("name"),
                    image=container.get("image"),
                    ports=[
                        client.V1ContainerPort(
                            name=port.get("name"),
                            container_port=port.get("containerPort"),
                            protocol=port.get("protocol", "TCP")
                        ) for port in container.get("ports", [])
                    ],
                    env=[
                        client.V1EnvVar(
                            name=env.get("name"),
                            value=env.get("value")
                        ) for env in container.get("env", [])
                    ],
                    resources=client.V1ResourceRequirements(
                        requests=container.get("resources", {}).get("requests", {}),
                        limits=container.get("resources", {}).get("limits", {})
                    ) if container.get("resources") else None,
                    command=container.get("command"),
                    args=container.get("args")
                )
                container_objects.append(container_obj)
            
            logger.debug(f"Created container objects: {container_objects}")
            
            # Create Deployment object
            deployment = client.V1Deployment(
                api_version="apps/v1",
                kind="Deployment",
                metadata=client.V1ObjectMeta(
                    name=name,
                    namespace=namespace,
                    labels=labels,
                    annotations=annotations
                ),
                spec=client.V1DeploymentSpec(
                    replicas=spec.get("replicas", 1),
                    selector=client.V1LabelSelector(
                        match_labels=selector_labels
                    ),
                    template=client.V1PodTemplateSpec(
                        metadata=client.V1ObjectMeta(
                            labels=template_labels
                        ),
                        spec=client.V1PodSpec(
                            containers=container_objects,
                            restart_policy=template_spec.get("restartPolicy", "Always"),
                            termination_grace_period_seconds=template_spec.get("terminationGracePeriodSeconds")
                        )
                    ),
                    strategy=client.V1DeploymentStrategy(
                        type=spec.get("strategy", {}).get("type", "RollingUpdate"),
                        rolling_update=client.V1RollingUpdateDeployment(
                            max_surge=spec.get("strategy", {}).get("rollingUpdate", {}).get("maxSurge"),
                            max_unavailable=spec.get("strategy", {}).get("rollingUpdate", {}).get("maxUnavailable")
                        ) if spec.get("strategy", {}).get("type") == "RollingUpdate" else None
                    )
                )
            )
            
            logger.debug(f"Created deployment object: {deployment}")
            
            # Create the Deployment in the cluster
            created_deployment = apps_api.create_namespaced_deployment(
                namespace=namespace,
                body=deployment
            )
            
            return {
                "message": f"Deployment {name} created successfully",
                "deployment": created_deployment.to_dict()
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported resource type: {type}")
            
    except client.rest.ApiException as e:
        logger.error(f"Kubernetes API Exception: {str(e)}")
        logger.error(f"Response body: {e.body}")
        raise HTTPException(status_code=e.status, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
            