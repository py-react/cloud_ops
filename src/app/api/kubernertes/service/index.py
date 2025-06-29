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

def find_workloads_for_service(namespace: str, service: client.V1Service, apps_v1_api: client.AppsV1Api) -> List[Dict]:
    """Find all workloads (Deployments, StatefulSets, DaemonSets) that are selected by a service"""
    workloads = []
    if service.spec.selector:
        # Build label selector string
        selector_parts = []
        for key, value in service.spec.selector.items():
            selector_parts.append(f"{key}={value}")
        selector_str = ",".join(selector_parts)
        
        try:
            # Get Deployments that match the service selector
            selected_deployments = apps_v1_api.list_namespaced_deployment(namespace, label_selector=selector_str)
            for deployment in selected_deployments.items:
                workload_info = {
                    "name": deployment.metadata.name,
                    "namespace": deployment.metadata.namespace,
                    "type": "Deployment",
                    "replicas": deployment.spec.replicas or 0,
                    "available_replicas": deployment.status.available_replicas or 0,
                    "ready_replicas": deployment.status.ready_replicas or 0,
                    "updated_replicas": deployment.status.updated_replicas or 0,
                    "labels": dict(deployment.metadata.labels) if deployment.metadata.labels else {},
                    "annotations": dict(deployment.metadata.annotations) if deployment.metadata.annotations else {},
                    "creation_timestamp": str(deployment.metadata.creation_timestamp) if deployment.metadata.creation_timestamp else None,
                    "strategy": {
                        "type": deployment.spec.strategy.type,
                        "rolling_update": {
                            "max_surge": deployment.spec.strategy.rolling_update.max_surge,
                            "max_unavailable": deployment.spec.strategy.rolling_update.max_unavailable
                        } if deployment.spec.strategy.rolling_update else None
                    },
                    "selector": dict(deployment.spec.selector.match_labels) if deployment.spec.selector and deployment.spec.selector.match_labels else {}
                }
                workloads.append(workload_info)
            
            # Get StatefulSets that match the service selector
            selected_statefulsets = apps_v1_api.list_namespaced_stateful_set(namespace, label_selector=selector_str)
            for statefulset in selected_statefulsets.items:
                workload_info = {
                    "name": statefulset.metadata.name,
                    "namespace": statefulset.metadata.namespace,
                    "type": "StatefulSet",
                    "replicas": statefulset.spec.replicas or 0,
                    "available_replicas": statefulset.status.available_replicas or 0,
                    "ready_replicas": statefulset.status.ready_replicas or 0,
                    "updated_replicas": statefulset.status.updated_replicas or 0,
                    "labels": dict(statefulset.metadata.labels) if statefulset.metadata.labels else {},
                    "annotations": dict(statefulset.metadata.annotations) if statefulset.metadata.annotations else {},
                    "creation_timestamp": str(statefulset.metadata.creation_timestamp) if statefulset.metadata.creation_timestamp else None,
                    "service_name": statefulset.spec.service_name,
                    "selector": dict(statefulset.spec.selector.match_labels) if statefulset.spec.selector and statefulset.spec.selector.match_labels else {}
                }
                workloads.append(workload_info)
            
            # Get DaemonSets that match the service selector
            selected_daemonsets = apps_v1_api.list_namespaced_daemon_set(namespace, label_selector=selector_str)
            for daemonset in selected_daemonsets.items:
                workload_info = {
                    "name": daemonset.metadata.name,
                    "namespace": daemonset.metadata.namespace,
                    "type": "DaemonSet",
                    "desired_number_scheduled": daemonset.status.desired_number_scheduled or 0,
                    "current_number_scheduled": daemonset.status.current_number_scheduled or 0,
                    "number_available": daemonset.status.number_available or 0,
                    "number_ready": daemonset.status.number_ready or 0,
                    "labels": dict(daemonset.metadata.labels) if daemonset.metadata.labels else {},
                    "annotations": dict(daemonset.metadata.annotations) if daemonset.metadata.annotations else {},
                    "creation_timestamp": str(daemonset.metadata.creation_timestamp) if daemonset.metadata.creation_timestamp else None,
                    "selector": dict(daemonset.spec.selector.match_labels) if daemonset.spec.selector and daemonset.spec.selector.match_labels else {}
                }
                workloads.append(workload_info)
                
        except Exception as e:
            print(f"Error finding workloads for service {service.metadata.name}: {e}")
    
    return workloads

async def GET(request: Request, namespace: str, service_name: Optional[str] = None):
    """Get detailed information for all services or a specific service in a namespace, with bubbled-up events."""
    try:
        config.load_config()
        api_core = client.CoreV1Api()
        apps_v1_api = client.AppsV1Api()
        
        if service_name:
            try:
                service = api_core.read_namespaced_service(service_name, namespace)
                service_info = {
                    "name": service.metadata.name,
                    "namespace": service.metadata.namespace,
                    "type": service.spec.type,
                    "cluster_ip": service.spec.cluster_ip,
                    "external_ips": service.spec.external_i_ps if service.spec.external_i_ps else [],
                    "load_balancer_ip": service.spec.load_balancer_ip,
                    "session_affinity": service.spec.session_affinity,
                    "ports": [
                        {
                            "name": port.name,
                            "protocol": port.protocol,
                            "port": port.port,
                            "target_port": port.target_port,
                            "node_port": port.node_port
                        } for port in service.spec.ports
                    ] if service.spec.ports else [],
                    "selector": dict(service.spec.selector) if service.spec.selector else {},
                    "labels": dict(service.metadata.labels) if service.metadata.labels else {},
                    "annotations": dict(service.metadata.annotations) if service.metadata.annotations else {},
                    "creation_timestamp": str(service.metadata.creation_timestamp) if service.metadata.creation_timestamp else None,
                    "events": get_events_for_object(namespace, api_core, "Service", service.metadata.name),
                    "target_workloads": find_workloads_for_service(namespace, service, apps_v1_api)
                }
                return JSONResponse(content={
                    "namespace": namespace,
                    "service": service_info
                })
            except ApiException as e:
                if e.status == 404:
                    return JSONResponse(status_code=404, content={"error": f"Service '{service_name}' not found in namespace '{namespace}'"})
                return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            services = api_core.list_namespaced_service(namespace)
            service_infos = []
            all_events = []
            
            for service in services.items:
                service_info = {
                    "name": service.metadata.name,
                    "namespace": service.metadata.namespace,
                    "type": service.spec.type,
                    "cluster_ip": service.spec.cluster_ip,
                    "external_ips": service.spec.external_i_ps if service.spec.external_i_ps else [],
                    "load_balancer_ip": service.spec.load_balancer_ip,
                    "session_affinity": service.spec.session_affinity,
                    "ports": [
                        {
                            "name": port.name,
                            "protocol": port.protocol,
                            "port": port.port,
                            "target_port": port.target_port,
                            "node_port": port.node_port
                        } for port in service.spec.ports
                    ] if service.spec.ports else [],
                    "selector": dict(service.spec.selector) if service.spec.selector else {},
                    "labels": dict(service.metadata.labels) if service.metadata.labels else {},
                    "annotations": dict(service.metadata.annotations) if service.metadata.annotations else {},
                    "creation_timestamp": str(service.metadata.creation_timestamp) if service.metadata.creation_timestamp else None,
                    "events": get_events_for_object(namespace, api_core, "Service", service.metadata.name),
                    "target_workloads": find_workloads_for_service(namespace, service, apps_v1_api)
                }
                service_infos.append(service_info)
                all_events.extend(service_info["events"])
            
            return JSONResponse(content={
                "namespace": namespace,
                "services": service_infos,
                "events": all_events
            })
    except ApiException as e:
        return JSONResponse(status_code=500, content={"error": str(e)})