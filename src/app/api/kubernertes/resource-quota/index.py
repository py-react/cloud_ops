from typing import Optional
from kubernetes import client, config
from kubernetes.client import ApiException
import json

async def GET(namespace:Optional[str]=None):
    config.load_kube_config()  # for out‑of‑cluster
    # 2. Create CoreV1Api client
    v1 = client.CoreV1Api()
    try:
        if namespace:
            # List ResourceQuotas in a specific namespace
            rq_list = v1.list_namespaced_resource_quota(namespace,async_req=True)
        else:
            # List ResourceQuotas across all namespaces
            rq_list = v1.list_resource_quota_for_all_namespaces(async_req=True)

        quota = []
        print(rq_list.get().items[0])
        # 3. Iterate and print basic info
        for rq in rq_list.get().items:
            # Extract last applied configuration from annotations
            last_applied = None
            if rq.metadata.annotations:
                last_applied_config = rq.metadata.annotations.get('kubectl.kubernetes.io/last-applied-configuration')
                if last_applied_config:
                    try:
                        # kubectl stores this as JSON, not YAML
                        last_applied = json.loads(last_applied_config)
                    except json.JSONDecodeError:
                        # If JSON parsing fails, return the raw string
                        last_applied = last_applied_config
            
            rq_list_item = {
                "name":rq.metadata.name,
                "namespace":rq.metadata.namespace,
                # Full spec (hard limits + scopes + scopeSelector + any future fields)
                "spec": rq.spec.to_dict(),
                # Full status (used, hard, conditions, etc.)
                "status": rq.status.to_dict() if rq.status else {},
                "labels": rq.metadata.labels or {},
                "annotations": rq.metadata.annotations or {},
                "creation_timestamp": rq.metadata.creation_timestamp,
                "last_applied": last_applied
            }
            quota.append(rq_list_item)
        return quota

    except ApiException as e:
        print(f"Exception when listing ResourceQuotas: {e}")
