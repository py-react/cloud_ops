from fastapi import FastAPI, Request
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from typing import List, Dict, Optional, Any
from datetime import datetime
import json
from fastapi.responses import JSONResponse

# =============================================================================
# Helper Functions
# =============================================================================

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

def get_pod_resources(pod) -> Dict[str, Dict[str, str]]:
    """Extract resource requests and limits from pod containers"""
    resources = {}
    
    if pod.spec.containers:
        for container in pod.spec.containers:
            container_resources = {}
            
            if container.resources:
                if container.resources.requests:
                    requests = {}
                    if container.resources.requests.get('cpu'):
                        requests['cpu'] = container.resources.requests['cpu']
                    if container.resources.requests.get('memory'):
                        requests['memory'] = container.resources.requests['memory']
                    if requests:
                        container_resources['requests'] = requests
                
                if container.resources.limits:
                    limits = {}
                    if container.resources.limits.get('cpu'):
                        limits['cpu'] = container.resources.limits['cpu']
                    if container.resources.limits.get('memory'):
                        limits['memory'] = container.resources.limits['memory']
                    if limits:
                        container_resources['limits'] = limits
            
            if container_resources:
                resources[container.name] = container_resources
    
    return resources

def get_pod_volumes_and_secrets(pod) -> tuple[List[str], List[str], List[str]]:
    """Extract secrets, configmaps, and PVCs from pod volumes and environment variables"""
    secrets = []
    configmaps = []
    persistent_volume_claims = []
    
    # Check volumes
    if pod.spec.volumes:
        for volume in pod.spec.volumes:
            if volume.secret:
                secrets.append(volume.secret.secret_name)
            elif volume.config_map:
                configmaps.append(volume.config_map.name)
            elif volume.persistent_volume_claim:
                persistent_volume_claims.append(volume.persistent_volume_claim.claim_name)
    
    # Check environment variables for configmap and secret references
    if pod.spec.containers:
        for container in pod.spec.containers:
            if container.env:
                for env_var in container.env:
                    if env_var.value_from:
                        if env_var.value_from.config_map_key_ref:
                            configmap_name = env_var.value_from.config_map_key_ref.name
                            if configmap_name not in configmaps:
                                configmaps.append(configmap_name)
                        elif env_var.value_from.secret_key_ref:
                            secret_name = env_var.value_from.secret_key_ref.name
                            if secret_name not in secrets:
                                secrets.append(secret_name)
    
    return secrets, configmaps, persistent_volume_claims

def get_pod_info(pod, namespace: str, api_core: client.CoreV1Api) -> Dict:
    """Get comprehensive information about a pod"""
    # Get pod resources
    resources = get_pod_resources(pod)
    
    # Get pod volumes and secrets
    secrets, configmaps, persistent_volume_claims = get_pod_volumes_and_secrets(pod)
    
    # Get pod events
    pod_events = get_events_for_object(namespace, api_core, "Pod", pod.metadata.name)
    
    # Calculate pod age
    age = None
    if pod.metadata.creation_timestamp:
        age = str(datetime.now(pod.metadata.creation_timestamp.tzinfo) - pod.metadata.creation_timestamp)
    
    # Get detailed container information
    containers = []
    if pod.spec.containers:
        for container in pod.spec.containers:
            container_info = {
                "name": container.name,
                "image": container.image,
                "image_pull_policy": container.image_pull_policy,
                "ports": [],
                "env": [],
                "volume_mounts": [],
                "resources": {},
                "command": container.command,
                "args": container.args,
                "working_dir": container.working_dir,
                "security_context": None,
                "liveness_probe": None,
                "readiness_probe": None,
                "startup_probe": None
            }
            
            # Get container ports
            if container.ports:
                for port in container.ports:
                    port_info = {
                        "name": port.name,
                        "container_port": port.container_port,
                        "protocol": port.protocol,
                        "host_port": port.host_port,
                        "host_ip": port.host_ip
                    }
                    container_info["ports"].append(port_info)
            
            # Get environment variables
            if container.env:
                for env_var in container.env:
                    env_info = {
                        "name": env_var.name,
                        "value": env_var.value,
                        "value_from": None
                    }
                    if env_var.value_from:
                        if env_var.value_from.field_ref:
                            env_info["value_from"] = {
                                "type": "field_ref",
                                "field_path": env_var.value_from.field_ref.field_path
                            }
                        elif env_var.value_from.resource_field_ref:
                            env_info["value_from"] = {
                                "type": "resource_field_ref",
                                "resource": env_var.value_from.resource_field_ref.resource,
                                "container_name": env_var.value_from.resource_field_ref.container_name
                            }
                        elif env_var.value_from.config_map_key_ref:
                            env_info["value_from"] = {
                                "type": "config_map_key_ref",
                                "name": env_var.value_from.config_map_key_ref.name,
                                "key": env_var.value_from.config_map_key_ref.key
                            }
                        elif env_var.value_from.secret_key_ref:
                            env_info["value_from"] = {
                                "type": "secret_key_ref",
                                "name": env_var.value_from.secret_key_ref.name,
                                "key": env_var.value_from.secret_key_ref.key
                            }
                    container_info["env"].append(env_info)
            
            # Get volume mounts
            if container.volume_mounts:
                for volume_mount in container.volume_mounts:
                    mount_info = {
                        "name": volume_mount.name,
                        "mount_path": volume_mount.mount_path,
                        "sub_path": volume_mount.sub_path,
                        "read_only": volume_mount.read_only
                    }
                    container_info["volume_mounts"].append(mount_info)
            
            # Get container resources
            if container.resources:
                if container.resources.requests:
                    container_info["resources"]["requests"] = dict(container.resources.requests)
                if container.resources.limits:
                    container_info["resources"]["limits"] = dict(container.resources.limits)
            
            # Get detailed security context
            if container.security_context:
                security_context = {}
                if container.security_context.run_as_user is not None:
                    security_context["run_as_user"] = container.security_context.run_as_user
                if container.security_context.run_as_group is not None:
                    security_context["run_as_group"] = container.security_context.run_as_group
                if container.security_context.privileged is not None:
                    security_context["privileged"] = container.security_context.privileged
                if container.security_context.read_only_root_filesystem is not None:
                    security_context["read_only_root_filesystem"] = container.security_context.read_only_root_filesystem
                if container.security_context.allow_privilege_escalation is not None:
                    security_context["allow_privilege_escalation"] = container.security_context.allow_privilege_escalation
                if container.security_context.capabilities:
                    capabilities = {}
                    if container.security_context.capabilities.add:
                        capabilities["add"] = container.security_context.capabilities.add
                    if container.security_context.capabilities.drop:
                        capabilities["drop"] = container.security_context.capabilities.drop
                    if capabilities:
                        security_context["capabilities"] = capabilities
                if container.security_context.se_linux_options:
                    security_context["se_linux_options"] = {
                        "level": container.security_context.se_linux_options.level,
                        "role": container.security_context.se_linux_options.role,
                        "type": container.security_context.se_linux_options.type,
                        "user": container.security_context.se_linux_options.user
                    }
                if container.security_context.windows_options:
                    security_context["windows_options"] = {
                        "gmsa_credential_spec": container.security_context.windows_options.gmsa_credential_spec,
                        "gmsa_credential_spec_name": container.security_context.windows_options.gmsa_credential_spec_name,
                        "run_as_username": container.security_context.windows_options.run_as_username
                    }
                if security_context:
                    container_info["security_context"] = security_context
            
            # Get health checks
            if container.liveness_probe:
                container_info["liveness_probe"] = {
                    "initial_delay_seconds": container.liveness_probe.initial_delay_seconds,
                    "period_seconds": container.liveness_probe.period_seconds,
                    "timeout_seconds": container.liveness_probe.timeout_seconds,
                    "success_threshold": container.liveness_probe.success_threshold,
                    "failure_threshold": container.liveness_probe.failure_threshold
                }
            
            if container.readiness_probe:
                container_info["readiness_probe"] = {
                    "initial_delay_seconds": container.readiness_probe.initial_delay_seconds,
                    "period_seconds": container.readiness_probe.period_seconds,
                    "timeout_seconds": container.readiness_probe.timeout_seconds,
                    "success_threshold": container.readiness_probe.success_threshold,
                    "failure_threshold": container.readiness_probe.failure_threshold
                }
            
            if container.startup_probe:
                container_info["startup_probe"] = {
                    "initial_delay_seconds": container.startup_probe.initial_delay_seconds,
                    "period_seconds": container.startup_probe.period_seconds,
                    "timeout_seconds": container.startup_probe.timeout_seconds,
                    "success_threshold": container.startup_probe.success_threshold,
                    "failure_threshold": container.startup_probe.failure_threshold
                }
            
            containers.append(container_info)
    
    # Get container statuses with enhanced information
    container_statuses = []
    if pod.status.container_statuses:
        for container_status in pod.status.container_statuses:
            state_info = {
                "state": "unknown",
                "started_at": None,
                "reason": None,
                "message": None,
                "exit_code": None,
                "finished_at": None
            }
            
            if container_status.state.running:
                state_info["state"] = "running"
                state_info["started_at"] = str(container_status.state.running.started_at) if container_status.state.running.started_at else None
            elif container_status.state.waiting:
                state_info["state"] = "waiting"
                state_info["reason"] = container_status.state.waiting.reason
                state_info["message"] = container_status.state.waiting.message
            elif container_status.state.terminated:
                state_info["state"] = "terminated"
                state_info["reason"] = container_status.state.terminated.reason
                state_info["message"] = container_status.state.terminated.message
                state_info["exit_code"] = container_status.state.terminated.exit_code
                state_info["finished_at"] = str(container_status.state.terminated.finished_at) if container_status.state.terminated.finished_at else None
            
            container_status_info = {
                "name": container_status.name,
                "state": state_info,
                "restart_count": container_status.restart_count,
                "ready": container_status.ready,
                "image": container_status.image,
                "image_id": container_status.image_id,
                "started": container_status.started
            }
            container_statuses.append(container_status_info)
    
    # Get init containers if any
    init_containers = []
    if pod.spec.init_containers:
        for container in pod.spec.init_containers:
            init_container_info = {
                "name": container.name,
                "image": container.image,
                "image_pull_policy": container.image_pull_policy,
                "command": container.command,
                "args": container.args,
                "env": [],
                "volume_mounts": [],
                "resources": {},
                "security_context": None
            }
            
            # Get init container env vars
            if container.env:
                for env_var in container.env:
                    env_info = {
                        "name": env_var.name,
                        "value": env_var.value
                    }
                    init_container_info["env"].append(env_info)
            
            # Get init container volume mounts
            if container.volume_mounts:
                for volume_mount in container.volume_mounts:
                    mount_info = {
                        "name": volume_mount.name,
                        "mount_path": volume_mount.mount_path,
                        "read_only": volume_mount.read_only
                    }
                    init_container_info["volume_mounts"].append(mount_info)
            
            # Get init container resources
            if container.resources:
                if container.resources.requests:
                    init_container_info["resources"]["requests"] = dict(container.resources.requests)
                if container.resources.limits:
                    init_container_info["resources"]["limits"] = dict(container.resources.limits)
            
            # Get init container security context
            if container.security_context:
                security_context = {}
                if container.security_context.run_as_user is not None:
                    security_context["run_as_user"] = container.security_context.run_as_user
                if container.security_context.privileged is not None:
                    security_context["privileged"] = container.security_context.privileged
                if container.security_context.read_only_root_filesystem is not None:
                    security_context["read_only_root_filesystem"] = container.security_context.read_only_root_filesystem
                if security_context:
                    init_container_info["security_context"] = security_context
            
            init_containers.append(init_container_info)
    
    # Get init container statuses
    init_container_statuses = []
    if pod.status.init_container_statuses:
        for container_status in pod.status.init_container_statuses:
            state_info = {
                "state": "unknown",
                "started_at": None,
                "reason": None,
                "message": None,
                "exit_code": None,
                "finished_at": None
            }
            
            if container_status.state.running:
                state_info["state"] = "running"
                state_info["started_at"] = str(container_status.state.running.started_at) if container_status.state.running.started_at else None
            elif container_status.state.waiting:
                state_info["state"] = "waiting"
                state_info["reason"] = container_status.state.waiting.reason
                state_info["message"] = container_status.state.waiting.message
            elif container_status.state.terminated:
                state_info["state"] = "terminated"
                state_info["reason"] = container_status.state.terminated.reason
                state_info["message"] = container_status.state.terminated.message
                state_info["exit_code"] = container_status.state.terminated.exit_code
                state_info["finished_at"] = str(container_status.state.terminated.finished_at) if container_status.state.terminated.finished_at else None
            
            init_status_info = {
                "name": container_status.name,
                "state": state_info,
                "restart_count": container_status.restart_count,
                "ready": container_status.ready,
                "image": container_status.image,
                "image_id": container_status.image_id
            }
            init_container_statuses.append(init_status_info)
    
    # Get pod volumes information
    volumes = []
    if pod.spec.volumes:
        for volume in pod.spec.volumes:
            volume_info = {
                "name": volume.name,
                "type": "empty_dir"  # default
            }
            
            if volume.secret:
                volume_info["type"] = "secret"
                volume_info["secret_name"] = volume.secret.secret_name
                volume_info["optional"] = volume.secret.optional
                volume_info["default_mode"] = volume.secret.default_mode
            elif volume.config_map:
                volume_info["type"] = "config_map"
                volume_info["config_map_name"] = volume.config_map.name
                volume_info["optional"] = volume.config_map.optional
                volume_info["default_mode"] = volume.config_map.default_mode
            elif volume.persistent_volume_claim:
                volume_info["type"] = "persistent_volume_claim"
                volume_info["claim_name"] = volume.persistent_volume_claim.claim_name
            elif volume.empty_dir:
                volume_info["type"] = "empty_dir"
                volume_info["medium"] = volume.empty_dir.medium
            elif volume.host_path:
                volume_info["type"] = "host_path"
                volume_info["path"] = volume.host_path.path
                volume_info["type"] = volume.host_path.type
            
            volumes.append(volume_info)
    
    # Get pod security context
    pod_security_context = None
    if pod.spec.security_context:
        pod_security_context = {}
        if pod.spec.security_context.run_as_user is not None:
            pod_security_context["run_as_user"] = pod.spec.security_context.run_as_user
        if pod.spec.security_context.run_as_group is not None:
            pod_security_context["run_as_group"] = pod.spec.security_context.run_as_group
        if pod.spec.security_context.fs_group is not None:
            pod_security_context["fs_group"] = pod.spec.security_context.fs_group
        if pod.spec.security_context.supplemental_groups:
            pod_security_context["supplemental_groups"] = pod.spec.security_context.supplemental_groups
        if pod.spec.security_context.sysctls:
            pod_security_context["sysctls"] = [
                {
                    "name": sysctl.name,
                    "value": sysctl.value
                } for sysctl in pod.spec.security_context.sysctls
            ]
    
    # Get affinity rules
    affinity = None
    if pod.spec.affinity:
        affinity = {}
        if pod.spec.affinity.node_affinity:
            affinity["node_affinity"] = {
                "required_during_scheduling_ignored_during_execution": {
                    "node_selector_terms": [
                        {
                            "match_expressions": [
                                {
                                    "key": expr.key,
                                    "operator": expr.operator,
                                    "values": expr.values
                                } for expr in term.match_expressions
                            ] if term.match_expressions else []
                        } for term in pod.spec.affinity.node_affinity.required_during_scheduling_ignored_during_execution.node_selector_terms
                    ] if pod.spec.affinity.node_affinity.required_during_scheduling_ignored_during_execution else []
                }
            }
        if pod.spec.affinity.pod_affinity:
            affinity["pod_affinity"] = {
                "preferred_during_scheduling_ignored_during_execution": [
                    {
                        "weight": pref.weight,
                        "pod_affinity_term": {
                            "label_selector": {
                                "match_expressions": [
                                    {
                                        "key": expr.key,
                                        "operator": expr.operator,
                                        "values": expr.values
                                    } for expr in pref.pod_affinity_term.label_selector.match_expressions
                                ] if pref.pod_affinity_term.label_selector.match_expressions else []
                            } if pref.pod_affinity_term.label_selector else None,
                            "namespaces": pref.pod_affinity_term.namespaces,
                            "topology_key": pref.pod_affinity_term.topology_key
                        }
                    } for pref in pod.spec.affinity.pod_affinity.preferred_during_scheduling_ignored_during_execution
                ] if pod.spec.affinity.pod_affinity.preferred_during_scheduling_ignored_during_execution else []
            }
        if pod.spec.affinity.pod_anti_affinity:
            affinity["pod_anti_affinity"] = {
                "preferred_during_scheduling_ignored_during_execution": [
                    {
                        "weight": pref.weight,
                        "pod_affinity_term": {
                            "label_selector": {
                                "match_expressions": [
                                    {
                                        "key": expr.key,
                                        "operator": expr.operator,
                                        "values": expr.values
                                    } for expr in pref.pod_affinity_term.label_selector.match_expressions
                                ] if pref.pod_affinity_term.label_selector.match_expressions else []
                            } if pref.pod_affinity_term.label_selector else None,
                            "namespaces": pref.pod_affinity_term.namespaces,
                            "topology_key": pref.pod_affinity_term.topology_key
                        }
                    } for pref in pod.spec.affinity.pod_anti_affinity.preferred_during_scheduling_ignored_during_execution
                ] if pod.spec.affinity.pod_anti_affinity.preferred_during_scheduling_ignored_during_execution else []
            }
    
    # Get tolerations
    tolerations = []
    if pod.spec.tolerations:
        for toleration in pod.spec.tolerations:
            toleration_info = {
                "key": toleration.key,
                "operator": toleration.operator,
                "value": toleration.value,
                "effect": toleration.effect,
                "toleration_seconds": toleration.toleration_seconds
            }
            tolerations.append(toleration_info)
    
    # Get related resources for this pod
    related_configmaps = []
    if configmaps:
        configmaps_list = api_core.list_namespaced_config_map(namespace)
        for cm in configmaps_list.items:
            if cm.metadata.name in configmaps:
                cm_info = {
                    "name": cm.metadata.name,
                    "data": dict(cm.data) if cm.data else {},
                    "events": get_events_for_object(namespace, api_core, "ConfigMap", cm.metadata.name),
                    "labels": dict(cm.metadata.labels) if cm.metadata.labels else {},
                    "annotations": dict(cm.metadata.annotations) if cm.metadata.annotations else {}
                }
                related_configmaps.append(cm_info)
    
    related_secrets = []
    if secrets:
        secrets_list = api_core.list_namespaced_secret(namespace)
        for secret in secrets_list.items:
            if secret.metadata.name in secrets:
                secret_info = {
                    "name": secret.metadata.name,
                    "type": secret.type,
                    "data_keys": list(secret.data.keys()) if secret.data else [],
                    "events": get_events_for_object(namespace, api_core, "Secret", secret.metadata.name),
                    "labels": dict(secret.metadata.labels) if secret.metadata.labels else {},
                    "annotations": dict(secret.metadata.annotations) if secret.metadata.annotations else {}
                }
                related_secrets.append(secret_info)
    
    related_pvcs = []
    if persistent_volume_claims:
        pvcs_list = api_core.list_namespaced_persistent_volume_claim(namespace)
        for pvc in pvcs_list.items:
            if pvc.metadata.name in persistent_volume_claims:
                pvc_info = {
                    "name": pvc.metadata.name,
                    "status": pvc.status.phase,
                    "access_modes": [mode for mode in pvc.spec.access_modes],
                    "storage_class": pvc.spec.storage_class_name,
                    "capacity": pvc.status.capacity.get("storage") if pvc.status.capacity else None,
                    "volume_name": pvc.spec.volume_name,
                    "events": get_events_for_object(namespace, api_core, "PersistentVolumeClaim", pvc.metadata.name),
                    "labels": dict(pvc.metadata.labels) if pvc.metadata.labels else {},
                    "annotations": dict(pvc.metadata.annotations) if pvc.metadata.annotations else {}
                }
                related_pvcs.append(pvc_info)
    
    pod_info = {
        "pod_name": pod.metadata.name,
        "status": pod.status.phase,
        "node_name": pod.spec.node_name,
        "containers": containers,
        "container_statuses": container_statuses,
        "init_containers": init_containers,
        "init_container_statuses": init_container_statuses,
        "volumes": volumes,
        "related_configmaps": related_configmaps,
        "related_secrets": related_secrets,
        "related_pvcs": related_pvcs,
        "events": pod_events,
        "resources": resources,
        "labels": dict(pod.metadata.labels) if pod.metadata.labels else {},
        "annotations": dict(pod.metadata.annotations) if pod.metadata.annotations else {},
        "ip": pod.status.pod_ip,
        "host_ip": pod.status.host_ip,
        "age": age,
        "restart_policy": pod.spec.restart_policy,
        "dns_policy": pod.spec.dns_policy,
        "service_account": pod.spec.service_account_name,
        "priority_class": pod.spec.priority_class_name,
        "qos_class": pod.status.qos_class,
        "security_context": pod_security_context,
        "affinity": affinity,
        "tolerations": tolerations,
        "host_network": pod.spec.host_network,
        "host_pid": pod.spec.host_pid,
        "host_ipc": pod.spec.host_ipc,
        "share_process_namespace": pod.spec.share_process_namespace,
        "automount_service_account_token": pod.spec.automount_service_account_token
    }
    
    return pod_info

# =============================================================================
# Main Functions
# =============================================================================

def fetch_specific_deployment(namespace: str, deployment_name: str, resource_type: str, apps_v1_api: client.AppsV1Api, core_v1_api: client.CoreV1Api, networking_v1_api: client.NetworkingV1Api) -> Dict:
    """Fetch information for a specific deployment"""
    try:
        # Initialize Kubernetes client
        config.load_config()
        
        # Get the resource based on the specified type
        if resource_type.lower() == "deployments":
            deployment = apps_v1_api.read_namespaced_deployment(deployment_name, namespace)
            deployment_events = get_events_for_object(namespace, core_v1_api, "Deployment", deployment_name)
            deployment_selector_str = ",".join([f"{key}={value}" for key, value in deployment.spec.selector.match_labels.items()])
            replicas = deployment.spec.replicas or 0
            available_replicas = deployment.status.ready_replicas or 0
        elif resource_type.lower() == "statefulsets":
            statefulset = apps_v1_api.read_namespaced_stateful_set(deployment_name, namespace)
            deployment = statefulset  # Use statefulset as deployment for consistency
            deployment_events = get_events_for_object(namespace, core_v1_api, "StatefulSet", deployment_name)
            deployment_selector_str = ",".join([f"{key}={value}" for key, value in statefulset.spec.selector.match_labels.items()])
            replicas = statefulset.spec.replicas or 0
            available_replicas = statefulset.status.ready_replicas or 0
        elif resource_type.lower() == "daemonsets":
            daemonset = apps_v1_api.read_namespaced_daemon_set(deployment_name, namespace)
            deployment = daemonset  # Use daemonset as deployment for consistency
            deployment_events = get_events_for_object(namespace, core_v1_api, "DaemonSet", deployment_name)
            deployment_selector_str = ",".join([f"{key}={value}" for key, value in daemonset.spec.selector.match_labels.items()])
            replicas = daemonset.status.desired_number_scheduled or 0
            available_replicas = daemonset.status.number_available or 0
        else:
            raise Exception(f"Unsupported resource type: {resource_type}. Supported types are: Deployment, StatefulSet, DaemonSet")
        
        deployment_info = {
            "deployment_name": deployment.metadata.name,
            "resource_type": resource_type,
            "replicasets": [],
            "labels": dict(deployment.metadata.labels) if deployment.metadata.labels else {},
            "annotations": dict(deployment.metadata.annotations) if deployment.metadata.annotations else {},
            "status_color": "unknown",
            "replicas": replicas,
            "available_replicas": available_replicas
        }
        
        # Get ReplicaSets for this deployment (only for Deployments)
        if resource_type.lower() == "deployment":
            replica_sets = apps_v1_api.list_namespaced_replica_set(namespace, label_selector=deployment_selector_str)
            
            for rs in replica_sets.items:
                expected_replicas = rs.spec.replicas or 0
                available_replicas = rs.status.available_replicas or 0
                
                if available_replicas == expected_replicas and expected_replicas > 0:
                    status_color = "green"
                elif available_replicas > 0:
                    status_color = "yellow"
                else:
                    status_color = "red"
                
                if rs.spec.replicas > 0 and rs.status.available_replicas is not None:
                    # Get events for replicaset
                    rs_events = get_events_for_object(namespace, core_v1_api, "ReplicaSet", rs.metadata.name)
                    
                    replica_set_info = {
                        "replicaset_name": rs.metadata.name,
                        "replicas": rs.spec.replicas,
                        "available_replicas": rs.status.available_replicas,
                        "labels": dict(rs.metadata.labels) if rs.metadata.labels else {},
                        "annotations": dict(rs.metadata.annotations) if rs.metadata.annotations else {}
                    }

                    deployment_info["replicasets"].append(replica_set_info)
        
        # Aggregate overall deployment status
        all_status_colors = []
        for rs in deployment_info["replicasets"]:
            if rs["available_replicas"] == rs["replicas"] and rs["replicas"] > 0:
                all_status_colors.append("green")
            elif rs["available_replicas"] > 0:
                all_status_colors.append("yellow")
            else:
                all_status_colors.append("red")

        if all_status_colors:
            if "red" in all_status_colors:
                deployment_info["status_color"] = "red"
            elif "yellow" in all_status_colors:
                deployment_info["status_color"] = "yellow"
            else:
                deployment_info["status_color"] = "green"
        else:
            # For StatefulSets and DaemonSets, determine status directly
            if available_replicas == replicas and replicas > 0:
                deployment_info["status_color"] = "green"
            elif available_replicas > 0:
                deployment_info["status_color"] = "yellow"
            else:
                deployment_info["status_color"] = "red"
        
        # Get related pods
        related_pods = []
        related_events = []  # Collect all events at top level
        pods = core_v1_api.list_namespaced_pod(namespace, label_selector=deployment_selector_str)
        for pod in pods.items:
            pod_info = get_pod_info(pod, namespace, core_v1_api)
            
            # Add pod events to top level with source label
            if pod_info.get("events"):
                for event in pod_info["events"]:
                    event["source"] = f"Pod: {pod.metadata.name}"
                    related_events.append(event)
                # Remove events from pod_info to avoid duplication
                del pod_info["events"]
            
            # Add events from pod's related resources
            if pod_info.get("related_configmaps"):
                for cm in pod_info["related_configmaps"]:
                    if cm.get("events"):
                        for event in cm["events"]:
                            event["source"] = f"ConfigMap: {cm['name']} (used by Pod: {pod.metadata.name})"
                            related_events.append(event)
                        # Remove events from configmap to avoid duplication
                        del cm["events"]
            
            if pod_info.get("related_secrets"):
                for secret in pod_info["related_secrets"]:
                    if secret.get("events"):
                        for event in secret["events"]:
                            event["source"] = f"Secret: {secret['name']} (used by Pod: {pod.metadata.name})"
                            related_events.append(event)
                        # Remove events from secret to avoid duplication
                        del secret["events"]
            
            if pod_info.get("related_pvcs"):
                for pvc in pod_info["related_pvcs"]:
                    if pvc.get("events"):
                        for event in pvc["events"]:
                            event["source"] = f"PVC: {pvc['name']} (used by Pod: {pod.metadata.name})"
                            related_events.append(event)
                        # Remove events from PVC to avoid duplication
                        del pvc["events"]
            
            related_pods.append(pod_info)
        
        # Get related services
        related_services = []
        services = core_v1_api.list_namespaced_service(namespace)
        for svc in services.items:
            if svc.spec.selector:
                svc_selector_str = ",".join([f"{key}={value}" for key, value in svc.spec.selector.items()])
                if svc_selector_str == deployment_selector_str:
                    service_events = get_events_for_object(namespace, core_v1_api, "Service", svc.metadata.name)
                    
                    # Add service events to top level
                    for event in service_events:
                        event["source"] = f"Service: {svc.metadata.name}"
                        related_events.append(event)
                    
                    service_info = {
                        "service_name": svc.metadata.name,
                        "type": svc.spec.type,
                        "cluster_ip": svc.spec.cluster_ip,
                        "external_ip": svc.status.load_balancer.ingress[0].ip if svc.status.load_balancer and svc.status.load_balancer.ingress else None,
                        "ports": [{"port": port.port, "target_port": port.target_port, "protocol": port.protocol} for port in svc.spec.ports],
                        "selector": svc.spec.selector,
                        "labels": dict(svc.metadata.labels) if svc.metadata.labels else {},
                        "annotations": dict(svc.metadata.annotations) if svc.metadata.annotations else {}
                    }
                    
                    related_services.append(service_info)
        
        # Get related network policies
        related_network_policies = []
        network_policies = networking_v1_api.list_namespaced_network_policy(namespace)
        for np in network_policies.items:
            # Check if network policy affects this deployment's pods
            if np.spec.pod_selector and np.spec.pod_selector.match_labels:
                np_selector = np.spec.pod_selector.match_labels
                # Check if deployment labels match network policy selector
                deployment_labels = deployment.metadata.labels or {}
                if any(key in deployment_labels and deployment_labels[key] == value for key, value in np_selector.items()):
                    np_events = get_events_for_object(namespace, core_v1_api, "NetworkPolicy", np.metadata.name)
                    
                    # Add network policy events to top level
                    for event in np_events:
                        event["source"] = f"NetworkPolicy: {np.metadata.name}"
                        related_events.append(event)
                    
                    np_info = {
                        "name": np.metadata.name,
                        "policy_types": np.spec.policy_types,
                        "pod_selector": dict(np.spec.pod_selector.match_labels) if np.spec.pod_selector and np.spec.pod_selector.match_labels else {},
                        "ingress_rules": [],
                        "egress_rules": [],
                        "labels": dict(np.metadata.labels) if np.metadata.labels else {},
                        "annotations": dict(np.metadata.annotations) if np.metadata.annotations else {},
                        "creation_timestamp": str(np.metadata.creation_timestamp) if np.metadata.creation_timestamp else None,
                        "uid": np.metadata.uid,
                        "resource_version": np.metadata.resource_version
                    }
                    
                    # Extract detailed ingress rules
                    if np.spec.ingress:
                        for rule in np.spec.ingress:
                            ingress_rule = {
                                "from": [],
                                "ports": []
                            }
                            if rule.from_:
                                for from_item in rule.from_:
                                    from_info = {}
                                    if from_item.pod_selector:
                                        from_info["pod_selector"] = {
                                            "match_labels": dict(from_item.pod_selector.match_labels) if from_item.pod_selector.match_labels else {},
                                            "match_expressions": [
                                                {
                                                    "key": expr.key,
                                                    "operator": expr.operator,
                                                    "values": expr.values
                                                } for expr in from_item.pod_selector.match_expressions
                                            ] if from_item.pod_selector.match_expressions else []
                                        }
                                    if from_item.namespace_selector:
                                        from_info["namespace_selector"] = {
                                            "match_labels": dict(from_item.namespace_selector.match_labels) if from_item.namespace_selector.match_labels else {},
                                            "match_expressions": [
                                                {
                                                    "key": expr.key,
                                                    "operator": expr.operator,
                                                    "values": expr.values
                                                } for expr in from_item.namespace_selector.match_expressions
                                            ] if from_item.namespace_selector.match_expressions else []
                                        }
                                    if from_item.ip_block:
                                        from_info["ip_block"] = {
                                            "cidr": from_item.ip_block.cidr,
                                            "exceptions": getattr(from_item.ip_block, 'except', [])
                                        }
                                    if from_info:
                                        ingress_rule["from"].append(from_info)
                            
                            if rule.ports:
                                for port in rule.ports:
                                    port_info = {
                                        "protocol": port.protocol,
                                        "port": port.port,
                                        "end_port": port.end_port if hasattr(port, 'end_port') and port.end_port else None
                                    }
                                    ingress_rule["ports"].append(port_info)
                            
                            np_info["ingress_rules"].append(ingress_rule)
                    
                    # Extract detailed egress rules
                    if np.spec.egress:
                        for rule in np.spec.egress:
                            egress_rule = {
                                "to": [],
                                "ports": []
                            }
                            if rule.to:
                                for to_item in rule.to:
                                    to_info = {}
                                    if to_item.pod_selector:
                                        to_info["pod_selector"] = {
                                            "match_labels": dict(to_item.pod_selector.match_labels) if to_item.pod_selector.match_labels else {},
                                            "match_expressions": [
                                                {
                                                    "key": expr.key,
                                                    "operator": expr.operator,
                                                    "values": expr.values
                                                } for expr in to_item.pod_selector.match_expressions
                                            ] if to_item.pod_selector.match_expressions else []
                                        }
                                    if to_item.namespace_selector:
                                        to_info["namespace_selector"] = {
                                            "match_labels": dict(to_item.namespace_selector.match_labels) if to_item.namespace_selector.match_labels else {},
                                            "match_expressions": [
                                                {
                                                    "key": expr.key,
                                                    "operator": expr.operator,
                                                    "values": expr.values
                                                } for expr in to_item.namespace_selector.match_expressions
                                            ] if to_item.namespace_selector.match_expressions else []
                                        }
                                    if to_item.ip_block:
                                        to_info["ip_block"] = {
                                            "cidr": to_item.ip_block.cidr,
                                            "exceptions": getattr(to_item.ip_block, 'except', [])
                                        }
                                    if to_info:
                                        egress_rule["to"].append(to_info)
                            
                            if rule.ports:
                                for port in rule.ports:
                                    port_info = {
                                        "protocol": port.protocol,
                                        "port": port.port,
                                        "end_port": port.end_port if hasattr(port, 'end_port') and port.end_port else None
                                    }
                                    egress_rule["ports"].append(port_info)
                            
                            np_info["egress_rules"].append(egress_rule)
                    
                    related_network_policies.append(np_info)
        
        # Get related ingresses (through services)
        related_ingresses = []
        ingresses = networking_v1_api.list_namespaced_ingress(namespace)
        for ingress in ingresses.items:
            # Check if this ingress references any of our related services
            service_names = []
            for rule in ingress.spec.rules:
                if rule.http and rule.http.paths:
                    for path in rule.http.paths:
                        if path.backend and path.backend.service:
                            service_names.append(path.backend.service.name)
            
            # Check if any of our related services are referenced by this ingress
            if any(svc["service_name"] in service_names for svc in related_services):
                ingress_events = get_events_for_object(namespace, core_v1_api, "Ingress", ingress.metadata.name)
                
                # Add ingress events to top level
                for event in ingress_events:
                    event["source"] = f"Ingress: {ingress.metadata.name}"
                    related_events.append(event)
                
                ingress_info = {
                    "ingress_name": ingress.metadata.name,
                    "host": ingress.spec.rules[0].host if ingress.spec.rules else None,
                    "path": ingress.spec.rules[0].http.paths[0].path if ingress.spec.rules and ingress.spec.rules[0].http.paths else None,
                    "services": service_names,
                    "labels": dict(ingress.metadata.labels) if ingress.metadata.labels else {},
                    "annotations": dict(ingress.metadata.annotations) if ingress.metadata.annotations else {},
                    "tls": []
                }
                
                # Extract TLS configuration
                if ingress.spec.tls:
                    for tls in ingress.spec.tls:
                        tls_info = {
                            "hosts": tls.hosts if tls.hosts else [],
                            "secret_name": tls.secret_name if tls.secret_name else None
                        }
                        ingress_info["tls"].append(tls_info)
                
                related_ingresses.append(ingress_info)
        
        # Add deployment events to top level
        for event in deployment_events:
            event["source"] = f"{resource_type}: {deployment.metadata.name}"
            related_events.append(event)
        
        # Add replica set events to top level
        for rs in deployment_info.get("replicasets", []):
            rs_events = get_events_for_object(namespace, core_v1_api, "ReplicaSet", rs['replicaset_name'])
            for event in rs_events:
                event["source"] = f"ReplicaSet: {rs['replicaset_name']} (owned by {resource_type}: {deployment.metadata.name})"
                related_events.append(event)
        
        # Sort events by timestamp (most recent first)
        related_events.sort(key=lambda x: x.get("last_timestamp", ""), reverse=True)
        
        return {
            "namespace": namespace,
            "deployment": deployment_info,
            "related_pods": related_pods,
            "related_services": related_services,
            "related_network_policies": related_network_policies,
            "related_ingresses": related_ingresses,
            "deployment_name": deployment_name,
            "resource_type": resource_type,
            "related_events": related_events
        }
        
    except ApiException as e:
        if e.status == 404:
            raise Exception(f"{resource_type} '{deployment_name}' not found in namespace '{namespace}'")
        else:
            raise Exception(f"Error fetching {resource_type}: {e}")

def fetch_all_deployments(namespace: str, apps_v1_api: client.AppsV1Api, core_v1_api: client.CoreV1Api) -> List[Dict]:
    """Fetch all deployments, statefulsets, and daemonsets in a namespace"""
    deployments = []
    related_events = []  # Collect all events at top level
    
    # Get Deployments
    try:
        deployment_list = apps_v1_api.list_namespaced_deployment(namespace)
        for deployment in deployment_list.items:
            expected_replicas = deployment.spec.replicas or 0
            available_replicas = deployment.status.ready_replicas or 0
            
            if available_replicas == expected_replicas and expected_replicas > 0:
                status_color = "green"
            elif available_replicas > 0:
                status_color = "yellow"
            else:
                status_color = "red"
            
            deployment_events = get_events_for_object(namespace, core_v1_api, "Deployment", deployment.metadata.name)
            
            # Add deployment events to top level
            for event in deployment_events:
                event["source"] = f"Deployment: {deployment.metadata.name}"
                related_events.append(event)
            
            deployment_info = {
                "deployment_name": deployment.metadata.name,
                "resource_type": "Deployment",
                "replicas": expected_replicas,
                "available_replicas": available_replicas,
                "status_color": status_color,
                "labels": dict(deployment.metadata.labels) if deployment.metadata.labels else {},
                "annotations": dict(deployment.metadata.annotations) if deployment.metadata.annotations else {}
            }
            deployments.append(deployment_info)
    except ApiException as e:
        print(f"Error fetching deployments: {e}")
    
    # Get StatefulSets
    try:
        statefulset_list = apps_v1_api.list_namespaced_stateful_set(namespace)
        for statefulset in statefulset_list.items:
            expected_replicas = statefulset.spec.replicas or 0
            available_replicas = statefulset.status.ready_replicas or 0
            
            if available_replicas == expected_replicas and expected_replicas > 0:
                status_color = "green"
            elif available_replicas > 0:
                status_color = "yellow"
            else:
                status_color = "red"
            
            statefulset_events = get_events_for_object(namespace, core_v1_api, "StatefulSet", statefulset.metadata.name)
            
            # Add statefulset events to top level
            for event in statefulset_events:
                event["source"] = f"StatefulSet: {statefulset.metadata.name}"
                related_events.append(event)
            
            statefulset_info = {
                "deployment_name": statefulset.metadata.name,
                "resource_type": "StatefulSet",
                "replicas": expected_replicas,
                "available_replicas": available_replicas,
                "status_color": status_color,
                "labels": dict(statefulset.metadata.labels) if statefulset.metadata.labels else {},
                "annotations": dict(statefulset.metadata.annotations) if statefulset.metadata.annotations else {}
            }
            deployments.append(statefulset_info)
    except ApiException as e:
        print(f"Error fetching statefulsets: {e}")
    
    # Get DaemonSets
    try:
        daemonset_list = apps_v1_api.list_namespaced_daemon_set(namespace)
        for daemonset in daemonset_list.items:
            desired_replicas = daemonset.status.desired_number_scheduled or 0
            available_replicas = daemonset.status.number_available or 0
            
            if available_replicas == desired_replicas and desired_replicas > 0:
                status_color = "green"
            elif available_replicas > 0:
                status_color = "yellow"
            else:
                status_color = "red"
            
            daemonset_events = get_events_for_object(namespace, core_v1_api, "DaemonSet", daemonset.metadata.name)
            
            # Add daemonset events to top level
            for event in daemonset_events:
                event["source"] = f"DaemonSet: {daemonset.metadata.name}"
                related_events.append(event)
            
            daemonset_info = {
                "deployment_name": daemonset.metadata.name,
                "resource_type": "DaemonSet",
                "replicas": desired_replicas,
                "available_replicas": available_replicas,
                "status_color": status_color,
                "labels": dict(daemonset.metadata.labels) if daemonset.metadata.labels else {},
                "annotations": dict(daemonset.metadata.annotations) if daemonset.metadata.annotations else {}
            }
            deployments.append(daemonset_info)
    except ApiException as e:
        print(f"Error fetching daemonsets: {e}")
    
    # Sort events by timestamp (most recent first)
    related_events.sort(key=lambda x: x.get("last_timestamp", ""), reverse=True)
    
    return deployments, related_events

async def GET(request: Request, namespace: str, deployment_name: Optional[str] = None, resource_type: Optional[str] = None):
    """FastAPI endpoint to get comprehensive namespace information with optional deployment filtering"""
    try:
        # Initialize Kubernetes client
        config.load_config()
        apps_v1_api = client.AppsV1Api()
        core_v1_api = client.CoreV1Api()
        networking_v1_api = client.NetworkingV1Api()
        
        if deployment_name:
            # Get specific deployment details
            if not resource_type:
                resource_type = "Deployment"  # Default to Deployment if not specified
            result = fetch_specific_deployment(namespace, deployment_name, resource_type, apps_v1_api, core_v1_api, networking_v1_api)
            return JSONResponse(content=result)
        else:
            # Get all deployments, statefulsets, and daemonsets
            deployments, related_events = fetch_all_deployments(namespace, apps_v1_api, core_v1_api)
            return JSONResponse(content={
                "namespace": namespace,
                "deployments": deployments,
                "related_events": related_events
            })
            
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )