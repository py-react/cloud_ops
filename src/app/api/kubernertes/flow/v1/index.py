from fastapi import Request
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from typing import List, Dict, Tuple
import json

# Custom JSON Encoder to handle non-standard types (e.g., sets)
class JsonEncoder(json.JSONEncoder):
    def default(self, obj):
        # Convert sets to lists so they can be serialized
        if isinstance(obj, set):
            return list(obj)
        # Otherwise, use the default serialization method
        return json.JSONEncoder.default(self, obj)

# Find the index of a dictionary in a list by matching a specified attribute and value.
def find_index_by_attribute(dict_list, attribute, value):
    for index, d in enumerate(dict_list):
        # Check if the dictionary contains the attribute with the desired value
        if d.get(attribute) == value:
            return index
    # Return -1 if no dictionary in the list matches the criteria
    return -1  

# Convert CPU resource string into millicpu units.
def parse_cpu_to_millicpu(cpu_str: str) -> int:
    """Convert CPU string (e.g., '250m' or '2') into millicpu (int)."""
    # If the string ends with 'm', it is already in millicpu
    if cpu_str.endswith("m"):
        return int(cpu_str.rstrip("m"))
    else:
        # Otherwise, convert the CPU value (in cores) to millicpu by multiplying by 1000
        return int(float(cpu_str) * 1000)

# Convert memory resource string into Mi (Mebibytes).
def parse_memory_to_Mi(mem_str: str) -> int:
    """Convert memory string (e.g., '2048000Ki', '512Mi', '2Gi') into Mi."""
    if mem_str.endswith("Ki"):
        # Convert from Ki to Mi (1 Mi = 1024 Ki)
        return int(int(mem_str.rstrip("Ki")) / 1024)
    elif mem_str.endswith("Mi"):
        # Memory is already in Mi, just remove the unit suffix
        return int(mem_str.rstrip("Mi"))
    elif mem_str.endswith("Gi"):
        # Convert from Gi to Mi (1 Gi = 1024 Mi)
        return int(mem_str.rstrip("Gi")) * 1024
    else:
        # If no recognized unit is provided, assume the value is already an integer
        return int(mem_str)

# Retrieve live node metrics (CPU and memory usage) from the Kubernetes Metrics API.
def get_node_metrics() -> Dict[str, Dict[str, int]]:
    """
    Retrieve live node metrics from the metrics API.
    Returns a dict keyed by node name with CPU (in millicpu) and memory (in Mi) usage.
    If the API is unavailable, returns an empty dict.
    """
    metrics = {}
    custom_api = client.CustomObjectsApi()
    try:
        # List custom objects for node metrics from the metrics API
        nodes_metric = custom_api.list_cluster_custom_object(
            group="metrics.k8s.io", version="v1beta1", plural="nodes"
        )
        # Iterate through each node's metrics data
        for item in nodes_metric.get("items", []):
            node_name = item["metadata"]["name"]
            cpu_str = item["usage"]["cpu"]
            mem_str = item["usage"]["memory"]
            # Convert CPU usage to millicpu
            if cpu_str.endswith("m"):
                cpu_usage = int(cpu_str.rstrip("m"))
            else:
                cpu_usage = int(float(cpu_str) * 1000)
            # Convert memory usage to Mi using helper function
            mem_usage = parse_memory_to_Mi(mem_str)
            metrics[node_name] = {"cpu": cpu_usage, "memory": mem_usage}
    except (ApiException, Exception) as e:
        # Print error message if fetching metrics fails
        print(e, "<========Error while fetching node metric")
        pass
    return metrics

# Get effective CPU and memory requests for a container, using container values or namespace defaults.
def get_effective_request(container, namespace_default_requests: Dict[str, str]) -> Tuple[str, str]:
    """
    Return the effective CPU and memory request for a container.
    Falls back to the LimitRange defaults if the container spec doesn't show a request.
    """
    # Access container's resource requests; if not set, an empty dict is used
    requests_dict = container.resources.requests or {}
    # Use container's request if available; otherwise, use namespace defaults or "0"
    cpu_req = requests_dict.get("cpu") or namespace_default_requests.get("cpu", "0")
    mem_req = requests_dict.get("memory") or namespace_default_requests.get("memory", "0")
    return cpu_req, mem_req

# Get effective CPU and memory limits for a container.
def get_effective_limit(container) -> Tuple[str, str]:
    """
    Return the effective CPU and memory limit for a container.
    Falls back to the default of "0" if no limit is specified.
    """
    # Access container's resource limits; if not set, an empty dict is used
    requests_dict = container.resources.limits or {}
    cpu_limit = requests_dict.get("cpu") or "0"
    mem_limit = requests_dict.get("memory") or "0"
    return cpu_limit, mem_limit

# Helper function to retrieve Ingress resources and structure them.
def get_ingresses(namespace: str, api) -> Dict:
    # List all Ingress resources in the given namespace
    ingresses = api.list_namespaced_ingress(namespace)
    ingress_map = {}
    for ingress in ingresses.items:
        # Initialize a dictionary to store ingress details
        ingress_info = {
            "component_type": "ingress",
            "ingress_name": ingress.metadata.name,
            # If rules exist, take the host from the first rule; otherwise, set to None
            "host": ingress.spec.rules[0].host if ingress.spec.rules else None,
            "paths": [],
            "services": []
        }

        # Loop through each rule and its paths to extract service details
        for rule in ingress.spec.rules:
            for path in rule.http.paths:
                service_name = path.backend.service.name
                # Append path and service details to the ingress info
                ingress_info["paths"].append({
                    "service_name": service_name,
                    "path": path.path,
                    "path_type": path.path_type
                })
                ingress_info["services"].append(service_name)

        # Map the ingress name to its details
        ingress_map[ingress.metadata.name] = ingress_info
    return ingress_map

# Helper function to retrieve Service resources and structure them.
def get_services(namespace: str, api) -> Dict:
    service_map = {}
    # List all Service resources in the namespace
    for svc in api.list_namespaced_service(namespace).items:
        ports = []
        # Loop through all ports defined for the service
        for p in svc.spec.ports:
            # Ensure target_port is an integer when possible
            target_port = int(p.target_port) if isinstance(p.target_port, (int, float)) else None
            ports.append({
                "port": p.port,
                "targetPort": target_port,
                "protocol": p.protocol
            })
        # Structure service details including type, IPs, ports, selectors, and more
        service_info = {
            "component_type": "service",
            "service_name": svc.metadata.name,
            "type": svc.spec.type,
            "clusterIP": svc.spec.cluster_ip,
            # If the load balancer ingress is present, use its IP; otherwise, mark as "N/A"
            "externalIP": svc.status.load_balancer.ingress[0].ip if svc.status.load_balancer.ingress else "N/A",
            "age": str(svc.metadata.creation_timestamp),
            "ports": ports,
            "selector": svc.spec.selector,  # Use the service's selector for matching pods/deployments
            "deployments": [],
            "ingresses": [],
            "node_names": set()  # Set to collect names of nodes where service endpoints are found
        }

        # Retrieve endpoints associated with the service
        endpoints = api.read_namespaced_endpoints(service_info["service_name"], namespace)
        # Extract node names from the endpoints information
        if endpoints.subsets:
            for subset in endpoints.subsets:
                if subset.addresses:
                    for address in subset.addresses:
                        if address.node_name:
                            service_info["node_names"].add(address.node_name)

        service_map[svc.metadata.name] = service_info
    return service_map

# Link Ingress resources to the corresponding Services by updating the service_map.
def link_services_to_ingresses(ingress_map: Dict, service_map: Dict):
    new_service_map = service_map
    for ingress_info in ingress_map.values():
        for service_name in ingress_info["services"]:
            if service_name in new_service_map:
                # Append ingress info to the service's list of ingresses
                new_service_map[service_name]["ingresses"].append(ingress_info)
    return new_service_map

# For each service in the service_map, find and attach matching deployments.
def get_deployments_for_service(namespace: str, service_map: Dict, deployment_map: Dict,
                                api_apps: client.AppsV1Api, api_core: client.CoreV1Api, namespace_default_requests) -> Dict:
    new_map = service_map
    for svc in new_map.values():
        if svc["selector"]:
            # Build a selector string from the service's selector dict
            selector_str = ",".join([f"{key}={value}" for key, value in svc["selector"].items()])
            # Retrieve deployments that match the selector and attach them to the service
            svc["deployments"] = get_deployments(namespace, api_apps, api_core, selector_str, deployment_map, namespace_default_requests)
    return new_map

# Retrieve deployments (including StatefulSets, DaemonSets, and ReplicaSets) based on a label selector.
def get_deployments(namespace: str, api_apps: client.AppsV1Api, api_core: client.CoreV1Api,
                    selector_str: str, deployment_map: Dict, namespace_default_requests):
    service_deployment = []

    # Handle StatefulSets (which may have similar characteristics as deployments)
    stateful_sets = api_apps.list_namespaced_stateful_set(namespace, label_selector=selector_str)
    for ss in stateful_sets.items:
        # Create a deployment-like structure for each stateful set
        deployment_selector_str = ",".join([f"{key}={value}" for key, value in ss.spec.selector.match_labels.items()])
        deployment_info = {
            "component_type": "deployment",
            "deployment_name": ss.metadata.name,
            "statefulsets": [],
            "pods": []  # Pods associated with the StatefulSet will be added here
        }

        available_replicas = ss.status.ready_replicas or 0
        expected_replicas = ss.spec.replicas or 0
        
        if expected_replicas > 0 and available_replicas is not None:
            stateful_set_info = {
                "name": ss.metadata.name,
                "replicas": expected_replicas,
                "available_replicas": available_replicas,
                "expected_replicas": expected_replicas,
                "pods": []
            }
            
            # List pods associated with the StatefulSet based on matching labels
            pod_label_selector = ",".join([f"{key}={value}" for key, value in ss.spec.selector.match_labels.items()])
            pods = api_core.list_namespaced_pod(namespace, label_selector=pod_label_selector)
            
            for pod in pods.items:
                # Initialize resource counters for each pod
                pod_cpu_limit = 0
                pod_mem_limit = 0
                pod_cpu_usage = 0
                pod_mem_usage = 0
                if pod.spec.containers:
                    # Sum up resource requests and limits from all containers in the pod
                    for container in pod.spec.containers:
                        cpu_req, mem_req = get_effective_request(container, namespace_default_requests)
                        cpu_limit, mem_limit = get_effective_limit(container)
                        pod_cpu_limit += parse_cpu_to_millicpu(cpu_limit)
                        pod_mem_limit += parse_memory_to_Mi(mem_limit)
                        pod_cpu_usage += parse_cpu_to_millicpu(cpu_req)
                        pod_mem_usage += parse_memory_to_Mi(mem_req)
                # Build the pod info structure
                pod_info = {
                    "component_type": "pod",
                    "name": pod.metadata.name,
                    "status": pod.status.phase,
                    "restarts": sum(container.restart_count for container in pod.status.container_statuses or []),
                    "age": str(pod.metadata.creation_timestamp),
                    "ip": pod.status.pod_ip or "N/A",
                    "node": pod.spec.node_name,
                    "resources": {
                        "cpu": {"used": f"{pod_cpu_usage / 1000:.2f}", "total": f"{pod_cpu_limit / 1000:.2f}", "percentage": 0},
                        "memory": {"used": f"{pod_mem_usage}Mi", "total": f"{pod_mem_limit}Mi", "percentage": 0},
                    },
                }

                # Append pod details to both stateful set and deployment structures
                stateful_set_info["pods"].append(pod_info)
                deployment_info["pods"].append(pod_info)

            deployment_info["statefulsets"].append(stateful_set_info)
        service_deployment.append(deployment_info)

    # Handle DaemonSets similarly to StatefulSets
    daemon_sets = api_apps.list_namespaced_daemon_set(namespace)
    for ds in daemon_sets.items:
        deployment_selector_str = ",".join([f"{key}={value}" for key, value in ds.spec.selector.match_labels.items()])
        deployment_info = {
            "component_type": "deployment",
            "deployment_name": ds.metadata.name,
            "daemonsets": [],
            "pods": []  # Pods will be added from the DaemonSet
        }

        available_replicas = ds.status.number_available or 0
        expected_replicas = ds.status.desired_number_scheduled or 0
        # If the label selectors do not match, skip this DaemonSet
        if selector_str != "ALL" and deployment_selector_str != selector_str:
            continue
        # Mark deployment as processed in the deployment map
        deployment_map[deployment_info["deployment_name"]] = True
        
        if expected_replicas > 0 and available_replicas is not None:
            daemon_set_info = {
                "name": ds.metadata.name,
                "replicas": expected_replicas,
                "available_replicas": available_replicas,
                "expected_replicas": expected_replicas,
                "pods": []
            }

            # List pods associated with the DaemonSet using matching labels
            pod_label_selector = ",".join([f"{key}={value}" for key, value in ds.spec.selector.match_labels.items()])
            pods = api_core.list_namespaced_pod(namespace, label_selector=pod_label_selector)

            for pod in pods.items:
                pod_cpu_limit = 0
                pod_mem_limit = 0
                pod_cpu_usage = 0
                pod_mem_usage = 0
                if pod.spec.containers:
                    for container in pod.spec.containers:
                        cpu_req, mem_req = get_effective_request(container, namespace_default_requests)
                        cpu_limit, mem_limit = get_effective_limit(container)
                        pod_cpu_limit += parse_cpu_to_millicpu(cpu_limit)
                        pod_mem_limit += parse_memory_to_Mi(mem_limit)
                        pod_cpu_usage += parse_cpu_to_millicpu(cpu_req)
                        pod_mem_usage += parse_memory_to_Mi(mem_req)
                pod_info = {
                    "component_type": "pod",
                    "name": pod.metadata.name,
                    "status": pod.status.phase,
                    "restarts": sum(container.restart_count for container in pod.status.container_statuses or []),
                    "age": str(pod.metadata.creation_timestamp),
                    "ip": pod.status.pod_ip or "N/A",
                    "node": pod.spec.node_name,
                    "resources": {
                        "cpu": {"used": f"{pod_cpu_usage / 1000:.2f}", "total": f"{pod_cpu_limit / 1000:.2f}", "percentage": 0},
                        "memory": {"used": f"{pod_mem_usage}Mi", "total": f"{pod_mem_limit}Mi", "percentage": 0},
                    },
                }

                daemon_set_info["pods"].append(pod_info)
                deployment_info["pods"].append(pod_info)

            deployment_info["daemonsets"].append(daemon_set_info)
        service_deployment.append(deployment_info)

    # Handle standard Deployments and their ReplicaSets
    deployments = api_apps.list_namespaced_deployment(namespace)
    for deployment in deployments.items:
        # Build a selector string from the Deployment's match labels
        deployment_selector_str = ",".join([f"{key}={value}" for key, value in deployment.spec.selector.match_labels.items()])
        deployment_info = {
            "component_type": "deployment",
            "deployment_name": deployment.metadata.name,
            "replicasets": [],
            "pods": []  # Pods will be added from each ReplicaSet
        }

        # Skip if the selector does not match (unless selector_str is set to "ALL")
        if selector_str != "ALL" and deployment_selector_str != selector_str:
            continue
        deployment_map[deployment_info["deployment_name"]] = True

        # Retrieve ReplicaSets associated with the Deployment
        replica_sets = api_apps.list_namespaced_replica_set(namespace, label_selector=deployment_selector_str)
        for rs in replica_sets.items:
            expected_replicas = rs.spec.replicas or 0
            available_replicas = rs.status.available_replicas or 0
            
            if rs.spec.replicas > 0 and available_replicas is not None:
                replica_set_info = {
                    "name": rs.metadata.name,
                    "replicas": rs.spec.replicas,
                    "expected_replicas": expected_replicas,
                    "available_replicas": available_replicas,
                    "pods": []
                }
                
                # List pods for each ReplicaSet using matching labels
                pod_label_selector = ",".join([f"{key}={value}" for key, value in rs.spec.selector.match_labels.items()])
                pods = api_core.list_namespaced_pod(namespace, label_selector=pod_label_selector)
                
                for pod in pods.items:
                    pod_cpu_limit = 0
                    pod_mem_limit = 0
                    pod_cpu_usage = 0
                    pod_mem_usage = 0
                    if pod.spec.containers:
                        for container in pod.spec.containers:
                            cpu_req, mem_req = get_effective_request(container, namespace_default_requests)
                            cpu_limit, mem_limit = get_effective_limit(container)
                            pod_cpu_limit += parse_cpu_to_millicpu(cpu_limit)
                            pod_mem_limit += parse_memory_to_Mi(mem_limit)
                            pod_cpu_usage += parse_cpu_to_millicpu(cpu_req)
                            pod_mem_usage += parse_memory_to_Mi(mem_req)

                    pod_info = {
                        "component_type": "pod",
                        "name": pod.metadata.name,
                        "status": pod.status.phase,
                        "restarts": sum(container.restart_count for container in pod.status.container_statuses or []),
                        "age": str(pod.metadata.creation_timestamp),
                        "ip": pod.status.pod_ip or "N/A",
                        "node": pod.spec.node_name,
                        "resources": {
                            "cpu": {"used": f"{pod_cpu_usage/1000:.2f}", "total": f"{pod_cpu_limit/1000:.2f}", "percentage": 0},
                            "memory": {"used": f"{pod_mem_usage}Mi", "total": f"{pod_mem_limit}Mi", "percentage": 0},
                        },
                    }

                    replica_set_info["pods"].append(pod_info)
                    deployment_info["pods"].append(pod_info)

                deployment_info["replicasets"].append(replica_set_info)

        service_deployment.append(deployment_info)
    return service_deployment

# Retrieve services that are not linked to any ingress but still have deployments.
def get_unlinked_services(namespace: str, service_map: Dict, deployment_map: Dict,
                            api_apps: client.AppsV1Api, api_core: client.CoreV1Api, namespace_default_requests) -> List[Dict]:
    unlinked_services = []
    
    all_svc = get_services(namespace, api_core)

    for svc in all_svc.values():
        # Check if service is in the main service_map, has no ingresses linked, and has no deployments yet
        if svc["service_name"] in service_map and "ingresses" not in service_map[svc["service_name"]] and not len(service_map[svc["service_name"]]["deployments"]) and svc["selector"]:
            selector_str = ",".join([f"{key}={value}" for key, value in svc["selector"].items()])
            service_structure = {
                "service_name": svc["service_name"],
                "deployments": get_deployments(namespace, api_apps, api_core, selector_str, deployment_map, namespace_default_requests)
            }
            # Append the unlinked service structure to the list
            unlinked_services.append(service_structure)

    return unlinked_services

# Retrieve deployments that are not linked to any service.
def get_unlinked_deployments(namespace: str, api_apps: client.AppsV1Api,
                             api_core: client.CoreV1Api, namespace_default_requests) -> List[Dict]:
    deployment_map = {}
    # Use "ALL" selector to fetch all deployments regardless of service linkage
    return get_deployments(namespace, api_apps, api_core, "ALL", deployment_map, namespace_default_requests)

# (Duplicate function removed: Note that get_node_metrics was defined earlier)

# Fetch a complete hierarchy of Kubernetes resources (nodes, ingresses, services, deployments, pods, etc.)
def fetch_namespace_hierarchy(namespace: str) -> Dict:
    apps_v1_api = client.AppsV1Api()
    core_v1_api = client.CoreV1Api()
    networking_v1_api = client.NetworkingV1Api()

    try:
        # Fetch default resource requests from LimitRanges in the namespace
        namespace_default_requests: Dict[str, str] = {}
        try:
            limit_ranges = core_v1_api.list_namespaced_limit_range(namespace).items
            for lr in limit_ranges:
                if lr.spec.limits:
                    for limit in lr.spec.limits:
                        if limit.type == "Container":
                            default_req = getattr(limit, "default_request", None)
                            if default_req:
                                namespace_default_requests.update(default_req)
        except Exception:
            pass

        # Retrieve live node metrics if available
        node_metrics = get_node_metrics()
        # Fetch node details from the cluster
        nodes = core_v1_api.list_node().items
        node_info_list = []
        total_cpu = total_memory = total_storage = 0
        used_cpu = used_memory = used_storage = 0

        for node in nodes:
            # Retrieve capacity values for CPU, memory, and ephemeral storage
            cpu_total = node.status.capacity.get("cpu", "0")
            memory_total = node.status.capacity.get("memory", "0")
            storage_total = node.status.capacity.get("ephemeral-storage", "0")
            total_cpu = parse_cpu_to_millicpu(cpu_total)
            total_mem = parse_memory_to_Mi(memory_total)
            total_storage = (int(int(storage_total.rstrip("Ki")) / 1024)
                             if storage_total.endswith("Ki") else 0)

            # Determine node role based on labels (e.g., master or worker)
            role = "master" if "node-role.kubernetes.io/master" in node.metadata.labels else "worker"
            node_name = node.metadata.name

            # Use live metrics if available; otherwise, usage remains zero.
            used_cpu = node_metrics.get(node_name, {}).get("cpu", 0)
            used_mem = node_metrics.get(node_name, {}).get("memory", 0)
            cpu_percentage = round((used_cpu / total_cpu) * 100) if total_cpu > 0 else 0
            mem_percentage = round((used_mem / total_mem) * 100) if total_mem > 0 else 0

            node_info = {
                "component_type": "node",
                "name": node_name,
                "status": "Ready" if any(
                    condition.type == "Ready" and condition.status == "True"
                    for condition in node.status.conditions
                ) else "NotReady",
                "role": role,
                "age": str(node.metadata.creation_timestamp),
                "version": node.status.node_info.kubelet_version,
                "internalIP": next((addr.address for addr in node.status.addresses if addr.type == "InternalIP"), "N/A"),
                "externalIP": next((addr.address for addr in node.status.addresses if addr.type == "ExternalIP"), "N/A"),
                "os": node.status.node_info.os_image,
                "architecture": node.status.node_info.architecture,
                "resources": {
                    "cpu": {
                        "used": f"{used_cpu / 1000:.2f}",
                        "total": f"{total_cpu / 1000:.2f}" if total_cpu else "0",
                        "percentage": cpu_percentage
                    },
                    "memory": {
                        "used": f"{used_mem}Mi",
                        "total": f"{total_mem}Mi",
                        "percentage": mem_percentage
                    },
                    "storage": {
                        "used": "0Mi",  # Storage usage not computed in this example
                        "total": f"{total_storage}Mi",
                        "percentage": 0
                    }
                },
                # Build a list of node conditions (status details)
                "conditions": [
                    {
                        "type": condition.type,
                        "status": condition.status,
                        "lastTransition": str(condition.last_transition_time),
                        "reason": condition.reason,
                        "message": condition.message
                    } for condition in node.status.conditions
                ],
            }
            node_info_list.append(node_info)

        # Retrieve Ingress, Service, and Deployment resources from the namespace
        ingress_map = get_ingresses(namespace, networking_v1_api)
        service_map = get_services(namespace, core_v1_api)
        deployment_map = {}
        # Get deployments for each service based on selectors
        service_map = get_deployments_for_service(namespace, service_map, deployment_map, apps_v1_api, core_v1_api, namespace_default_requests)
        # Link Ingress resources to their corresponding Services
        service_map = link_services_to_ingresses(ingress_map, service_map)
        # Retrieve services that are not linked to any ingress
        unlinked_services = get_unlinked_services(namespace, service_map, deployment_map, apps_v1_api, core_v1_api, namespace_default_requests)
        # Retrieve deployments that are not linked to any service
        unlinked_deployments = get_unlinked_deployments(namespace, apps_v1_api, core_v1_api, namespace_default_requests)
        
        # Construct the final namespace information structure with nodes
        namespace_info = {
            "nodes": node_info_list,
        }

        # Attach linked ingresses (with their services and deployments) to the respective nodes
        for ingress_info in ingress_map.values():
            print("in loop")
            ingress_structure = {
                "ingress_name": ingress_info["ingress_name"],
                "host": ingress_info["host"],
                "paths": ingress_info["paths"],
                "component_type": ingress_info["component_type"],
                "services": []
            }
            running_in_nodes = set()
            for service_name in ingress_info["services"]:
                service_info = service_map.get(service_name, None)
                if service_info:
                    ingress_structure["services"].append(service_info)
                    # Remove the service from service_map once it is linked
                    del service_map[service_name]
                    # Record the index of the node where the service is running
                    for i, node in enumerate(namespace_info["nodes"]):
                        if node["name"] in service_info["node_names"]:
                            running_in_nodes.add(i)

            if len(running_in_nodes):
                for nodeIndex in running_in_nodes:
                    if "ingresses" not in namespace_info["nodes"][nodeIndex]:
                        namespace_info["nodes"][nodeIndex]["ingresses"] = [ingress_structure]
                    else:
                        namespace_info["nodes"][nodeIndex]["ingresses"].append(ingress_structure)
            else:
                # If no node matches, attach ingress at the top level of the namespace info
                if "ingresses" not in namespace_info:
                    namespace_info["ingresses"] = [ingress_structure]
                else:
                    namespace_info["ingresses"].append(ingress_structure)

        # Process unlinked services and attach them appropriately to nodes or namespace
        for service in unlinked_services:
            running_in_nodes = []
            for node_name in service_info["node_names"]:
                nodeIndex = find_index_by_attribute(namespace_info["nodes"], "name", node_name)
                running_in_nodes.add({"service_name": service["service_name"], "node_name": node_name})
            
            if len(running_in_nodes):
                new_service_map_on_node = {}
                for i, deployment in enumerate(service["deployments"]):
                    for j, pod in enumerate(deployment["pods"]):
                        for map_data in running_in_nodes:
                            node_name = map_data["node_name"]
                            node_index = find_index_by_attribute(namespace_info["nodes"], "name", node_name)
                            # Clone service_info to avoid modifying the original
                            modified_service = json.loads(json.dumps(service, cls=JsonEncoder))
                            # Remove pods that do not match the node name
                            if pod["node"] != namespace_info["nodes"][node_index]["name"]:
                                del modified_service["deployments"][i]["pods"][j]

                            # Handle daemonsets if they exist in the deployment
                            if "daemonsets" in deployment:
                                daemonset_index = find_index_by_attribute(deployment["daemonsets"], "name", deployment["deployment_name"])
                                if daemonset_index != -1:
                                    daemonset = deployment["daemonsets"][daemonset_index]
                                    for l, daemon_pod in enumerate(daemonset["pods"]):
                                        if daemon_pod["node"] != namespace_info["nodes"][node_index]["name"]:
                                            del modified_service["deployments"][i]["daemonsets"][daemonset_index]["pods"][l]
                            new_service_map_on_node[node_index] = modified_service

                for map_data in running_in_nodes:
                    node_index = find_index_by_attribute(namespace_info["nodes"], "name", map_data["node_name"])
                    if "services" not in namespace_info["nodes"][node_index]:
                        namespace_info["nodes"][node_index]["services"] = [new_service_map_on_node[node_index]]  # Adding as deployment-like structure
                    else:
                        namespace_info["nodes"][node_index]["services"].append(new_service_map_on_node[node_index])
            else:
                if "services" not in namespace_info:
                    namespace_info["services"] = [service]
                else:
                    namespace_info["services"].append(service)
        
        # Attach unlinked deployments at the top level of namespace info if they are not already linked
        for deployment_info in unlinked_deployments:
            if deployment_info["deployment_name"] not in deployment_map:
                if "deployments" not in namespace_info:
                    namespace_info["deployments"] = [deployment_info]
                else:
                    namespace_info["deployments"].append(deployment_info)

        # Process remaining services in the service_map and attach them to nodes appropriately
        for service_info in service_map.values():
            running_in_nodes = []
            for node_name in service_info["node_names"]:
                node_index = find_index_by_attribute(namespace_info["nodes"], "name", node_name)
                running_in_nodes.append({"service_name": service_info["service_name"], "node_name": node_name})
            
            if len(running_in_nodes):
                new_service_map_on_node = {}
                for deployment_index, deployment in enumerate(service_info["deployments"]):
                    # Handle daemonsets for each deployment
                    for map_data in running_in_nodes:
                        node_name = map_data["node_name"]
                        node_index = find_index_by_attribute(namespace_info["nodes"], "name", node_name)
                        modified_service = json.loads(json.dumps(service_info, cls=JsonEncoder))
                        if "daemonsets" in deployment:
                            daemonset_index = find_index_by_attribute(deployment["daemonsets"], "name", deployment["deployment_name"])
                            if daemonset_index != -1:
                                daemonset = deployment["daemonsets"][daemonset_index]
                                for daemon_pod_index, daemon_pod in enumerate(daemonset["pods"]):
                                    if daemon_pod["node"] != namespace_info["nodes"][node_index]["name"]:
                                        del modified_service["deployments"][deployment_index]["daemonsets"][daemonset_index]["pods"][daemon_pod_index]
                        # Remove pods not matching the current node from the deployment pods list
                        for deployment_pod_index, pod in enumerate(deployment["pods"]):
                            pod_node_name = pod["node"]
                            if pod_node_name != namespace_info["nodes"][node_index]["name"]:
                                del modified_service["deployments"][deployment_index]["pods"][deployment_pod_index]

                        new_service_map_on_node[node_index] = modified_service

                for map_data in running_in_nodes:
                    node_index = find_index_by_attribute(namespace_info["nodes"], "name", map_data["node_name"])
                    if "services" not in namespace_info["nodes"][node_index]:
                        namespace_info["nodes"][node_index]["services"] = [new_service_map_on_node[node_index]]  
                    else:
                        namespace_info["nodes"][node_index]["services"].append(new_service_map_on_node[node_index])
            else:
                if "services" not in namespace_info:
                    namespace_info["services"] = [service_info]
                else:
                    namespace_info["services"].append(service_info)

        return namespace_info

    except ApiException as e:
        raise Exception(f"Error fetching resources: {e}")

# FastAPI asynchronous handler to retrieve namespace hierarchy.
async def GET(request: Request, namespace: str):
    # Load Kubernetes configuration (assumes kubeconfig is set up locally)
    try:
        config.load_kube_config()
    except Exception as e:
        raise Exception(f"Error loading kubeconfig: {e}")
    # Fetch the hierarchical structure of the namespace
    items = fetch_namespace_hierarchy(namespace)
    return {"items": items}
