from fastapi import FastAPI, Request
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from typing import List, Dict, Optional
from pydantic import BaseModel
from datetime import datetime
import json

# Pydantic models for structured response
class ContainerState(BaseModel):
    state: str
    started_at: Optional[datetime] = None
    reason: Optional[str] = None
    message: Optional[str] = None
    exit_code: Optional[int] = None
    finished_at: Optional[datetime] = None


class ContainerStatus(BaseModel):
    name: str
    state: ContainerState
    restart_count: int


class PodInfo(BaseModel):
    pod_name: str
    status: str
    node_name: Optional[str] = None
    container_statuses: List[ContainerStatus]


class ReplicaSetInfo(BaseModel):
    replicaset_name: str
    replicas: int
    available_replicas: int


class ServiceInfo(BaseModel):
    service_name: str
    type: str
    cluster_ip: str
    ports: List[Dict[str, int]]
    ingresses: Optional[List[Dict[str, Optional[str]]]] = None


class DeploymentInfo(BaseModel):
    deployment_name: str
    replicasets: List[ReplicaSetInfo]
    pods: List[PodInfo]
    services: List[ServiceInfo]
    secrets: List[str]
    configmaps: List[str]
    persistent_volumes: List[str]


class NamespaceInfo(BaseModel):
    namespace: str
    ingresses: List[Dict[str, Optional[str]]]
    deployments: List[DeploymentInfo]


# Helper functions to fetch and structure the hierarchy
def get_ingresses(namespace: str, api) -> Dict:
    ingresses = api.list_namespaced_ingress(namespace)
    ingress_map = {}
    for ingress in ingresses.items:
        ingress_info = {
            "ingress_name": ingress.metadata.name,
            "host": ingress.spec.rules[0].host if ingress.spec.rules else None,
            "path": ingress.spec.rules[0].http.paths[0].path if ingress.spec.rules else None,
            "services": []
        }

        for rule in ingress.spec.rules:
            for path in rule.http.paths:
                service_name = path.backend.service.name
                ingress_info["services"].append(service_name)

        ingress_map[ingress.metadata.name] = ingress_info
    return ingress_map


def get_services(namespace: str, api) -> Dict:
    service_map = {}
    for svc in api.list_namespaced_service(namespace).items:
        service_info = {
            "service_name": svc.metadata.name,
            "type": svc.spec.type,
            "cluster_ip": svc.spec.cluster_ip,
            "ports": [{"port": port.port, "target_port": port.target_port} for port in svc.spec.ports],
            "selector": svc.spec.selector,  # Use the service's selector
            "deployments": [],
            "ingresses":[]
        }
        service_map[svc.metadata.name] = service_info
    return service_map


def link_services_to_ingresses(ingress_map: Dict, service_map: Dict):
    new_service_map = service_map
    for ingress_info in ingress_map.values():
        for service_name in ingress_info["services"]:
            if service_name in new_service_map:
                new_service_map[service_name]["ingresses"].append(ingress_info)
    return new_service_map



def get_deployments_for_service(namespace: str, service_map: Dict, deployment_map: Dict, api_apps: client.AppsV1Api, api_core: client.CoreV1Api) -> None:
    new_map = service_map
    for svc in new_map.values():
        if svc["selector"]:
            selector_str = ",".join([f"{key}={value}" for key, value in svc["selector"].items()])
            # List deployments matching the selector
            deployments = api_apps.list_namespaced_deployment(namespace)
            for deployment in deployments.items:
                # Check if the Deployment's selector matches the Service's selector
                deployment_selector_str = ",".join([f"{key}={value}" for key, value in deployment.spec.selector.match_labels.items()])
                deployment_info = {
                    "deployment_name": deployment.metadata.name,
                    "replicasets": [],  # Pods will be added inside replicaset/statefulset
                    "secrets": [],
                    "persistent_volumes": [],
                    "status_color": "unknown",  # Overall status for the deployment
                }
                if deployment_selector_str != selector_str:
                    continue

                deployment_map[deployment_info["deployment_name"]] = True

                # Get ReplicaSets associated with the Deployment
                replica_sets = api_apps.list_namespaced_replica_set(namespace, label_selector=deployment_selector_str)
                for rs in replica_sets.items:
                    # Determine status color based on replicas
                    expected_replicas = rs.spec.replicas or 0
                    available_replicas = rs.status.available_replicas or 0
                    if available_replicas == expected_replicas and expected_replicas > 0:
                        status_color = "green"
                    elif available_replicas > 0:
                        status_color = "yellow"
                    else:
                        status_color = "red"
                    if rs.spec.replicas > 0 and rs.status.available_replicas is not None:
                        replica_set_info = {
                            "replicaset_name": rs.metadata.name,
                            "replicas": rs.spec.replicas,
                            "available_replicas": rs.status.available_replicas,
                            "pods": [],  # Pods will now be added inside the replica set
                            "status_color": status_color,
                        }
                        
                        # List pods associated with the ReplicaSet
                        pod_label_selector = ",".join([f"{key}={value}" for key, value in rs.spec.selector.match_labels.items()])
                        pods = api_core.list_namespaced_pod(namespace, label_selector=pod_label_selector)
                        
                        for pod in pods.items:
                            pod_info = {
                                "pod_name": pod.metadata.name,
                                "status": pod.status.phase,
                                "secrets": [],
                            }

                            for container in pod.spec.containers:
                                if container.env:
                                    for env_var in container.env:
                                        if env_var.value_from and env_var.value_from.secret_key_ref:
                                            secret_name = env_var.value_from.secret_key_ref.name
                                            pod_info["secrets"].append(secret_name)

                            replica_set_info["pods"].append(pod_info)

                        deployment_info["replicasets"].append(replica_set_info)

                # Similarly handle StatefulSets if needed
                stateful_sets = api_apps.list_namespaced_stateful_set(namespace, label_selector=deployment_selector_str)
                for ss in stateful_sets.items:
                    expected_replicas = ss.spec.replicas or 0
                    available_replicas = ss.status.ready_replicas or 0
                    if available_replicas == expected_replicas and expected_replicas > 0:
                        status_color = "green"
                    elif available_replicas > 0:
                        status_color = "yellow"
                    else:
                        status_color = "red"
                    if ss.spec.replicas > 0:
                        stateful_set_info = {
                            "statefulset_name": ss.metadata.name,
                            "replicas": ss.spec.replicas,
                            "pods": [],  # Pods will now be added inside the statefulset
                            "status_color": status_color,
                            "available_replicas": available_replicas,
                        }
                        
                        # List pods associated with the StatefulSet
                        pod_label_selector = ",".join([f"{key}={value}" for key, value in ss.spec.selector.match_labels.items()])
                        pods = api_core.list_namespaced_pod(namespace, label_selector=pod_label_selector)
                        
                        for pod in pods.items:
                            pod_info = {
                                "pod_name": pod.metadata.name,
                                "status": pod.status.phase,
                                "secrets": [],
                            }

                            for container in pod.spec.containers:
                                if container.env:
                                    for env_var in container.env:
                                        if env_var.value_from and env_var.value_from.secret_key_ref:
                                            secret_name = env_var.value_from.secret_key_ref.name
                                            pod_info["secrets"].append(secret_name)

                            stateful_set_info["pods"].append(pod_info)

                        deployment_info["statefulsets"].append(stateful_set_info)

                # Aggregate overall deployment status
                all_status_colors = [
                    rs["status_color"] for rs in deployment_info["replicasets"]
                ] + ([
                    ss["status_color"] for ss in deployment_info["statefulsets"]
                ] if "statefulsets" in deployment_info else [])

                if all_status_colors:
                    if "red" in all_status_colors:
                        deployment_info["status_color"] = "red"
                    elif "yellow" in all_status_colors:
                        deployment_info["status_color"] = "yellow"
                    else:
                        deployment_info["status_color"] = "green"


                # If there are any volumes (e.g., PersistentVolumeClaims)
                volumes = getattr(deployment.spec.template.spec, 'volumes', [])
                if volumes:
                    for volume in volumes:
                        if volume.secret:
                            deployment_info.setdefault("secrets", []).append(volume.secret.secret_name)
                        if volume.persistent_volume_claim:
                            deployment_info.setdefault("persistent_volumes", []).append(volume.persistent_volume_claim.claim_name)
                svc["deployments"].append(deployment_info)
    return new_map



def get_unlinked_services(namespace: str, service_map: Dict, deployment_map: Dict, api_apps: client.AppsV1Api, api_core: client.CoreV1Api) -> List[Dict]:
    unlinked_services = []
    
    # Fetch all services in the namespace
    all_svc = {svc.metadata.name: {
        "service_name": svc.metadata.name,
        "type": svc.spec.type,
        "cluster_ip": svc.spec.cluster_ip,
        "ports": [{"port": port.port, "target_port": port.target_port} for port in svc.spec.ports],
        "deployments": [],
        "selector": svc.spec.selector,
        "ingresses":[]
    } for svc in api_core.list_namespaced_service(namespace).items}

    for svc in all_svc.values():
        # if svc["service_name"] in service_map:
        #     continue
        if svc["service_name"] in service_map and "ingresses" not in service_map[svc["service_name"]] and not len(service_map[svc["service_name"]]["deployments"]) and svc["selector"]:
            selector_str = ",".join([f"{key}={value}" for key, value in svc["selector"].items()])
            
            service_structure = {
                "service_name": svc["service_name"],
                "deployments": []
            }
            deployments = api_apps.list_namespaced_deployment(namespace)
            for deployment in deployments.items:
                # Check if the Deployment's selector matches the Service's selector
                deployment_selector_str = ",".join([f"{key}={value}" for key, value in deployment.spec.selector.match_labels.items()])
                deployment_info = {
                    "deployment_name": deployment.metadata.name,
                    "replicasets": [],  # Pods will be added inside replicaset/statefulset
                    "secrets": [],
                    "persistent_volumes": [],
                    "status_color": "unknown",  # Overall status for the deployment
                }
                if deployment_selector_str != selector_str:
                    continue
                deployment_map[deployment_info["deployment_name"]] = True

                # Get ReplicaSets associated with the Deployment
                replica_sets = api_apps.list_namespaced_replica_set(namespace, label_selector=deployment_selector_str)
                for rs in replica_sets.items:
                    # Determine status color based on replicas
                    expected_replicas = rs.spec.replicas or 0
                    available_replicas = rs.status.available_replicas or 0
                    if available_replicas == expected_replicas and expected_replicas > 0:
                        status_color = "green"
                    elif available_replicas > 0:
                        status_color = "yellow"
                    else:
                        status_color = "red"
                    if rs.spec.replicas > 0 and rs.status.available_replicas is not None:
                        replica_set_info = {
                            "replicaset_name": rs.metadata.name,
                            "replicas": rs.spec.replicas,
                            "available_replicas": rs.status.available_replicas,
                            "pods": [],  # Pods will now be added inside the replica set
                            "status_color": status_color,
                        }
                        
                        # List pods associated with the ReplicaSet
                        pod_label_selector = ",".join([f"{key}={value}" for key, value in rs.spec.selector.match_labels.items()])
                        pods = api_core.list_namespaced_pod(namespace, label_selector=pod_label_selector)
                        
                        for pod in pods.items:
                            pod_info = {
                                "pod_name": pod.metadata.name,
                                "status": pod.status.phase,
                                "secrets": [],
                            }

                            for container in pod.spec.containers:
                                if container.env:
                                    for env_var in container.env:
                                        if env_var.value_from and env_var.value_from.secret_key_ref:
                                            secret_name = env_var.value_from.secret_key_ref.name
                                            pod_info["secrets"].append(secret_name)

                            replica_set_info["pods"].append(pod_info)

                        deployment_info["replicasets"].append(replica_set_info)

                # Similarly handle StatefulSets if needed
                stateful_sets = api_apps.list_namespaced_stateful_set(namespace, label_selector=deployment_selector_str)
                for ss in stateful_sets.items:
                    expected_replicas = ss.spec.replicas or 0
                    available_replicas = ss.status.ready_replicas or 0
                    if available_replicas == expected_replicas and expected_replicas > 0:
                        status_color = "green"
                    elif available_replicas > 0:
                        status_color = "yellow"
                    else:
                        status_color = "red"
                    if ss.spec.replicas > 0:
                        stateful_set_info = {
                            "statefulset_name": ss.metadata.name,
                            "replicas": ss.spec.replicas,
                            "pods": [],  # Pods will now be added inside the statefulset
                            "status_color": status_color,
                            "available_replicas": available_replicas,
                        }
                        
                        # List pods associated with the StatefulSet
                        pod_label_selector = ",".join([f"{key}={value}" for key, value in ss.spec.selector.match_labels.items()])
                        pods = api_core.list_namespaced_pod(namespace, label_selector=pod_label_selector)
                        
                        for pod in pods.items:
                            pod_info = {
                                "pod_name": pod.metadata.name,
                                "status": pod.status.phase,
                                "secrets": [],
                            }

                            for container in pod.spec.containers:
                                if container.env:
                                    for env_var in container.env:
                                        if env_var.value_from and env_var.value_from.secret_key_ref:
                                            secret_name = env_var.value_from.secret_key_ref.name
                                            pod_info["secrets"].append(secret_name)

                            stateful_set_info["pods"].append(pod_info)

                        deployment_info["statefulsets"].append(stateful_set_info)

                # Aggregate overall deployment status
                all_status_colors = [
                    rs["status_color"] for rs in deployment_info["replicasets"]
                ] + ([
                    ss["status_color"] for ss in deployment_info["statefulsets"]
                ] if "statefulsets" in deployment_info else [])

                if all_status_colors:
                    if "red" in all_status_colors:
                        deployment_info["status_color"] = "red"
                    elif "yellow" in all_status_colors:
                        deployment_info["status_color"] = "yellow"
                    else:
                        deployment_info["status_color"] = "green"


                # If there are any volumes (e.g., PersistentVolumeClaims)
                volumes = getattr(deployment.spec.template.spec, 'volumes', [])
                if volumes:
                    for volume in volumes:
                        if volume.secret:
                            deployment_info.setdefault("secrets", []).append(volume.secret.secret_name)
                        if volume.persistent_volume_claim:
                            deployment_info.setdefault("persistent_volumes", []).append(volume.persistent_volume_claim.claim_name)
                service_structure["deployments"].append(deployment_info)
            # Append unlinked service structure to the result
            unlinked_services.append(service_structure)

    return unlinked_services
    

def get_unlinked_deployments(namespace: str, api_apps: client.AppsV1Api, api_core: client.CoreV1Api) -> List[Dict]:
    unlinked_deployments = []
    
    # Fetch all deployments in the namespace
    all_deployments = api_apps.list_namespaced_deployment(namespace).items
    
    for deployment in all_deployments:
        deployment_info = {
            "deployment_name": deployment.metadata.name,
            "replicasets": [],
            "secrets": [],
            "persistent_volumes": [],
        }
        
        # Fetch replica sets related to this deployment
        label_selector = ",".join([f"{key}={value}" for key, value in deployment.spec.selector.match_labels.items()])
        replica_sets = api_apps.list_namespaced_replica_set(namespace, label_selector=label_selector)

        for rs in replica_sets.items:
            # Determine status color based on replicas
            expected_replicas = rs.spec.replicas or 0
            available_replicas = rs.status.available_replicas or 0
            if available_replicas == expected_replicas and expected_replicas > 0:
                status_color = "green"
            elif available_replicas > 0:
                status_color = "yellow"
            else:
                status_color = "red"
            if rs.spec.replicas > 0 and rs.status.available_replicas is not None:
                replica_set_info = {
                    "replicaset_name": rs.metadata.name,
                    "replicas": rs.spec.replicas,
                    "available_replicas": rs.status.available_replicas,
                    "pods": [],  # Pods are now added here
                    "status_color": status_color,
                }

                # List pods associated with the ReplicaSet
                pod_label_selector = ",".join([f"{key}={value}" for key, value in rs.spec.selector.match_labels.items()])
                pods = api_core.list_namespaced_pod(namespace, label_selector=pod_label_selector)

                for pod in pods.items:
                    pod_info = {
                        "pod_name": pod.metadata.name,
                        "status": pod.status.phase,
                        "secrets": [],
                    }

                    # Check for secrets in pod environment variables
                    for container in pod.spec.containers:
                        if container.env:
                            for env_var in container.env:
                                if env_var.value_from and env_var.value_from.secret_key_ref:
                                    secret_name = env_var.value_from.secret_key_ref.name
                                    pod_info["secrets"].append(secret_name)

                    replica_set_info["pods"].append(pod_info)

                # Append replica set info to the deployment
                deployment_info["replicasets"].append(replica_set_info)

        # Similarly handle StatefulSets if needed
        stateful_sets = api_apps.list_namespaced_stateful_set(namespace, label_selector=label_selector)
        for ss in stateful_sets.items:
            expected_replicas = ss.spec.replicas or 0
            available_replicas = ss.status.ready_replicas or 0
            if available_replicas == expected_replicas and expected_replicas > 0:
                status_color = "green"
            elif available_replicas > 0:
                status_color = "yellow"
            else:
                status_color = "red"
            if ss.spec.replicas > 0:
                stateful_set_info = {
                    "statefulset_name": ss.metadata.name,
                    "replicas": ss.spec.replicas,
                    "pods": [],  # Pods will now be added inside the statefulset
                    "status_color": status_color,
                    "available_replicas": available_replicas,
                }
                
                # List pods associated with the StatefulSet
                pod_label_selector = ",".join([f"{key}={value}" for key, value in ss.spec.selector.match_labels.items()])
                pods = api_core.list_namespaced_pod(namespace, label_selector=pod_label_selector)
                
                for pod in pods.items:
                    pod_info = {
                        "pod_name": pod.metadata.name,
                        "status": pod.status.phase,
                        "secrets": [],
                    }

                    for container in pod.spec.containers:
                        if container.env:
                            for env_var in container.env:
                                if env_var.value_from and env_var.value_from.secret_key_ref:
                                    secret_name = env_var.value_from.secret_key_ref.name
                                    pod_info["secrets"].append(secret_name)

                    stateful_set_info["pods"].append(pod_info)

                deployment_info["statefulsets"].append(stateful_set_info)

        # Aggregate overall deployment status
        all_status_colors = [
            rs["status_color"] for rs in deployment_info["replicasets"]
        ] + ([
            ss["status_color"] for ss in deployment_info["statefulsets"]
        ] if "statefulsets" in deployment_info else [])

        if all_status_colors:
            if "red" in all_status_colors:
                deployment_info["status_color"] = "red"
            elif "yellow" in all_status_colors:
                deployment_info["status_color"] = "yellow"
            else:
                deployment_info["status_color"] = "green"
        
        # Check volumes for persistent volumes or secrets
        volumes = getattr(deployment.spec.template.spec, 'volumes', [])
        if volumes:
            for volume in volumes:
                if volume.secret:
                    deployment_info.setdefault("secrets", []).append(volume.secret.secret_name)
                if volume.persistent_volume_claim:
                    deployment_info.setdefault("persistent_volumes", []).append(volume.persistent_volume_claim.claim_name)

        # Add unlinked deployment to the list
        unlinked_deployments.append(deployment_info)

    return unlinked_deployments

def fetch_namespace_hierarchy(namespace: str) -> Dict:
    apps_v1_api = client.AppsV1Api()
    core_v1_api = client.CoreV1Api()
    networking_v1_api = client.NetworkingV1Api()

    try:
        # Fetch resources
        ingress_map = get_ingresses(namespace, networking_v1_api)
        service_map = get_services(namespace, core_v1_api)
        deployment_map = {}
        # Get deployments for each service
        service_map = get_deployments_for_service(namespace, service_map, deployment_map, apps_v1_api, core_v1_api)
        # Link services to ingresses
        service_map = link_services_to_ingresses(ingress_map, service_map)
        # Get unlinked services
        unlinked_services = get_unlinked_services(namespace, service_map,deployment_map, apps_v1_api, core_v1_api)

        # Get unlinked deployments
        unlinked_deployments = get_unlinked_deployments(namespace, apps_v1_api, core_v1_api)

        # Construct final namespace info
        namespace_info = {
            "namespace": namespace,
            "ingresses": []
        }
        
        total_expected_replicas = 0
        total_available_replicas = 0

        # Add linked ingresses with their services and deployments
        for ingress_info in ingress_map.values():
            ingress_structure = {
                "ingress_name": ingress_info["ingress_name"],
                "services": []
            }
            for service_name in ingress_info["services"]:
                service_info = service_map.get(service_name, None)
                if service_info:
                    ingress_structure["services"].append(service_info)
                    del service_map[service_name]

            namespace_info["ingresses"].append(ingress_structure)

        
        # Add unlinked services under the `--NA--` ingress
        for service in unlinked_services:
            if "services" not in namespace_info:
                namespace_info["services"] = [service]  # Adding as deployment-like structure
            else:
                namespace_info["services"].append(service)  # Adding as deployment-like structure

            for deployment_info in service.get("deployments", []):
                for replica_set_info in deployment_info.get("replicasets", []):
                    total_expected_replicas += replica_set_info["replicas"]
                    total_available_replicas += replica_set_info["available_replicas"]
                    del replica_set_info["replicas"]
                    del replica_set_info["available_replicas"]

        

        # Append unlinked deployments to the existing `--NA--` service
        for deployment_info in unlinked_deployments:
            if deployment_info["deployment_name"] not in deployment_map:

                if "deployments" not in namespace_info:
                    namespace_info["deployments"] = [deployment_info]
                else:
                    namespace_info["deployments"].append(deployment_info)

                for replica_set_info in deployment_info.get("replicasets", []):
                    total_expected_replicas += replica_set_info["replicas"]
                    total_available_replicas += replica_set_info["available_replicas"]
                    del replica_set_info["replicas"]
                    del replica_set_info["available_replicas"]


        # Calculate the overall pod status by checking all replica sets
        for service_info in service_map.values():
            if "services" not in namespace_info:
                namespace_info["services"] = [service_info]  # Adding as deployment-like structure
            else:
                namespace_info["services"].append(service_info)  # Adding as deployment-like structure
            for deployment_info in service_info.get("deployments", []):
                for replica_set_info in deployment_info.get("replicasets", []):
                    total_expected_replicas += replica_set_info["replicas"]
                    total_available_replicas += replica_set_info["available_replicas"]
                    del replica_set_info["replicas"]
                    del replica_set_info["available_replicas"]


        # Set pod status based on replica availability
        if total_available_replicas == total_expected_replicas:
            namespace_info["pod_status"] = "green"  # All pods are running as expected
        elif total_available_replicas > 0:
            namespace_info["pod_status"] = "yellow"  # Some pods are running, but not all
        else:
            namespace_info["pod_status"] = "red"  # No pods are running

        namespace_info["total_expected_replicas"] = total_expected_replicas
        namespace_info["available_replicas"] = total_available_replicas
        return namespace_info

    except ApiException as e:
        raise Exception(f"Error fetching resources: {e}")


async def GET(request:Request,namespace:str):
    # Load Kubernetes configuration (assumes kubeconfig is set up locally)
    try:
        config.load_kube_config()
    except Exception as e:
        raise Exception(f"Error loading kubeconfig: {e}")
    items = fetch_namespace_hierarchy(namespace)
    return {"items":items}