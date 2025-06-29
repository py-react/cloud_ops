from fastapi import Request
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional

def get_events_for_object(namespace: str, api_core: client.CoreV1Api, involved_object_kind: str, involved_object_name: str) -> List[Dict]:
    """Get events for a specific Kubernetes object"""
    events = []
    try:
        field_selector = f"involvedObject.kind={involved_object_kind},involvedObject.name={involved_object_name}"
        event_list = api_core.list_namespaced_event(namespace, field_selector=field_selector)
        
        for event in event_list.items:
            event_info = {
                "metadata": {
                    "name": event.metadata.name,
                    "namespace": event.metadata.namespace,
                    "uid": event.metadata.uid,
                    "resourceVersion": event.metadata.resource_version,
                    "creationTimestamp": str(event.metadata.creation_timestamp) if event.metadata.creation_timestamp else None,
                    "managedFields": [
                        {
                            "manager": field.manager,
                            "operation": field.operation,
                            "apiVersion": field.api_version,
                            "time": str(field.time) if field.time else None,
                            "fieldsType": field.fields_type,
                            "fieldsV1": field.fields_v1
                        } for field in event.metadata.managed_fields
                    ] if event.metadata.managed_fields else []
                },
                "involvedObject": {
                    "kind": event.involved_object.kind,
                    "namespace": event.involved_object.namespace,
                    "name": event.involved_object.name,
                    "uid": event.involved_object.uid,
                    "apiVersion": event.involved_object.api_version,
                    "resourceVersion": event.involved_object.resource_version
                },
                "reason": event.reason,
                "message": event.message,
                "source": {
                    "component": event.source.component,
                    "host": event.source.host
                } if event.source else {},
                "firstTimestamp": str(event.first_timestamp) if event.first_timestamp else None,
                "lastTimestamp": str(event.last_timestamp) if event.last_timestamp else None,
                "count": event.count,
                "type": event.type,
                "eventTime": str(event.event_time) if event.event_time else None,
                "reportingComponent": event.reporting_component,
                "reportingInstance": event.reporting_instance,
                "apiVersion": event.api_version,
                "kind": event.kind
            }
            events.append(event_info)
    except Exception as e:
        print(f"Error fetching events for {involved_object_kind} {involved_object_name}: {e}")
    
    return events

def find_pods_using_secret(namespace: str, secret_name: str, api_core: client.CoreV1Api) -> List[Dict]:
    """Find all pods that reference a specific secret"""
    pods = api_core.list_namespaced_pod(namespace)
    referencing_pods = []
    for pod in pods.items:
        referenced_as = set()
        # Check volumes
        if pod.spec.volumes:
            for volume in pod.spec.volumes:
                if volume.secret and volume.secret.secret_name == secret_name:
                    referenced_as.add("volume")
                    break
        # Check env in containers
        if pod.spec.containers:
            for container in pod.spec.containers:
                if container.env:
                    for env_var in container.env:
                        if env_var.value_from and env_var.value_from.secret_key_ref:
                            if env_var.value_from.secret_key_ref.name == secret_name:
                                referenced_as.add("env")
                                break
        if referenced_as:
            pod_info = {
                "pod_name": pod.metadata.name,
                "namespace": pod.metadata.namespace,
                "status": pod.status.phase,
                "node_name": pod.spec.node_name,
                "labels": dict(pod.metadata.labels) if pod.metadata.labels else {},
                "annotations": dict(pod.metadata.annotations) if pod.metadata.annotations else {},
                "container_names": [c.name for c in pod.spec.containers] if pod.spec.containers else [],
                "creation_timestamp": str(pod.metadata.creation_timestamp) if pod.metadata.creation_timestamp else None,
                "ip": pod.status.pod_ip,
                "host_ip": pod.status.host_ip,
                "service_account": pod.spec.service_account_name,
                "restart_policy": pod.spec.restart_policy,
                "referenced_as": list(referenced_as)
            }
            referencing_pods.append(pod_info)
    return referencing_pods

async def GET(request: Request, namespace: str, secret_name: Optional[str] = None):
    """Get detailed information for all secrets or a specific secret in a namespace, with bubbled-up events."""
    try:
        config.load_config()
        api_core = client.CoreV1Api()
        if secret_name:
            try:
                secret = api_core.read_namespaced_secret(secret_name, namespace)
                secret_info = {
                    "name": secret.metadata.name,
                    "namespace": secret.metadata.namespace,
                    "type": secret.type,
                    "labels": dict(secret.metadata.labels) if secret.metadata.labels else {},
                    "annotations": dict(secret.metadata.annotations) if secret.metadata.annotations else {},
                    "creation_timestamp": str(secret.metadata.creation_timestamp) if secret.metadata.creation_timestamp else None,
                    "data_keys": list(secret.data.keys()) if secret.data else [],
                    "events": get_events_for_object(namespace, api_core, "Secret", secret.metadata.name),
                    "referenced_by_pods": find_pods_using_secret(namespace, secret.metadata.name, api_core)
                }
                return JSONResponse(content={
                    "namespace": namespace,
                    "secret": secret_info
                })
            except ApiException as e:
                if e.status == 404:
                    return JSONResponse(status_code=404, content={"error": f"Secret '{secret_name}' not found in namespace '{namespace}'"})
                return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            secrets = api_core.list_namespaced_secret(namespace)
            secret_infos = []
            all_events = []
            for secret in secrets.items:
                secret_info = {
                    "name": secret.metadata.name,
                    "namespace": secret.metadata.namespace,
                    "type": secret.type,
                    "labels": dict(secret.metadata.labels) if secret.metadata.labels else {},
                    "annotations": dict(secret.metadata.annotations) if secret.metadata.annotations else {},
                    "creation_timestamp": str(secret.metadata.creation_timestamp) if secret.metadata.creation_timestamp else None,
                    "data_keys": list(secret.data.keys()) if secret.data else [],
                    "events": get_events_for_object(namespace, api_core, "Secret", secret.metadata.name),
                    "referenced_by_pods": find_pods_using_secret(namespace, secret.metadata.name, api_core)
                }
                secret_infos.append(secret_info)
                all_events.extend(secret_info["events"])
            return JSONResponse(content={
                "namespace": namespace,
                "secrets": secret_infos,
                "events": all_events
            })
    except ApiException as e:
        return JSONResponse(status_code=500, content={"error": str(e)})