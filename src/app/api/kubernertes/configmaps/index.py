from fastapi import Request
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from typing import List, Dict
from fastapi.responses import JSONResponse


def get_events_for_object(namespace: str, api_core: client.CoreV1Api, involved_object_kind: str, involved_object_name: str) -> List[Dict]:
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

def find_pods_using_configmap(namespace: str, configmap_name: str, api_core: client.CoreV1Api) -> List[Dict]:
    pods = api_core.list_namespaced_pod(namespace)
    referencing_pods = []
    for pod in pods.items:
        referenced_as = set()
        # Check volumes
        if pod.spec.volumes:
            for volume in pod.spec.volumes:
                if volume.config_map and volume.config_map.name == configmap_name:
                    referenced_as.add("volume")
                    break
        # Check env in containers
        if pod.spec.containers:
            for container in pod.spec.containers:
                if container.env:
                    for env_var in container.env:
                        if env_var.value_from and env_var.value_from.config_map_key_ref:
                            if env_var.value_from.config_map_key_ref.name == configmap_name:
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

async def GET(namespace: str, configmap_name: str):
    """Get details for a specific configmap in a namespace."""
    if not namespace or not configmap_name:
        return JSONResponse(status_code=400, content={"error": "Namespace and configmap_name are required"})
        
    try:
        from app.services.kube_config_service import KubeConfigService
        KubeConfigService.load_active_config()
        
        api_core = client.CoreV1Api()
        cm = api_core.read_namespaced_config_map(configmap_name, namespace)
        cm_info = {
            "name": cm.metadata.name,
            "namespace": cm.metadata.namespace,
            "labels": dict(cm.metadata.labels) if cm.metadata.labels else {},
            "annotations": dict(cm.metadata.annotations) if cm.metadata.annotations else {},
            "creation_timestamp": str(cm.metadata.creation_timestamp) if cm.metadata.creation_timestamp else None,
            "data_keys": list(cm.data.keys()) if cm.data else [],
            "data": dict(cm.data) if cm.data else {},
            "events": get_events_for_object(namespace, api_core, "ConfigMap", cm.metadata.name),
            "referenced_by_pods": find_pods_using_configmap(namespace, cm.metadata.name, api_core)
        }
        return JSONResponse(content={
            "namespace": namespace,
            "configmap": cm_info
        })
    except ValueError:
        raise
    except ApiException as e:
        if e.status == 404:
            return JSONResponse(status_code=404, content={"error": f"ConfigMap '{configmap_name}' not found in namespace '{namespace}'"})
        return JSONResponse(status_code=500, content={"error": str(e)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
