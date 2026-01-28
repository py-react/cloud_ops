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

        svc_type = spec_data.get("type", "ClusterIP")
        
        spec_kwargs = {
            "selector": spec_data.get("selector", {}),
            "ports": ports if ports else None,
            "type": svc_type,
            "cluster_ip": spec_data.get("clusterIP"),
            "ip_family_policy": spec_data.get("ipFamilyPolicy"),
            "session_affinity": spec_data.get("sessionAffinity"),
            "publish_not_ready_addresses": spec_data.get("publishNotReadyAddresses"),
        }

        # Type-specific field filtering to avoid Kubernetes validation errors
        
        # 1. External Traffic Policy (NodePort, LoadBalancer only)
        if svc_type in ["NodePort", "LoadBalancer"]:
            spec_kwargs["external_traffic_policy"] = spec_data.get("externalTrafficPolicy")
            # Internal Traffic Policy is generally fine for ClusterIP too, but let's be safe
            spec_kwargs["internal_traffic_policy"] = spec_data.get("internalTrafficPolicy")
        
        # 2. LoadBalancer specific fields
        if svc_type == "LoadBalancer":
            spec_kwargs["load_balancer_ip"] = spec_data.get("loadBalancerIP")
            spec_kwargs["load_balancer_class"] = spec_data.get("loadBalancerClass")
            spec_kwargs["allocate_load_balancer_node_ports"] = spec_data.get("allocateLoadBalancerNodePorts")
            
            # Health Check Node Port (LoadBalancer only, and usually with ExternalTrafficPolicy=Local)
            if spec_data.get("externalTrafficPolicy") == "Local":
                spec_kwargs["health_check_node_port"] = spec_data.get("healthCheckNodePort")
        
        # 3. ExternalName specific fields
        if svc_type == "ExternalName":
            spec_kwargs["external_name"] = spec_data.get("externalName")

        spec = client.V1ServiceSpec(**spec_kwargs)

        # 3. Object Construction
        service_obj = client.V1Service(
            api_version="v1",
            kind="Service",
            metadata=metadata,
            spec=spec
        )

        # 4. Serialization
        return client.ApiClient().sanitize_for_serialization(service_obj)
