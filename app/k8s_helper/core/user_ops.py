import os
from typing import List, Optional, Dict, Any
from kubernetes import client, config
from kubernetes.client import ApiException
from ..models.rbac import KubeconfigUser ,RBACRoleSpec ,RBACBindingSpec
import yaml

from pydantic import BaseModel, Field

class UserOperations:
    def __init__(self,api_client: client.ApiClient = None, path: Optional[str] = None):
        # Expand and load kubeconfig
        self.config_file = os.path.expanduser(path or "~/.kube/config")
        # Load into kubernetes client
        config.load_kube_config(config_file=self.config_file)
        self.api_client = api_client or client.ApiClient()
        self._load_kubeconfig()
        self.rbac_api = client.RbacAuthorizationV1Api(self.api_client)
        self.core_V1_Api = client.CoreV1Api(self.api_client)

    # ─── KUBECONFIG USER CRUD ─────────────────────────────────────────────────────

    def _load_kubeconfig(self):
        with open(self.config_file, 'r') as f:
            self._kcfg = yaml.safe_load(f)

    def _save_kubeconfig(self):
        with open(self.config_file, 'w') as f:
            yaml.safe_dump(self._kcfg, f)

    def list_users(self) -> List[Dict]:
        users = []
        for u in self._kcfg.get('users', []):
            new_data = {
                "user":u
            }
            contexts = self._kcfg.get("contexts",[])
            for context in contexts:
                if context["context"]["user"] == u["name"]:
                    new_data["context"] = context
            clusters = self._kcfg.get("clusters",[])
            for cluster in clusters:
                if cluster["name"] == new_data["context"]["context"]["cluster"]:
                    new_data["cluster"] = cluster
            users.append(new_data)
        return users

    def get_user(self, name: str) -> Optional[KubeconfigUser]:
        for u in self._kcfg.get('users', []):
            if u.get('name') == name:
                return KubeconfigUser(**u)
        return None

    def update_user(self, name: str, new_spec: KubeconfigUser) -> None:
        users = self._kcfg.get('users', [])
        for idx, u in enumerate(users):
            if u.get('name') == name:
                users[idx] = new_spec.dict()
                self._save_kubeconfig()
                return
        raise KeyError(f"User '{name}' not found")

    def delete_user(self, name: str) -> None:
        users = self._kcfg.get('users', [])
        new = [u for u in users if u.get('name') != name]
        if len(new) == len(users):
            raise KeyError(f"User '{name}' not found")
        self._kcfg['users'] = new
        self._save_kubeconfig()

    # ─── RBAC ROLE CRUD ───────────────────────────────────────────────────────────

    def list_roles(self, namespace: Optional[str] = None) -> List[str]:
        if namespace:
            return  self.rbac_api.list_namespaced_role(namespace)
        else:
            data = self.rbac_api.list_cluster_role(async_req=True)
            return [item.to_dict() for item in data.get().items]

    def get_role(self, spec: RBACRoleSpec):
        try:
            if spec.namespace:
                return self.rbac_api.read_namespaced_role(spec.name, spec.namespace)
            else:
                return self.rbac_api.read_cluster_role(spec.name)
        except ApiException as e:
            if e.status == 404:
                return None
            raise

    def create_role(self, spec: RBACRoleSpec):
        body = client.V1Role(
            metadata=client.V1ObjectMeta(name=spec.name),
            rules=[client.V1PolicyRule(**r) for r in spec.rules]
        ) if spec.namespace else client.V1ClusterRole(
            metadata=client.V1ObjectMeta(name=spec.name),
            rules=[client.V1PolicyRule(**r) for r in spec.rules]
        )

        if spec.namespace:
            return self.rbac_api.create_namespaced_role(spec.namespace, body)
        else:
            return self.rbac_api.create_cluster_role(body)

    def update_role(self, spec: RBACRoleSpec):
        existing = self.get_role(spec)
        if not existing:
            raise KeyError(f"Role '{spec.name}' not found")
        existing.rules = [client.V1PolicyRule(**r) for r in spec.rules]
        if spec.namespace:
            return self.rbac_api.replace_namespaced_role(spec.name, spec.namespace, existing)
        else:
            return self.rbac_api.replace_cluster_role(spec.name, existing)

    def delete_role(self, spec: RBACRoleSpec):
        if spec.namespace:
            return self.rbac_api.delete_namespaced_role(spec.name, spec.namespace)
        else:
            return self.rbac_api.delete_cluster_role(spec.name)

    # ─── RBAC ROLEBINDING CRUD ────────────────────────────────────────────────────

    def list_bindings(self, namespace: Optional[str] = None) -> List[str]:
        if namespace:
            b = self.rbac_api.list_namespaced_role_binding(namespace)
            return [rb.metadata.name for rb in b.items]
        else:
            b = self.rbac_api.list_cluster_role_binding(async_req=True)
            return [rb.to_dict() for rb in b.get().items]

    def get_binding(self, spec: RBACBindingSpec):
        try:
            if spec.namespace:
                return self.rbac_api.read_namespaced_role_binding(spec.name, spec.namespace)
            else:
                return self.rbac_api.read_cluster_role_binding(spec.name)
        except ApiException as e:
            if e.status == 404:
                return None
            raise

    def create_binding(self, spec: RBACBindingSpec):
        meta = client.V1ObjectMeta(name=spec.name)
        body = (client.V1RoleBinding if spec.namespace else client.V1ClusterRoleBinding)(
            metadata=meta,
            subjects=[client.V1Subject(**s) for s in spec.subjects],
            role_ref=client.V1RoleRef(**spec.role_ref)
        )
        if spec.namespace:
            return self.rbac_api.create_namespaced_role_binding(spec.namespace, body)
        else:
            return self.rbac_api.create_cluster_role_binding(body)

    def update_binding(self, spec: RBACBindingSpec):
        existing = self.get_binding(spec)
        if not existing:
            raise KeyError(f"Binding '{spec.name}' not found")
        existing.subjects = [client.V1Subject(**s) for s in spec.subjects]
        existing.role_ref = client.V1RoleRef(**spec.role_ref)
        if spec.namespace:
            return self.rbac_api.replace_namespaced_role_binding(
                spec.name, spec.namespace, existing
            )
        else:
            return self.rbac_api.replace_cluster_role_binding(spec.name, existing)

    def delete_binding(self, spec: RBACBindingSpec):
        if spec.namespace:
            return self.rbac_api.delete_namespaced_role_binding(spec.name, spec.namespace)
        else:
            return self.rbac_api.delete_cluster_role_binding(spec.name)
