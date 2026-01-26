import json
from typing import Any, Dict, List

def safe_parse_json(data: Any, default_type: type = dict) -> Any:
    """
    Safely parse JSON data if it's a string, otherwise return as the expected type.
    Ensures that JSONB fields are consistent regardless of DB driver behavior.
    """
    if data is None:
        return default_type()
    
    if isinstance(data, str):
        try:
            parsed = json.loads(data)
            if isinstance(parsed, default_type):
                return parsed
            return default_type()
        except (json.JSONDecodeError, TypeError):
            return default_type()
            
    if isinstance(data, default_type):
        return data
        
    return default_type()

def clean_container_profile(profile_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures container profile fields are correctly typed."""
    profile_dict["command"] = safe_parse_json(profile_dict.get("command"), list)
    profile_dict["args"] = safe_parse_json(profile_dict.get("args"), list)
    profile_dict["dynamic_attr"] = safe_parse_json(profile_dict.get("dynamic_attr"), dict)
    return profile_dict

def clean_pod_profile(pod_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures pod profile fields are correctly typed."""
    pod_dict["containers"] = safe_parse_json(pod_dict.get("containers"), list)
    pod_dict["dynamic_attr"] = safe_parse_json(pod_dict.get("dynamic_attr"), dict)
    return pod_dict

def clean_deployment_profile(deployment_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures deployment profile fields are correctly typed."""
    deployment_dict["dynamic_attr"] = safe_parse_json(deployment_dict.get("dynamic_attr"), dict)
    return deployment_dict

def clean_generic_profile(profile_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures generic entity profile config is correctly typed."""
    profile_dict["config"] = safe_parse_json(profile_dict.get("config"), dict)
    return profile_dict
