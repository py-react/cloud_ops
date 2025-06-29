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

def find_services_for_ingress(namespace: str, ingress: client.V1Ingress, api_core: client.CoreV1Api) -> List[Dict]:
    """Find all services referenced by an ingress"""
    services = []
    service_names = set()
    
    # Extract service names from ingress rules
    if ingress.spec.rules:
        for rule in ingress.spec.rules:
            if rule.http and rule.http.paths:
                for path in rule.http.paths:
                    if path.backend.service:
                        service_names.add(path.backend.service.name)
    
    # Get service details for each referenced service
    for service_name in service_names:
        try:
            service = api_core.read_namespaced_service(service_name, namespace)
            service_info = {
                "name": service.metadata.name,
                "namespace": service.metadata.namespace,
                "type": service.spec.type,
                "cluster_ip": service.spec.cluster_ip,
                "external_ips": service.spec.external_i_ps if service.spec.external_i_ps else [],
                "load_balancer_ip": service.spec.load_balancer_ip,
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
                "creation_timestamp": str(service.metadata.creation_timestamp) if service.metadata.creation_timestamp else None
            }
            services.append(service_info)
        except ApiException as e:
            if e.status == 404:
                # Service not found, add basic info
                service_info = {
                    "name": service_name,
                    "namespace": namespace,
                    "error": "Service not found"
                }
                services.append(service_info)
            else:
                print(f"Error fetching service {service_name}: {e}")
    
    return services

async def GET(request: Request, namespace: str, ingress_name: Optional[str] = None):
    """Get detailed information for all ingress resources or a specific ingress in a namespace, with bubbled-up events."""
    try:
        config.load_config()
        api_core = client.CoreV1Api()
        networking_v1_api = client.NetworkingV1Api()
        
        if ingress_name:
            try:
                ingress = networking_v1_api.read_namespaced_ingress(ingress_name, namespace)
                ingress_info = {
                    "name": ingress.metadata.name,
                    "namespace": ingress.metadata.namespace,
                    "class_name": ingress.spec.ingress_class_name,
                    "default_backend": {
                        "service": {
                            "name": ingress.spec.default_backend.service.name,
                            "port": {
                                "number": ingress.spec.default_backend.service.port.number,
                                "name": ingress.spec.default_backend.service.port.name
                            }
                        }
                    } if ingress.spec.default_backend and ingress.spec.default_backend.service else None,
                    "rules": [
                        {
                            "host": rule.host,
                            "paths": [
                                {
                                    "path": path.path,
                                    "path_type": path.path_type,
                                    "backend": {
                                        "service": {
                                            "name": path.backend.service.name,
                                            "port": {
                                                "number": path.backend.service.port.number,
                                                "name": path.backend.service.port.name
                                            }
                                        } if path.backend.service else None
                                    }
                                } for path in rule.http.paths
                            ] if rule.http and rule.http.paths else []
                        } for rule in ingress.spec.rules
                    ] if ingress.spec.rules else [],
                    "tls": [
                        {
                            "hosts": tls.hosts,
                            "secret_name": tls.secret_name
                        } for tls in ingress.spec.tls
                    ] if ingress.spec.tls else [],
                    "load_balancer_status": {
                        "ingress": [
                            {
                                "ip": lb_ingress.ip,
                                "hostname": lb_ingress.hostname,
                                "ports": [
                                    {
                                        "port": port.port,
                                        "protocol": port.protocol,
                                        "error": port.error
                                    } for port in lb_ingress.ports
                                ] if lb_ingress.ports else []
                            } for lb_ingress in ingress.status.load_balancer.ingress
                        ] if ingress.status and ingress.status.load_balancer and ingress.status.load_balancer.ingress else []
                    },
                    "labels": dict(ingress.metadata.labels) if ingress.metadata.labels else {},
                    "annotations": dict(ingress.metadata.annotations) if ingress.metadata.annotations else {},
                    "creation_timestamp": str(ingress.metadata.creation_timestamp) if ingress.metadata.creation_timestamp else None,
                    "events": get_events_for_object(namespace, api_core, "Ingress", ingress.metadata.name),
                    "target_services": find_services_for_ingress(namespace, ingress, api_core)
                }
                return JSONResponse(content={
                    "namespace": namespace,
                    "ingress": ingress_info
                })
            except ApiException as e:
                if e.status == 404:
                    return JSONResponse(status_code=404, content={"error": f"Ingress '{ingress_name}' not found in namespace '{namespace}'"})
                return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            ingresses = networking_v1_api.list_namespaced_ingress(namespace)
            ingress_infos = []
            all_events = []
            
            for ingress in ingresses.items:
                ingress_info = {
                    "name": ingress.metadata.name,
                    "namespace": ingress.metadata.namespace,
                    "class_name": ingress.spec.ingress_class_name,
                    "default_backend": {
                        "service": {
                            "name": ingress.spec.default_backend.service.name,
                            "port": {
                                "number": ingress.spec.default_backend.service.port.number,
                                "name": ingress.spec.default_backend.service.port.name
                            }
                        }
                    } if ingress.spec.default_backend and ingress.spec.default_backend.service else None,
                    "rules": [
                        {
                            "host": rule.host,
                            "paths": [
                                {
                                    "path": path.path,
                                    "path_type": path.path_type,
                                    "backend": {
                                        "service": {
                                            "name": path.backend.service.name,
                                            "port": {
                                                "number": path.backend.service.port.number,
                                                "name": path.backend.service.port.name
                                            }
                                        } if path.backend.service else None
                                    }
                                } for path in rule.http.paths
                            ] if rule.http and rule.http.paths else []
                        } for rule in ingress.spec.rules
                    ] if ingress.spec.rules else [],
                    "tls": [
                        {
                            "hosts": tls.hosts,
                            "secret_name": tls.secret_name
                        } for tls in ingress.spec.tls
                    ] if ingress.spec.tls else [],
                    "load_balancer_status": {
                        "ingress": [
                            {
                                "ip": lb_ingress.ip,
                                "hostname": lb_ingress.hostname,
                                "ports": [
                                    {
                                        "port": port.port,
                                        "protocol": port.protocol,
                                        "error": port.error
                                    } for port in lb_ingress.ports
                                ] if lb_ingress.ports else []
                            } for lb_ingress in ingress.status.load_balancer.ingress
                        ] if ingress.status and ingress.status.load_balancer and ingress.status.load_balancer.ingress else []
                    },
                    "labels": dict(ingress.metadata.labels) if ingress.metadata.labels else {},
                    "annotations": dict(ingress.metadata.annotations) if ingress.metadata.annotations else {},
                    "creation_timestamp": str(ingress.metadata.creation_timestamp) if ingress.metadata.creation_timestamp else None,
                    "events": get_events_for_object(namespace, api_core, "Ingress", ingress.metadata.name),
                    "target_services": find_services_for_ingress(namespace, ingress, api_core)
                }
                ingress_infos.append(ingress_info)
                all_events.extend(ingress_info["events"])
            
            return JSONResponse(content={
                "namespace": namespace,
                "ingresses": ingress_infos,
                "events": all_events
            })
    except ApiException as e:
        return JSONResponse(status_code=500, content={"error": str(e)})