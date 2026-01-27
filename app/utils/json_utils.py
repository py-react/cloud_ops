import json
from typing import Any, Dict, List

def safe_parse_json(data: Any, default_type: Any = dict) -> Any:
    """
    Safely parse JSON data if it's a string, otherwise return as the expected type.
    Ensures that JSONB fields are consistent regardless of DB driver behavior.
    """
    if data is None:
        return default_type() if callable(default_type) else (data if data is not None else {})

    if isinstance(data, str):
        try:
            parsed = json.loads(data)
            if isinstance(parsed, default_type):
                return parsed
            # If default_type is a tuple (e.g. (dict, list)), and parsed matches one, return it
            if isinstance(default_type, tuple) and any(isinstance(parsed, t) for t in default_type):
                return parsed
            return default_type() if callable(default_type) else {}
        except (json.JSONDecodeError, TypeError):
            return default_type() if callable(default_type) else {}

    if isinstance(data, default_type):
        return data

    # Handle the tuple case for non-string data
    if isinstance(default_type, tuple) and any(isinstance(data, t) for t in default_type):
        return data

    return default_type() if callable(default_type) else {}

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

def clean_service(service_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures service fields (dynamic_attr) are correctly typed."""
    service_dict["dynamic_attr"] = safe_parse_json(service_dict.get("dynamic_attr"), dict)
    return service_dict

def clean_selector_profile(profile_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures selector profile config is correctly typed."""
    profile_dict["selector"] = safe_parse_json(profile_dict.get("selector"), dict)
    return profile_dict

def clean_generic_profile(profile_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures generic entity profile config is correctly typed."""
    profile_dict["config"] = safe_parse_json(profile_dict.get("config"), (dict, list))
    return profile_dict
