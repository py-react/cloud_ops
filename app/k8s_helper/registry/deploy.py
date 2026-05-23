from kubernetes import client, config
from typing import Optional, Dict

def ensure_namespace_exists(name: str):
    v1 = client.CoreV1Api()
    try:
        v1.read_namespace(name)
    except client.exceptions.ApiException as e:
        if e.status == 404:
            v1.create_namespace(client.V1Namespace(metadata=client.V1ObjectMeta(name=name)))
        else:
            raise e


def deploy_registry_on_k8s(
    name: str,
    namespace: str = "image-registry",
    storage_class: str = "standard",
    capacity: str = "10Gi",
    service_type: str = "ClusterIP",
    node_port: Optional[int] = None
) -> Dict[str, str]:
    """
    Deploys a Docker Registry on Kubernetes.
    Returns a dict with url and other details.
    """
    from app.services.kube_config_service import KubeConfigService
    KubeConfigService.load_active_config()
        
    v1 = client.CoreV1Api()
    apps_v1 = client.AppsV1Api()
    
    # 1. Create Namespace
    ensure_namespace_exists(namespace)
    
    # 2. Create PVC
    pvc_name = f"{name}-pvc"
    pvc_body = client.V1PersistentVolumeClaim(
        metadata=client.V1ObjectMeta(name=pvc_name, namespace=namespace),
        spec=client.V1PersistentVolumeClaimSpec(
            access_modes=["ReadWriteOnce"],
            resources=client.V1ResourceRequirements(
                requests={"storage": capacity}
            ),
            storage_class_name=storage_class
        )
    )
    
    try:
        v1.create_namespaced_persistent_volume_claim(namespace, pvc_body)
    except client.exceptions.ApiException as e:
        if e.status != 409: # Ignore if already exists
            raise e

    # 3. Create Deployment
    deployment_name = name
    container = client.V1Container(
        name="registry",
        image="registry:2",
        ports=[client.V1ContainerPort(container_port=5000)],
        volume_mounts=[
            client.V1VolumeMount(
                name="registry-storage",
                mount_path="/var/lib/registry"
            )
        ]
    )
    
    template = client.V1PodTemplateSpec(
        metadata=client.V1ObjectMeta(labels={"app": name}),
        spec=client.V1PodSpec(
            containers=[container],
            volumes=[
                client.V1Volume(
                    name="registry-storage",
                    persistent_volume_claim=client.V1PersistentVolumeClaimVolumeSource(
                        claim_name=pvc_name
                    )
                )
            ]
        )
    )
    
    deployment = client.V1Deployment(
        api_version="apps/v1",
        kind="Deployment",
        metadata=client.V1ObjectMeta(name=deployment_name, namespace=namespace),
        spec=client.V1DeploymentSpec(
            replicas=1,
            selector=client.V1LabelSelector(
                match_labels={"app": name}
            ),
            template=template
        )
    )
    
    try:
        apps_v1.create_namespaced_deployment(namespace, deployment)
    except client.exceptions.ApiException as e:
         if e.status != 409:
            raise e
            
    # 4. Create Service
    service_name = f"{name}-service"
    service_ports = [client.V1ServicePort(port=80, target_port=5000)]
    if service_type == "NodePort" and node_port:
        service_ports[0].node_port = node_port
        
    service = client.V1Service(
        api_version="v1",
        kind="Service",
        metadata=client.V1ObjectMeta(name=service_name, namespace=namespace),
        spec=client.V1ServiceSpec(
            type=service_type,
            selector={"app": name},
            ports=service_ports
        )
    )
    
    try:
        v1.create_namespaced_service(namespace, service)
    except client.exceptions.ApiException as e:
         if e.status != 409:
            raise e

    # Determine URL
    url = f"{service_name}.{namespace}.svc.cluster.local"
    if service_type == "NodePort":
        # Strategy to get node IP needed, but for now internal URL is base
        pass

    return {
        "name": name,
        "namespace": namespace,
        "service_name": service_name,
        "cluster_url": url,
        "pvc_name": pvc_name
    }
