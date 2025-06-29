from fastapi import Request
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
from datetime import datetime

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


async def GET(request: Request, namespace: str, pod_name: Optional[str] = None):
    """Get detailed information for all pods or a specific pod in a namespace, with bubbled-up events."""
    try:
        config.load_config()
        api_core = client.CoreV1Api()
        if pod_name:
            try:
                pod = api_core.read_namespaced_pod(pod_name, namespace)
                pod_info = get_pod_info(pod, namespace, api_core)
                pod_events = get_events_for_object(namespace, api_core, "Pod", pod.metadata.name)
                return JSONResponse(content={
                    "namespace": namespace,
                    "pod": pod_info,
                    "events": pod_events
                })
            except ApiException as e:
                if e.status == 404:
                    return JSONResponse(status_code=404, content={"error": f"Pod '{pod_name}' not found in namespace '{namespace}'"})
                return JSONResponse(status_code=500, content={"error": str(e)})
        else:
            pods = api_core.list_namespaced_pod(namespace)
            pod_infos = []
            all_events = []
            for pod in pods.items:
                pod_info = get_pod_info(pod, namespace, api_core)
                pod_infos.append(pod_info)
                pod_events = get_events_for_object(namespace, api_core, "Pod", pod.metadata.name)
                all_events.extend(pod_events)
            return JSONResponse(content={
                "namespace": namespace,
                "pods": pod_infos,
                "events": all_events
            })
    except ApiException as e:
        return JSONResponse(status_code=500, content={"error": str(e)})