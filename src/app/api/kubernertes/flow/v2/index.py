from fastapi import Request
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import json

# =============================================================================
# Pydantic Models
# =============================================================================

class PodInfo(BaseModel):
    component_type: str
    name: str
    status: str
    restarts: int
    age: str
    ip: Optional[str]
    node: str
    resources: Dict[str, Dict[str, str]]

class DeploymentInfo(BaseModel):
    component_type: str
    deployment_name: str
    available_replicas: int
    expected_replicas: int
    pods: List[PodInfo]

class DaemonSetInfo(BaseModel):
    component_type: str
    daemonset_name: str
    available_replicas: int
    expected_replicas: int
    pods: List[PodInfo]

class StatefulSetInfo(BaseModel):
    component_type: str
    statefulset_name: str
    available_replicas: int
    expected_replicas: int
    pods: List[PodInfo]

class JobInfo(BaseModel):
    component_type: str
    job_name: str
    pods: List[PodInfo]

class CronJobInfo(BaseModel):
    component_type: str
    cronjob_name: str
    pods: List[PodInfo]

class ServiceInfo(BaseModel):
    component_type: str
    service_name: str
    type: str
    clusterIP: str
    externalIP: str
    age: str
    ports: List[Dict[str, Any]]
    deployments: List[DeploymentInfo] = []
    daemonsets: List[DaemonSetInfo] = []
    statefulsets: List[StatefulSetInfo] = []
    jobs: List[JobInfo] = []
    cronjobs: List[CronJobInfo] = []
    node_names: List[str] = []
    selector: Optional[Dict[str, str]] = None  # Retained for matching

class IngressPath(BaseModel):
    service_name: str
    path: str
    path_type: str

class IngressInfo(BaseModel):
    component_type: str
    ingress_name: str
    host: Optional[str]
    paths: List[IngressPath]
    services: Optional[List[ServiceInfo]] = None  # Only if linked

class NodeInfo(BaseModel):
    component_type: str
    name: str
    status: str
    role: str
    age: str
    version: str
    internalIP: Optional[str]
    externalIP: Optional[str]
    os: str
    architecture: str
    resources: Dict[str, Dict[str, str]]
    conditions: List[Dict[str, str]]

class NamespaceInfo(BaseModel):
    ingresses: Optional[List[IngressInfo]] = None
    services: Optional[List[ServiceInfo]] = None
    deployments: Optional[List[DeploymentInfo]] = None      # Unlinked deployments
    statefulsets: Optional[List[StatefulSetInfo]] = None       # Unlinked statefulsets
    daemonsets: Optional[List[DaemonSetInfo]] = None           # Unlinked daemonsets
    cronJobs:Optional[List[CronJobInfo]] = None
    jobs:Optional[List[JobInfo]] = None
    nodes: List[NodeInfo]

# =============================================================================
# Helper Functions
# =============================================================================

class JsonEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return list(obj)
        return json.JSONEncoder.default(self, obj)

def find_index_by_attribute(dict_list, attribute, value):
    for index, d in enumerate(dict_list):
        if d.get(attribute) == value:
            return index
    return -1

def parse_cpu_to_millicpu(cpu_str: str) -> int:
    if cpu_str.endswith("m"):
        return int(cpu_str.rstrip("m"))
    elif cpu_str.endswith("n"):
        return int(int(cpu_str.rstrip("n")) / 1000000)  # Convert nanocores to millicores
    else:
        return int(float(cpu_str) * 1000)

def parse_memory_to_Mi(mem_str: str) -> int:
    if mem_str.endswith("Ki"):
        return int(int(mem_str.rstrip("Ki")) / 1024)
    elif mem_str.endswith("Mi"):
        return int(mem_str.rstrip("Mi"))
    elif mem_str.endswith("Gi"):
        return int(mem_str.rstrip("Gi")) * 1024
    else:
        return int(mem_str)

def format_memory(memory_str: str) -> str:
    try:
        if memory_str.endswith('Ki'):
            return f"{int(memory_str[:-2]) / 1024:.1f}Mi"
        elif memory_str.endswith('Mi'):
            return f"{memory_str}"
        elif memory_str.endswith('Gi'):
            return f"{float(memory_str[:-2]) * 1024}Mi"
        else:
            return f"{int(memory_str) / (1024 * 1024):.1f}Mi"
    except:
        return "0Mi"

def get_node_metrics() -> Dict[str, Dict[str, int]]:
    metrics = {}
    custom_api = client.CustomObjectsApi()
    
    try:
        nodes_metric = custom_api.list_cluster_custom_object(
            group="metrics.k8s.io", version="v1beta1", plural="nodes"
        )
        for item in nodes_metric.get("items", []):
            node_name = item["metadata"]["name"]
            cpu_str = item["usage"]["cpu"]
            mem_str = item["usage"]["memory"]
            
            # Handle CPU conversion
            if cpu_str.endswith("n"):
                cpu_usage = int(int(cpu_str.rstrip("n")) / 1000000)  # Convert nanocores to millicores
            elif cpu_str.endswith("m"):
                cpu_usage = int(cpu_str.rstrip("m"))
            else:
                cpu_usage = int(float(cpu_str) * 1000)
            mem_usage = parse_memory_to_Mi(mem_str)
            metrics[node_name] = {"cpu": cpu_usage, "memory": mem_usage}
    except (ApiException, Exception) as e:
        print(e, "<========Error while fetching node metric")
    return metrics

def get_effective_request(container, namespace_default_requests: Dict[str, str]) -> (str, str):
    reqs = container.resources.requests or {}
    cpu_req = reqs.get("cpu") or namespace_default_requests.get("cpu", "0")
    mem_req = reqs.get("memory") or namespace_default_requests.get("memory", "0")
    return cpu_req, mem_req

def get_effective_limit(container) -> (str, str):
    limits = container.resources.limits or {}
    cpu_limit = limits.get("cpu") or "0"
    mem_limit = limits.get("memory") or "0"
    return cpu_limit, mem_limit

def get_pod_metrics(namespace: str) -> Dict[str, Dict[str, int]]:
    metrics = {}
    custom_api = client.CustomObjectsApi()
    
    try:
        print(f"Fetching metrics for namespace: {namespace}")
        pods_metric = custom_api.list_namespaced_custom_object(
            group="metrics.k8s.io",
            version="v1beta1",
            namespace=namespace,
            plural="pods"
        )
        
        print(f"Found {len(pods_metric.get('items', []))} pods with metrics")
        for pod in pods_metric.get("items", []):
            pod_name = pod["metadata"]["name"]
            total_cpu = 0
            total_memory = 0
            
            # Sum up container metrics
            for container in pod.get("containers", []):
                cpu = container.get("usage", {}).get("cpu", "0")
                memory = container.get("usage", {}).get("memory", "0")
                
                # Convert CPU to millicores
                if cpu.endswith("n"):
                    cpu_millicores = int(int(cpu.rstrip("n")) / 1000000)
                elif cpu.endswith("m"):
                    cpu_millicores = int(cpu.rstrip("m"))
                else:
                    cpu_millicores = int(float(cpu) * 1000)
                
                # Format memory to Mi
                memory_mi = format_memory(memory)
                
                print(f"Pod: {pod_name}, Container: {container['name']}")
                print(f"  CPU: {cpu_millicores}m ({cpu_millicores/1000:.3f} cores)")
                print(f"  Memory: {memory_mi}")
                
                total_cpu += cpu_millicores
                total_memory += parse_memory_to_Mi(memory)
            
            metrics[pod_name] = {
                "cpu": total_cpu,
                "memory": total_memory
            }
            print(f"Total metrics for {pod_name}:")
            print(f"  CPU: {total_cpu}m ({total_cpu/1000:.3f} cores)")
            print(f"  Memory: {total_memory}Mi")
            print("---")
    except Exception as e:
        print(f"Error fetching pod metrics: {e}")
        print(f"Error details: {str(e)}")
    
    return metrics

def get_pod_info(pod, namespace_default_requests) -> Dict:
    pod_cpu_limit = 0
    pod_mem_limit = 0
    pod_cpu_request = 0
    pod_mem_request = 0

    # Get pod metrics
    try:
        pod_metrics = get_pod_metrics(pod.metadata.namespace)
        current_pod_metrics = pod_metrics.get(pod.metadata.name, {})
        pod_cpu_usage = current_pod_metrics.get("cpu", 0)  # in millicores
        pod_mem_usage = current_pod_metrics.get("memory", 0)  # in Mi
    except Exception as e:
        print(f"Error getting pod metrics: {e}")
        pod_cpu_usage = 0
        pod_mem_usage = 0

    if pod.spec.containers:
        for container in pod.spec.containers:
            # Get requests and limits
            cpu_req, mem_req = get_effective_request(container, namespace_default_requests)
            cpu_limit, mem_limit = get_effective_limit(container)
            
            # Sum up the limits
            pod_cpu_limit += parse_cpu_to_millicpu(cpu_limit)
            pod_mem_limit += parse_memory_to_Mi(mem_limit)
            
            # Sum up the requests
            pod_cpu_request += parse_cpu_to_millicpu(cpu_req)
            pod_mem_request += parse_memory_to_Mi(mem_req)

    # Calculate percentages based on actual usage vs limits
    cpu_percentage = "0"
    if pod_cpu_limit > 0:
        cpu_percentage = str(round((pod_cpu_usage / pod_cpu_limit) * 100))
    
    mem_percentage = "0"
    if pod_mem_limit > 0:
        mem_percentage = str(round((pod_mem_usage / pod_mem_limit) * 100))

    return {
        "component_type": "pod",
        "name": pod.metadata.name,
        "status": pod.status.phase,
        "restarts": sum(cs.restart_count for cs in pod.status.container_statuses) if pod.status.container_statuses else 0,
        "age": str(pod.metadata.creation_timestamp),
        "ip": pod.status.pod_ip or "N/A",
        "node": pod.spec.node_name,
        "resources": {
            "cpu": {
                "used": f"{pod_cpu_usage/1000:.2f}",
                "request": f"{pod_cpu_request/1000:.2f}",
                "total": f"{pod_cpu_limit/1000:.2f}" if pod_cpu_limit > 0 else "unlimited",
                "percentage": cpu_percentage
            },
            "memory": {
                "used": f"{pod_mem_usage}Mi",
                "request": f"{pod_mem_request}Mi",
                "total": f"{pod_mem_limit}Mi" if pod_mem_limit > 0 else "unlimited",
                "percentage": mem_percentage
            }
        }
    }

def is_subset(sub: Dict[str, str], full: Dict[str, str]) -> bool:
    """Return True if all key-value pairs in 'sub' are present in 'full'."""
    for k, v in sub.items():
        if full.get(k) != v:
            return False
    return True

# =============================================================================
# Workload Fetch Functions for Services (using svc.spec.selector)
# =============================================================================

def get_deployments_for_selector(namespace, selector_str, namespace_default_requests,all_deployments) -> List[Dict]:
    apps_v1_api = client.AppsV1Api()
    core_v1_api = client.CoreV1Api()
    deployments = []
    try:
        dep_list = apps_v1_api.list_namespaced_deployment(namespace, label_selector=selector_str)
        for dep in dep_list.items:
            pods = []
            match_labels = dep.spec.selector.match_labels
            available_replicas = dep.status.ready_replicas or 0
            expected_replicas = dep.spec.replicas or 0
            deployments.append({
                "component_type": "deploymentV2",
                "deployment_name": dep.metadata.name,
                "match_labels": match_labels,
                "available_replicas": available_replicas,
                "expected_replicas": expected_replicas,
                "pods": pods
            })
            if expected_replicas > 0 and available_replicas is not None:
                pod_selector = ",".join([f"{k}={v}" for k, v in match_labels.items()])
                pod_list = core_v1_api.list_namespaced_pod(namespace, label_selector=pod_selector)
                for pod in pod_list.items:
                    pods.append(get_pod_info(pod, namespace_default_requests))
            removeIndex = find_index_by_attribute(all_deployments,"deployment_name",dep.metadata.name)
            if removeIndex != -1:
                del all_deployments[removeIndex]

    except Exception as e:
        print("Error fetching deployments:", e)
    return deployments

def get_daemonsets_for_selector(namespace, selector_str, namespace_default_requests,all_daemonsets) -> List[Dict]:
    apps_v1_api = client.AppsV1Api()
    core_v1_api = client.CoreV1Api()
    daemonsets = []
    try:
        ds_list = apps_v1_api.list_namespaced_daemon_set(namespace, label_selector=selector_str).items
        for ds in ds_list:
            pods = []
            match_labels = ds.spec.selector.match_labels
            available_replicas = ds.status.number_available or 0
            expected_replicas = ds.status.desired_number_scheduled or 0
            
            daemonsets.append({
                "component_type": "deploymentV2",
                "daemonset_name": ds.metadata.name,
                "match_labels": match_labels,
                "available_replicas": available_replicas,
                "expected_replicas": expected_replicas,
                "pods": pods
            })
            if expected_replicas > 0 and available_replicas is not None:
                pod_selector = ",".join([f"{k}={v}" for k, v in match_labels.items()])
                pod_list = core_v1_api.list_namespaced_pod(namespace, label_selector=pod_selector)
                for pod in pod_list.items:
                    pods.append(get_pod_info(pod, namespace_default_requests))
            removeIndex = find_index_by_attribute(all_daemonsets,"deployment_name",ds.metadata.name)
            if removeIndex != -1:
                del all_daemonsets[removeIndex]

    except Exception as e:
        print("Error fetching daemonsets:", e)
    return daemonsets

def get_statefulsets_for_selector(namespace, selector_str, namespace_default_requests,all_statefulsets) -> List[Dict]:
    apps_v1_api = client.AppsV1Api()
    core_v1_api = client.CoreV1Api()
    statefulsets = []
    try:
        ss_list = apps_v1_api.list_namespaced_stateful_set(namespace, label_selector=selector_str).items
        for ss in ss_list:
            pods = []
            match_labels = ss.spec.selector.match_labels
            available_replicas = ss.status.ready_replicas or 0
            expected_replicas = ss.spec.replicas or 0
            
            statefulsets.append({
                "component_type": "deploymentV2",
                "statefulset_name": ss.metadata.name,
                "match_labels": match_labels,
                "available_replicas": available_replicas,
                "expected_replicas": expected_replicas,
                "pods": pods
            })
            if expected_replicas > 0 and available_replicas is not None:
                pod_selector = ",".join([f"{k}={v}" for k, v in match_labels.items()])
                pod_list = core_v1_api.list_namespaced_pod(namespace, label_selector=pod_selector)
                for pod in pod_list.items:
                    pods.append(get_pod_info(pod, namespace_default_requests))
            removeIndex = find_index_by_attribute(all_statefulsets,"deployment_name",ss.metadata.name)
            if removeIndex != -1:
                del all_statefulsets[removeIndex]
    except Exception as e:
        print("Error fetching statefulsets:", e)
    return statefulsets

def get_jobs_for_selector(namespace,selector_str, namespace_default_requests) -> List[Dict]:
    core_v1_api = client.CoreV1Api()
    batch_v1_api = client.BatchV1Api()
    jobs = []
    try:
        job_list = batch_v1_api.list_namespaced_job(namespace, label_selector=selector_str).items
        for job in job_list:
            pods = []
            match_labels = job.spec.selector.match_labels if job.spec.selector and job.spec.selector.match_labels else job.metadata.labels
            if match_labels:
                pod_selector = ",".join([f"{k}={v}" for k, v in match_labels.items()])
                pod_list = core_v1_api.list_namespaced_pod(namespace, label_selector=pod_selector)
                for pod in pod_list.items:
                    pods.append(get_pod_info(pod, namespace_default_requests))
            jobs.append({
                "component_type": "job",
                "job_name": job.metadata.name,
                "pods": pods
            })
    except Exception as e:
        print("Error fetching jobs:", e)
    return jobs

def get_cronjobs_for_selector(namespace, selector_str, namespace_default_requests) -> List[Dict]:
    core_v1_api = client.CoreV1Api()
    try:
        batch_v1beta1_api = client.BatchV1beta1Api()
    except Exception:
        batch_v1beta1_api = None
    cronjobs = []
    try:
        if batch_v1beta1_api is None:
            return cronjobs
        cj_list = batch_v1beta1_api.list_namespaced_cron_job(namespace, label_selector=selector_str).items
        for cj in cj_list:
            pods = []
            if cj.spec.job_template and cj.spec.job_template.spec.selector and cj.spec.job_template.spec.selector.match_labels:
                match_labels = cj.spec.job_template.spec.selector.match_labels
            else:
                match_labels = cj.metadata.labels
            if match_labels:
                pod_selector = ",".join([f"{k}={v}" for k, v in match_labels.items()])
                pod_list = core_v1_api.list_namespaced_pod(namespace, label_selector=pod_selector)
                for pod in pod_list.items:
                    pods.append(get_pod_info(pod, namespace_default_requests))
            cronjobs.append({
                "component_type": "cronjob",
                "cronjob_name": cj.metadata.name,
                "pods": pods
            })
    except Exception as e:
        print("Error fetching cronjobs:", e)
    return cronjobs

# =============================================================================
# Functions to Get All Workloads (Unlinked) Without Filtering by Service Selector
# =============================================================================

def get_all_deployments(namespace, namespace_default_requests) -> List[Dict]:
    apps_v1_api = client.AppsV1Api()
    core_v1_api = client.CoreV1Api()
    deployments = []
    try:
        dep_list = apps_v1_api.list_namespaced_deployment(namespace).items
        for dep in dep_list:
            pods = []
            match_labels = dep.spec.selector.match_labels
            available_replicas = dep.status.ready_replicas or 0
            expected_replicas = dep.spec.replicas or 0
            
            deployments.append({
                "component_type": "deploymentV2",
                "deployment_name": dep.metadata.name,
                "match_labels": match_labels,
                "available_replicas": available_replicas,
                "expected_replicas": expected_replicas,
                "pods": pods
            })
            if expected_replicas > 0 and available_replicas is not None:
                pod_selector = ",".join([f"{k}={v}" for k, v in match_labels.items()])
                pod_list = core_v1_api.list_namespaced_pod(namespace, label_selector=pod_selector)
                for pod in pod_list.items:
                    pods.append(get_pod_info(pod, namespace_default_requests))
    except Exception as e:
        print("Error fetching all deployments:", e)
    return deployments

def get_all_statefulsets(namespace, namespace_default_requests) -> List[Dict]:
    apps_v1_api = client.AppsV1Api()
    core_v1_api = client.CoreV1Api()
    statefulsets = []
    try:
        ss_list = apps_v1_api.list_namespaced_stateful_set(namespace).items
        for ss in ss_list:
            pods = []
            match_labels = ss.spec.selector.match_labels
            available_replicas = ss.status.ready_replicas or 0
            expected_replicas = ss.spec.replicas or 0

            statefulsets.append({
                "component_type": "deploymentV2",
                "statefulset_name": ss.metadata.name,
                "match_labels": match_labels,
                "available_replicas": available_replicas,
                "expected_replicas": expected_replicas,
                "pods": pods
            })
            if expected_replicas > 0 and available_replicas is not None:
                pod_selector = ",".join([f"{k}={v}" for k, v in match_labels.items()])
                pod_list = core_v1_api.list_namespaced_pod(namespace, label_selector=pod_selector)
                for pod in pod_list.items:
                    pods.append(get_pod_info(pod, namespace_default_requests))
    except Exception as e:
        print("Error fetching all statefulsets:", e)
    return statefulsets

def get_all_daemonsets(namespace, namespace_default_requests) -> List[Dict]:
    apps_v1_api = client.AppsV1Api()
    core_v1_api = client.CoreV1Api()
    daemonsets = []
    try:
        ds_list = apps_v1_api.list_namespaced_daemon_set(namespace).items
        for ds in ds_list:
            pods = []
            match_labels = ds.spec.selector.match_labels
            available_replicas = ds.status.number_available or 0
            expected_replicas = ds.status.desired_number_scheduled or 0
            
            daemonsets.append({
                "component_type": "deploymentV2",
                "daemonset_name": ds.metadata.name,
                "match_labels": match_labels,
                "available_replicas": available_replicas,
                "expected_replicas": expected_replicas,
                "pods": pods
            })
            if expected_replicas > 0 and available_replicas is not None:
                pod_selector = ",".join([f"{k}={v}" for k, v in match_labels.items()])
                pod_list = core_v1_api.list_namespaced_pod(namespace, label_selector=pod_selector)
                for pod in pod_list.items:
                    pods.append(get_pod_info(pod, namespace_default_requests))
    except Exception as e:
        print("Error fetching all daemonsets:", e)
    return daemonsets

# =============================================================================
# Service and Ingress Functions
# =============================================================================

def get_services(
        namespace: str,
        namespace_default_requests,
        all_deployments,
        all_statefulsets,
        all_daemonsets
    ) -> Dict[str, Dict]:
    core_v1_api = client.CoreV1Api()

    service_map = {}
    svc_list = core_v1_api.list_namespaced_service(namespace).items
    for svc in svc_list:
        if svc.metadata.name == "kubernetes":
            print()
        ports = []
        for p in svc.spec.ports:
            target_port = int(p.target_port) if isinstance(p.target_port, (int, float)) else None
            ports.append({
                "port": p.port,
                "targetPort": target_port,
                "protocol": p.protocol
            })
        selector = ",".join([f"{k}={v}" for k, v in svc.spec.selector.items()]) if svc.spec.selector else ""
        service_info = {
            "component_type": "service",
            "service_name": svc.metadata.name,
            "type": svc.spec.type,
            "clusterIP": svc.spec.cluster_ip,
            "externalIP": svc.status.load_balancer.ingress[0].ip if svc.status.load_balancer and svc.status.load_balancer.ingress else "N/A",
            "age": str(svc.metadata.creation_timestamp),
            "ports": ports,
            "selector": svc.spec.selector,
            "deployments": get_deployments_for_selector(
                namespace,
                selector,
                namespace_default_requests,
                all_deployments
            ) if selector else [],
            "daemonsets": get_daemonsets_for_selector(
                namespace,
                selector,
                namespace_default_requests,
                all_daemonsets
            ) if selector else [],
            "statefulsets": get_statefulsets_for_selector(
                namespace,
                selector,
                namespace_default_requests,
                all_statefulsets
            ) if selector else [],
            "jobs": get_jobs_for_selector(
                namespace,
                selector,
                namespace_default_requests)if selector else [],
            "cronjobs": get_cronjobs_for_selector(
                namespace,
                selector,
                namespace_default_requests)if selector else [],
            "node_names": []
        }
        try:
            endpoints = core_v1_api.read_namespaced_endpoints(svc.metadata.name, namespace)
            if endpoints.subsets:
                for subset in endpoints.subsets:
                    if subset.addresses:
                        for address in subset.addresses:
                            if address.node_name:
                                service_info["node_names"].append(address.node_name)
        except Exception as e:
            print(f"Error fetching endpoints for service {svc.metadata.name}: {e}")
        service_map[svc.metadata.name] = service_info
    return service_map

def get_ingresses(namespace: str) -> Dict[str, Dict]:
    networking_v1_api = client.NetworkingV1Api()
    ingress_map = {}
    ing_list = networking_v1_api.list_namespaced_ingress(namespace).items
    for ing in ing_list:
        paths = []
        service_names = []
        if ing.spec.rules:
            for rule in ing.spec.rules:
                if rule.http and rule.http.paths:
                    for path in rule.http.paths:
                        svc_name = path.backend.service.name if path.backend and path.backend.service else None
                        if svc_name:
                            paths.append({
                                "service_name": svc_name,
                                "path": path.path,
                                "path_type": path.path_type
                            })
                            service_names.append(svc_name)
        ingress_map[ing.metadata.name] = {
            "component_type": "ingress",
            "ingress_name": ing.metadata.name,
            "host": ing.spec.rules[0].host if ing.spec.rules and ing.spec.rules[0].host else None,
            "paths": paths,
            "service_names": service_names  # temporary field for linking
        }
    return ingress_map

def link_services_to_ingresses(ingress_map: Dict[str, Dict], service_map: Dict[str, Dict]) -> None:
    for ing in ingress_map.values():
        linked_services = []
        for svc_name in ing.get("service_names", []):
            if svc_name in service_map:
                linked_services.append(service_map[svc_name])
                service_map.pop(svc_name, None)
        ing["services"] = linked_services if linked_services else None

# =============================================================================
# Assemble the Hierarchy and Build the Namespace Response
# =============================================================================

def fetch_namespace_hierarchy(namespace: str) -> Dict:
    core_v1_api = client.CoreV1Api()
    batch_v1_api = client.BatchV1Api()

    # Retrieve default requests from LimitRanges
    namespace_default_requests = {}
    try:
        lr_list = core_v1_api.list_namespaced_limit_range(namespace).items
        for lr in lr_list:
            if lr.spec.limits:
                for limit in lr.spec.limits:
                    if limit.type == "Container" and hasattr(limit, "default_request") and limit.default_request:
                        namespace_default_requests.update(limit.default_request)
    except Exception:
        pass

    # Build Node information
    node_metrics = get_node_metrics()
    nodes = core_v1_api.list_node().items
    node_info_list = []
    for node in nodes:
        cpu_total = node.status.capacity.get("cpu", "0")
        memory_total = node.status.capacity.get("memory", "0")
        storage_total = node.status.capacity.get("ephemeral-storage", "0")
        total_cpu = parse_cpu_to_millicpu(cpu_total)
        total_mem = parse_memory_to_Mi(memory_total)
        total_storage = int(int(storage_total.rstrip("Ki")) / 1024) if storage_total.endswith("Ki") else 0
        role = "master" if "node-role.kubernetes.io/master" in node.metadata.labels else "worker"
        node_name = node.metadata.name
        used_cpu = node_metrics.get(node_name, {}).get("cpu", 0)
        used_mem = node_metrics.get(node_name, {}).get("memory", 0)
        cpu_percentage = round((used_cpu / total_cpu) * 100) if total_cpu > 0 else 0
        mem_percentage = round((used_mem / total_mem) * 100) if total_mem > 0 else 0
        node_info_list.append({
            "component_type": "node",
            "name": node_name,
            "status": "Ready" if any(cond.type == "Ready" and cond.status == "True" for cond in node.status.conditions) else "NotReady",
            "role": role,
            "age": str(node.metadata.creation_timestamp),
            "version": node.status.node_info.kubelet_version,
            "internalIP": next((addr.address for addr in node.status.addresses if addr.type == "InternalIP"), None),
            "externalIP": next((addr.address for addr in node.status.addresses if addr.type == "ExternalIP"), None),
            "os": node.status.node_info.os_image,
            "architecture": node.status.node_info.architecture,
            "resources": {
                "cpu": {"used": f"{used_cpu/1000:.2f}", "total": f"{total_cpu/1000:.2f}", "percentage": str(cpu_percentage)},
                "memory": {"used": f"{used_mem}Mi", "total": f"{total_mem}Mi", "percentage": str(mem_percentage)},
                "storage": {"used": "0Mi", "total": f"{total_storage}Mi", "percentage": "0"}
            },
            "conditions": [
                {
                    "type": cond.type,
                    "status": cond.status,
                    "lastTransition": str(cond.last_transition_time),
                    "reason": cond.reason,
                    "message": cond.message
                } for cond in node.status.conditions
            ]
        })

    # Fetch all workloads regardless of service link.
    all_deployments = get_all_deployments(namespace, namespace_default_requests)
    all_statefulsets = get_all_statefulsets(namespace, namespace_default_requests)
    all_daemonsets = get_all_daemonsets(namespace, namespace_default_requests)

    # Build Ingress and Service hierarchy
    ingress_map = get_ingresses(namespace)
    service_map = get_services(
        namespace,
        namespace_default_requests,
        all_deployments,
        all_statefulsets,
        all_daemonsets,
    )
    link_services_to_ingresses(ingress_map, service_map)
    # Unlinked services remain at top level.
    unlinked_services = list(service_map.values())

    # Match unlinked deployments to services.
    remaining_deployments = []
    for dep in all_deployments:
        attached = False
        for svc in unlinked_services:
            if find_index_by_attribute(svc["statefulsets"],"deployment_name",dep["deployment_name"]) > -1:
                attached = True
                break
            svc_selector = svc.get("selector")
            if svc_selector and isinstance(svc_selector, dict) and dep.get("match_labels"):
                if is_subset(svc_selector, dep["match_labels"]):
                    dep_info = DeploymentInfo(
                        component_type=dep["component_type"],
                        deployment_name=dep["deployment_name"],
                        available_replicas=dep["available_replicas"],
                        expected_replicas=dep["expected_replicas"],
                        pods=[PodInfo(**pod) for pod in dep["pods"]]
                    )
                    svc["deployments"].append(dep_info)
                    attached = True
                    break
        if not attached:
            remaining_deployments.append(dep)

    # Similarly for statefulsets.
    remaining_statefulsets = []
    for ss in all_statefulsets:
        attached = False
        for svc in unlinked_services:
            if find_index_by_attribute(svc["statefulsets"],"statefulset_name",ss["statefulset_name"]) > -1:
                attached = True
                break
            svc_selector = svc.get("selector")
            if svc_selector and isinstance(svc_selector, dict) and ss.get("match_labels"):
                if is_subset(svc_selector, ss["match_labels"]):
                    ss_info = StatefulSetInfo(
                        component_type=ss["component_type"],
                        statefulset_name=ss["statefulset_name"],
                        available_replicas=ss["available_replicas"],
                        expected_replicas=ss["expected_replicas"],
                        pods=[PodInfo(**pod) for pod in ss["pods"]]
                    )
                    svc["statefulsets"].append(ss_info)
                    attached = True
                    break
        if not attached:
            remaining_statefulsets.append(ss)

    # And for daemonsets.
    remaining_daemonsets = []
    for ds in all_daemonsets:
        attached = False
        for svc in unlinked_services:
            if find_index_by_attribute(svc["statefulsets"],"daemonset_name",ds["daemonset_name"]) > -1:
                attached = True
                break
            svc_selector = svc.get("selector")
            if svc_selector and isinstance(svc_selector, dict) and ds.get("match_labels"):
                if is_subset(svc_selector, ds["match_labels"]):
                    ds_info = DaemonSetInfo(
                        component_type=ds["component_type"],
                        daemonset_name=ds["daemonset_name"],
                        available_replicas=ds["available_replicas"],
                        expected_replicas=ds["expected_replicas"],
                        pods=[PodInfo(**pod) for pod in ds["pods"]]
                    )
                    svc["daemonsets"].append(ds_info)
                    attached = True
                    break
        if not attached:
            remaining_daemonsets.append(ds)

    hierarchy = {
        "ingresses": list(ingress_map.values()) if ingress_map else [],
        "services": unlinked_services if unlinked_services else [],
        "deployments": [DeploymentInfo(
                component_type=dep["component_type"],
                deployment_name=dep["deployment_name"],
                available_replicas=dep["available_replicas"],
                expected_replicas=dep["expected_replicas"],
                pods=[PodInfo(**pod) for pod in dep["pods"]]
            ) for dep in remaining_deployments] if remaining_deployments else [],
        "statefulsets": [StatefulSetInfo(
                component_type=ss["component_type"],
                statefulset_name=ss["statefulset_name"],
                available_replicas=ss["available_replicas"],
                expected_replicas=ss["expected_replicas"],
                pods=[PodInfo(**pod) for pod in ss["pods"]]
            ) for ss in remaining_statefulsets] if remaining_statefulsets else [],
        "daemonsets": [DaemonSetInfo(
                component_type=ds["component_type"],
                daemonset_name=ds["daemonset_name"],
                available_replicas=ds["available_replicas"],
                expected_replicas=ds["expected_replicas"],
                pods=[PodInfo(**pod) for pod in ds["pods"]]
            ) for ds in remaining_daemonsets] if remaining_daemonsets else [],
        "cronJobs":get_cronjobs_for_selector(namespace,"",namespace_default_requests),
        "jobs":get_jobs_for_selector(namespace,"",namespace_default_requests),
        "nodes": node_info_list
    }
    print(hierarchy,"findMe")
    return hierarchy

# =============================================================================
# FastAPI Endpoint
# =============================================================================

async def GET(request: Request, namespace: str) -> NamespaceInfo:
    try:
        config.load_kube_config()
    except Exception as e:
        raise Exception(f"Error loading kubeconfig: {e}")
    data = fetch_namespace_hierarchy(namespace)
    return data
