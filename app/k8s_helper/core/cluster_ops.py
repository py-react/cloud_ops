from kubernetes import client
from ..models.resources import ClusterInfo,ClusterMetric
from kubernetes.client.rest import ApiException
import json
import ast

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
    
def parse_fs_usage(fs_stats):
    try:
        used_bytes = int(fs_stats["usedBytes"])
        capacity_bytes = int(fs_stats["capacityBytes"])

        if capacity_bytes == 0:
            return {"error": "Capacity is zero, cannot calculate percentage"}

        used_mib = used_bytes // (1024 * 1024)
        total_mib = capacity_bytes // (1024 * 1024)
        percentage = int((used_bytes / capacity_bytes) * 100)

        return {
            "used": f"{used_mib}Mi",
            "total": f"{total_mib}Mi",
            "percentage": str(percentage)
        }

    except (KeyError, ValueError, TypeError) as e:
        return {"error": f"Invalid data format: {e}"}


class ClusterOperations:
    """Class containing cluster-related operations"""
    
    def __init__(self, api_client: client.ApiClient, core_api: client.CoreV1Api, custom_objects_api:client.CustomObjectsApi, resource_helper):
        self.api_client = api_client
        self.core_api = core_api
        self.resource_helper = resource_helper
        self.custom_objects_api = custom_objects_api

    def get_cluster_metrics(self)->ClusterMetric:
        metrics = {}
        custom_api = self.custom_objects_api
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

        nodes = self.core_api.list_node().items
        node_info_list = []
        total_cpu = 0
        used_cpu = 0
        total_mem = 0
        used_mem = 0
        total_disk = 0
        used_disk = 0


        for node in nodes:
            node_name = node.metadata.name
            response = self.core_api.connect_get_node_proxy_with_path(
                name=node_name,
                path="stats/summary"
            )
            stats = ast.literal_eval(response)

            cpu_total = node.status.capacity.get("cpu", "0")
            memory_total = node.status.capacity.get("memory", "0")
            disk_capacity = stats["node"]["fs"]["capacityBytes"]
            disk_used = stats["node"]["fs"]["usedBytes"]

            # Accumulate totals
            total_cpu += parse_cpu_to_millicpu(cpu_total)
            total_mem += parse_memory_to_Mi(memory_total)
            total_disk += disk_capacity // (1024 * 1024)
            used_disk += disk_used // (1024 * 1024)

            used_cpu += metrics.get(node_name, {}).get("cpu", 0)
            used_mem += metrics.get(node_name, {}).get("memory", 0)

        cpu_percentage = round((used_cpu / total_cpu) * 100) if total_cpu > 0 else 0
        mem_percentage = round((used_mem / total_mem) * 100) if total_mem > 0 else 0
        disk_percentage = round((used_disk / total_disk) * 100) if total_disk > 0 else 0

        return {
            "usage": {
                "cpu": {
                    "used": f"{used_cpu / 1000:.2f}",
                    "total": f"{total_cpu / 1000:.2f}",
                    "percentage": str(cpu_percentage),
                },
                "memory": {
                    "used": f"{used_mem}Mi",
                    "total": f"{total_mem}Mi",
                    "percentage": str(mem_percentage),
                },
                "disk": {
                    "used": f"{used_disk}Mi",
                    "total": f"{total_disk}Mi",
                    "percentage": str(disk_percentage),
                },
            }
        }



    def get_cluster_info(self) -> ClusterInfo:
        """
        Get comprehensive information about the cluster
        
        Returns:
            ClusterInfo object containing cluster details
        """
        try:
            # Get version info
            version = self.api_client.call_api(
                '/version',
                'GET',
                response_type=object
            )[0]
            
            # Get nodes
            nodes = self.core_api.list_node()
            
            # Get all namespaces
            namespaces = self.resource_helper.get_namespaces()
            
            # Get all pods across all namespaces
            pods = self.resource_helper.get_resource_details('pods')

            running_pods = sum(1 for pod in pods if pod.get("status",{}).get("phase") in ["Running","Succeeded"])
            total_pods = len(pods)
            
            
            # Create ClusterInfo object
            return ClusterInfo(
                name=self._get_cluster_name(),
                platform=version.get('platform', 'Unknown'),
                version=version.get('gitVersion', 'Unknown'),
                nodes_count=len(nodes.items),
                pods_count=total_pods,
                running_pods=running_pods,
                namespaces_count=len(namespaces)
            )
            
        except Exception as e:
            raise Exception(f"Error fetching cluster info: {str(e)}")

    def _get_cluster_name(self) -> str:
        """
        Get the cluster name from cluster info
        
        Returns:
            Cluster name or 'Unknown'
        """
        try:
            cluster_info = self.api_client.call_api(
                '/api/v1/namespaces/kube-system/configmaps/cluster-info',
                'GET',
                response_type=object
            )[0]
            return cluster_info.get('data', {}).get('cluster-name', 'Unknown')
        except:
            return 'Unknown' 