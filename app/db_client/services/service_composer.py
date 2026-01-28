import json
from typing import Dict, Any, List, Union
from sqlmodel import Session
from ..models.kubernetes_profiles.service import K8sService
from ..models.kubernetes_profiles.service_metadata_profile import K8sServiceMetadataProfile
from ..models.kubernetes_profiles.service_selector_profile import K8sServiceSelectorProfile
from ..models.kubernetes_profiles.service_profile import K8sServiceProfile

class ServiceComposer:
    def __init__(self, session: Session):
        self.session = session

    def _parse_json(self, data: Any) -> Union[Dict[str, Any], List[Any]]:
        """Safely parse JSON data if it's a string, otherwise return as dict or list."""
        if isinstance(data, str):
            try:
                parsed = json.loads(data)
                return parsed if isinstance(parsed, (dict, list)) else {}
            except (json.JSONDecodeError, TypeError):
                return {}
        return data if isinstance(data, (dict, list)) else {}

    def compose(self, service: K8sService) -> Dict[str, Any]:
        """
        Assembles a full service specification from a K8sService definition.
        """
        result = {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": service.name,
                "namespace": service.namespace
            },
            "spec": {}
        }
        
        # 1. Metadata Profile Merging
        if service.metadata_profile_id:
            meta_profile = self.session.get(K8sServiceMetadataProfile, service.metadata_profile_id)
            if meta_profile and meta_profile.config:
                meta_config = self._parse_json(meta_profile.config)
                result["metadata"].update(meta_config)

        # 2. Selector Profile Merging
        if service.selector_profile_id:
            sel_profile = self.session.get(K8sServiceSelectorProfile, service.selector_profile_id)
            if sel_profile and sel_profile.selector:
                sel_config = self._parse_json(sel_profile.selector)
                result["spec"]["selector"] = sel_config

        # 3. Dynamic Attributes Merging (Ports, Type, etc.)
        if service.dynamic_attr:
            dynamic_attr = self._parse_json(service.dynamic_attr)
            for key, profile_id in dynamic_attr.items():
                profile = self.session.get(K8sServiceProfile, profile_id)
                if profile and profile.config:
                    profile_config = self._parse_json(profile.config)
                    
                    if key == "spec":
                        if isinstance(profile_config, dict):
                            result["spec"].update(profile_config)
                    else:
                        result["spec"][key] = profile_config

        # 4. Advanced Fields Mapping
        advanced_fields = [
            "type", "cluster_ip", "ip_family_policy", "session_affinity",
            "internal_traffic_policy", "external_traffic_policy",
            "publish_not_ready_addresses", "load_balancer_ip",
            "health_check_node_port", "allocate_load_balancer_node_ports",
            "load_balancer_class", "external_name"
        ]
        
        for field in advanced_fields:
            val = getattr(service, field, None)
            if val is not None:
                # Convert snake_case back to camelCase for the generator/spec
                parts = field.split('_')
                camel_key = parts[0] + ''.join(p.capitalize() for p in parts[1:])
                # Special cases for acronyms
                if camel_key == "clusterIp": camel_key = "clusterIP"
                if camel_key == "loadBalancerIp": camel_key = "loadBalancerIP"
                
                result["spec"][camel_key] = val

        return result
