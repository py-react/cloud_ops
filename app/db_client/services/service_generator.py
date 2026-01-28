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

        if svc_type == "ExternalName":
            spec_kwargs["external_name"] = spec_data.get("externalName")

        # Map dynamic attributes
        dynamic_kwargs = self._map_dynamic_attrs(spec_data, client.V1ServiceSpec, exclude=[
            "ports", "selector", "type", "cluster_ip", "ip_family_policy", 
            "session_affinity", "publish_not_ready_addresses", "external_traffic_policy",
            "internal_traffic_policy", "load_balancer_ip", "load_balancer_class", 
            "allocate_load_balancer_node_ports", "health_check_node_port", "external_name"
        ])
        
        # Merge dynamic kwargs into spec_kwargs (dynamic takes precedence if not excluded, but we excluded manual ones)
        spec_kwargs.update(dynamic_kwargs)

        spec = client.V1ServiceSpec(**spec_kwargs)

        # 3. Object Construction
        service_obj = client.V1Service(
            api_version="v1",
            kind="Service",
            metadata=metadata,
            spec=spec
        )

        # 4. Serialization
        # 4. Serialization
        return client.ApiClient().sanitize_for_serialization(service_obj)

    def _to_snake_case(self, name: str) -> str:
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

    def _map_dynamic_attrs(self, data: Dict[str, Any], target_class: Any, exclude: List[str] = []) -> Dict[str, Any]:
        """
        Dynamically maps keys from data (often camelCase) to target_class snake_case arguments.
        Skips keys in exclude list.
        """
        mapped_args = {}
        
        if not hasattr(target_class, 'attribute_map'):
            return {}
            
        json_to_attr = {v: k for k, v in target_class.attribute_map.items()}
        
        for key, value in data.items():
            snake_key = self._to_snake_case(key)
            if key in exclude or snake_key in exclude:
                continue
                
            if key in json_to_attr:
                attr_name = json_to_attr[key]
                mapped_args[attr_name] = value
            elif snake_key in target_class.attribute_map:
                 mapped_args[snake_key] = value

        return mapped_args
