from typing import Dict, Any, List
from kubernetes import client

class ServiceGenerator:
    def generate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates a Kubernetes Service YAML (dict) from the composed data.
        """
        name = data["metadata"]["name"]
        namespace = data["metadata"]["namespace"]
        
        # 1. Metadata
        metadata = client.V1ObjectMeta(
            name=name,
            namespace=namespace,
            labels=data["metadata"].get("labels", {}),
            annotations=data["metadata"].get("annotations", {})
        )

        # 2. Spec Construction
        spec_data = data.get("spec", {})
        
        ports = []
        if spec_data.get("ports"):
            for p in spec_data["ports"]:
                ports.append(client.V1ServicePort(
                    name=p.get("name"),
                    port=int(p.get("port")),
                    target_port=p.get("targetPort") or p.get("target_port"),
                    protocol=p.get("protocol", "TCP"),
                    node_port=p.get("nodePort")
                ))

        spec = client.V1ServiceSpec(
            selector=spec_data.get("selector", {}),
            ports=ports if ports else None,
            type=spec_data.get("type", "ClusterIP"),
            cluster_ip=spec_data.get("clusterIP"),
            load_balancer_ip=spec_data.get("loadBalancerIP"),
            external_name=spec_data.get("externalName")
        )

        # 3. Object Construction
        service_obj = client.V1Service(
            api_version="v1",
            kind="Service",
            metadata=metadata,
            spec=spec
        )

        # 4. Serialization
        return client.ApiClient().sanitize_for_serialization(service_obj)
