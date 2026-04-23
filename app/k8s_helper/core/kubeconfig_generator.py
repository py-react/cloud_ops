import json
import yaml
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from kubernetes import client
from kubernetes.client import ApiException
from .service_account_ops import ServiceAccountOperations

logger = logging.getLogger(__name__)


ROLE_TEMPLATES = {
    "read_only": {
        "name": "read-only",
        "description": "View-only access (get, list, watch)",
        "rules": [
            {
                "apiGroups": [""],
                "resources": ["pods", "services", "configmaps", "secrets", "endpoints", "pods/log", "pods/status"],
                "verbs": ["get", "list", "watch"]
            },
            {
                "apiGroups": ["apps"],
                "resources": ["deployments", "statefulsets", "daemonsets", "replicasets"],
                "verbs": ["get", "list", "watch"]
            },
            {
                "apiGroups": ["networking.k8s.io"],
                "resources": ["ingresses", "networkpolicies"],
                "verbs": ["get", "list", "watch"]
            },
            {
                "apiGroups": [""],
                "resources": ["events"],
                "verbs": ["get", "list", "watch"]
            },
            {
                "apiGroups": ["batch"],
                "resources": ["jobs", "cronjobs"],
                "verbs": ["get", "list", "watch"]
            }
        ]
    },
    "developer": {
        "name": "developer",
        "description": "Standard developer access (get, list, watch, create, delete, patch, exec)",
        "rules": [
            {
                "apiGroups": [""],
                "resources": ["pods", "services", "configmaps", "secrets", "endpoints", "pods/log", "pods/status"],
                "verbs": ["get", "list", "watch", "create", "delete", "patch", "exec"]
            },
            {
                "apiGroups": ["apps"],
                "resources": ["deployments", "statefulsets", "daemonsets", "replicasets"],
                "verbs": ["get", "list", "watch", "create", "delete", "patch"]
            },
            {
                "apiGroups": ["networking.k8s.io"],
                "resources": ["ingresses", "networkpolicies"],
                "verbs": ["get", "list", "watch", "create", "delete", "patch"]
            },
            {
                "apiGroups": [""],
                "resources": ["events"],
                "verbs": ["get", "list", "watch"]
            },
            {
                "apiGroups": ["batch"],
                "resources": ["jobs", "cronjobs"],
                "verbs": ["get", "list", "watch", "create", "delete", "patch"]
            },
            {
                "apiGroups": [""],
                "resources": ["pods/attach", "pods/exec", "pods/portforward"],
                "verbs": ["create", "delete"]
            }
        ]
    },
    "ops": {
        "name": "ops",
        "description": "Operations access (full CRUD + debugging)",
        "rules": [
            {
                "apiGroups": ["*"],
                "resources": ["*"],
                "verbs": ["get", "list", "watch", "create", "delete", "patch", "edit"]
            },
            {
                "nonResourceURLs": ["*"],
                "verbs": ["get", "list", "watch"]
            }
        ]
    },
    "admin": {
        "name": "admin",
        "description": "Full admin access to namespace",
        "rules": [
            {
                "apiGroups": ["*"],
                "resources": ["*"],
                "verbs": ["*"]
            },
            {
                "nonResourceURLs": ["*"],
                "verbs": ["*"]
            }
        ]
    }
}


class KubeconfigGenerator:
    def __init__(self, api_client: client.ApiClient = None):
        self.api_client = api_client or client.ApiClient()
        self.sa_ops = ServiceAccountOperations(self.api_client)
        self.rbac_api = client.RbacAuthorizationV1Api(self.api_client)
        self.core_v1_api = client.CoreV1Api(self.api_client)
    
    def get_cluster_info(self) -> Dict[str, Any]:
        """Get current cluster information from kubeconfig"""
        try:
            k8s_config.load_kube_config(api_client=self.api_client)
        except:
            pass
        
        return {
            "server": "https://kubernetes.default.svc",
            "ca_data": "",
            "context_name": "default"
        }
    
    def generate(
        self,
        service_account_name: str,
        namespace: str,
        role_template: str = "developer",
        custom_role_rules: Optional[list] = None,
        token_expiry_hours: int = 168
    ) -> Dict[str, Any]:
        """Generate complete kubeconfig with RBAC"""
        
        logger.info(f"Creating SA: {service_account_name} in namespace: {namespace}")
        
        sa_result = self.sa_ops.create_service_account(
            name=service_account_name,
            namespace=namespace
        )
        
        logger.info(f"SA created: {sa_result}")
        
        role_name = f"{role_template}-template-{service_account_name}"
        
        if role_template == "custom" and custom_role_rules:
            rules = custom_role_rules
        else:
            template = ROLE_TEMPLATES.get(role_template, ROLE_TEMPLATES["developer"])
            rules = template["rules"]
        
        def convert_rule_keys(rule: Dict[str, Any]) -> Dict[str, Any]:
            return {
                "api_groups" if k == "apiGroups" else "non_resource_ur_ls" if k == "nonResourceURLs" else k: v
                for k, v in rule.items()
            }
        
        role_body = client.V1Role(
            metadata=client.V1ObjectMeta(
                name=role_name,
                namespace=namespace,
                labels={
                    "generated-by": "cloudops",
                    "service-account": service_account_name
                }
            ),
            rules=[client.V1PolicyRule(**convert_rule_keys(r)) for r in rules]
        )
        
        try:
            self.rbac_api.create_namespaced_role(
                namespace=namespace,
                body=role_body
            )
        except client.ApiException as e:
            if e.status != 409:
                raise Exception(f"Failed to create role: {e.body}")
        
        binding_body = client.V1RoleBinding(
            metadata=client.V1ObjectMeta(
                name=f"{service_account_name}-binding",
                namespace=namespace
            ),
            subjects=[
                client.RbacV1Subject(
                    kind="ServiceAccount",
                    name=service_account_name,
                    namespace=namespace
                )
            ],
            role_ref=client.V1RoleRef(
                api_group="rbac.authorization.k8s.io",
                kind="Role",
                name=role_name
            )
        )
        
        try:
            self.rbac_api.create_namespaced_role_binding(
                namespace=namespace,
                body=binding_body
            )
        except client.ApiException as e:
            if e.status != 409:
                raise Exception(f"Failed to create role binding: {e.body}")
        
        logger.info("Creating service account token")
        token = self.sa_ops.create_token_request(
            name=service_account_name,
            namespace=namespace,
            expiry_hours=token_expiry_hours
        )
        logger.info(f"Token obtained: {'Yes' if token else 'No'}")
        
        if not token:
            raise Exception("Failed to retrieve service account token")
        
        cluster_info = self._get_current_cluster()
        
        kubeconfig = {
            "apiVersion": "v1",
            "kind": "Config",
            "clusters": [
                {
                    "name": cluster_info["context_name"],
                    "cluster": {
                        "server": cluster_info["server"],
                        "certificate-authority-data": cluster_info.get("ca_data", "")
                    }
                }
            ],
            "users": [
                {
                    "name": service_account_name,
                    "user": {
                        "token": token
                    }
                }
            ],
            "contexts": [
                {
                    "name": f"{namespace}-{service_account_name}",
                    "context": {
                        "cluster": cluster_info["context_name"],
                        "namespace": namespace,
                        "user": service_account_name
                    }
                }
            ],
            "current-context": f"{namespace}-{service_account_name}"
        }
        
        expires_at = datetime.now() + timedelta(hours=token_expiry_hours)
        
        return {
            "status": "generated",
            "service_account": service_account_name,
            "namespace": namespace,
            "role": role_name,
            "role_template": role_template,
            "token_expiry_hours": token_expiry_hours,
            "expires_at": expires_at.isoformat(),
            "kubeconfig": kubeconfig,
            "kubeconfig_yaml": yaml.dump(kubeconfig, default_flow_style=False)
        }
    
    def generate_yaml(self, kubeconfig: Dict) -> str:
        """Convert kubeconfig dict to YAML string"""
        return yaml.dump(kubeconfig, default_flow_style=False)
    
    def revoke_access(
        self,
        service_account_name: str,
        namespace: str,
        role_template: str = "developer"
    ) -> Dict[str, Any]:
        """Revoke access by removing SA, RBAC (everything)"""
        
        role_name = f"{role_template}-template-{service_account_name}"
        
        try:
            self.rbac_api.delete_namespaced_role_binding(
                name=f"{service_account_name}-binding",
                namespace=namespace
            )
            logger.info(f"Deleted role binding for {service_account_name}")
        except Exception as e:
            logger.warning(f"Could not delete role binding: {e}")
        
        try:
            self.rbac_api.delete_namespaced_role(
                name=role_name,
                namespace=namespace
            )
            logger.info(f"Deleted role for {service_account_name}")
        except Exception as e:
            logger.warning(f"Could not delete role: {e}")
        
        try:
            self.sa_ops.delete_service_account(
                name=service_account_name,
                namespace=namespace
            )
            logger.info(f"Deleted service account for {service_account_name}")
        except Exception as e:
            logger.warning(f"Could not delete service account: {e}")
        
        logger.info(f"Access revoked for {service_account_name} - SA, Role, RoleBinding all removed")
        
        return {
            "status": "revoked",
            "service_account": service_account_name,
            "namespace": namespace,
            "message": "SA, Role, RoleBinding all removed"
        }
    
    def delete_access(
        self,
        service_account_name: str,
        namespace: str,
        role_template: str = "developer"
    ) -> Dict[str, Any]:
        """Delete K8s resources (SA, Role, RoleBinding) - does NOT touch DB"""
        
        role_name = f"{role_template}-template-{service_account_name}"
        
        try:
            self.rbac_api.delete_namespaced_role_binding(
                name=f"{service_account_name}-binding",
                namespace=namespace
            )
            logger.info(f"Deleted role binding for {service_account_name}")
        except Exception as e:
            logger.warning(f"Could not delete role binding: {e}")
        
        try:
            self.rbac_api.delete_namespaced_role(
                name=role_name,
                namespace=namespace
            )
            logger.info(f"Deleted role for {service_account_name}")
        except Exception as e:
            logger.warning(f"Could not delete role: {e}")
        
        try:
            self.sa_ops.delete_service_account(
                name=service_account_name,
                namespace=namespace
            )
            logger.info(f"Deleted service account for {service_account_name}")
        except Exception as e:
            logger.warning(f"Could not delete service account: {e}")
        
        logger.info(f"K8s resources deleted for {service_account_name}")
        
        return {
            "status": "deleted",
            "service_account": service_account_name,
            "namespace": namespace,
            "message": "K8s resources removed"
        }
    
    def regenerate_token(
        self,
        service_account_name: str,
        namespace: str,
        role_template: str = "developer",
        token_expiry_hours: int = 168,
        custom_role_rules: Optional[list] = None
    ) -> Dict[str, Any]:
        """Regenerate token for existing or new ServiceAccount and recreate RBAC if needed"""
        
        try:
            sa = self.sa_ops.core_v1_api.read_namespaced_service_account(
                name=service_account_name,
                namespace=namespace
            )
            logger.info(f"SA exists")
        except ApiException as e:
            if e.status == 404:
                logger.info(f"SA doesn't exist, will recreate")
                self.sa_ops.create_service_account(
                    name=service_account_name,
                    namespace=namespace
                )
            else:
                raise
        
        if role_template == "custom" and custom_role_rules:
            rules = custom_role_rules
        else:
            template = ROLE_TEMPLATES.get(role_template, ROLE_TEMPLATES["developer"])
            rules = template["rules"]
        
        def convert_rule_keys(rule: Dict[str, Any]) -> Dict[str, Any]:
            return {
                "api_groups" if k == "apiGroups" else "non_resource_ur_ls" if k == "nonResourceURLs" else k: v
                for k, v in rule.items()
            }
        
        role_name = f"{role_template}-template-{service_account_name}"
        
        try:
            self.rbac_api.read_namespaced_role(name=role_name, namespace=namespace)
            logger.info(f"Role already exists")
        except ApiException as e:
            if e.status == 404:
                role_body = client.V1Role(
                    metadata=client.V1ObjectMeta(
                        name=role_name,
                        namespace=namespace,
                        labels={
                            "generated-by": "cloudops",
                            "service-account": service_account_name
                        }
                    ),
                    rules=[client.V1PolicyRule(**convert_rule_keys(r)) for r in rules]
                )
                try:
                    self.rbac_api.create_namespaced_role(namespace=namespace, body=role_body)
                    logger.info(f"Created role: {role_name}")
                except ApiException:
                    pass
            else:
                raise
        
        try:
            self.rbac_api.read_namespaced_role_binding(
                name=f"{service_account_name}-binding",
                namespace=namespace
            )
            logger.info(f"Role binding already exists")
        except ApiException as e:
            if e.status == 404:
                binding_body = client.V1RoleBinding(
                    metadata=client.V1ObjectMeta(
                        name=f"{service_account_name}-binding",
                        namespace=namespace
                    ),
                    subjects=[
                        client.RbacV1Subject(
                            kind="ServiceAccount",
                            name=service_account_name,
                            namespace=namespace
                        )
                    ],
                    role_ref=client.V1RoleRef(
                        api_group="rbac.authorization.k8s.io",
                        kind="Role",
                        name=role_name
                    )
                )
                try:
                    self.rbac_api.create_namespaced_role_binding(namespace=namespace, body=binding_body)
                    logger.info(f"Created role binding")
                except ApiException:
                    pass
            else:
                raise
        
        token = self.sa_ops.create_token_request(
            name=service_account_name,
            namespace=namespace,
            expiry_hours=token_expiry_hours
        )
        
        cluster_info = self.get_cluster_info()
        
        kubeconfig = {
            "apiVersion": "v1",
            "kind": "Config",
            "clusters": [{
                "name": f"kubernetes-admin@{cluster_info['context_name']}",
                "cluster": {
                    "server": cluster_info["server"],
                    "certificate-authority-data": cluster_info["ca_data"]
                }
            }],
            "users": [{
                "name": service_account_name,
                "user": {
                    "token": token
                }
            }],
            "contexts": [{
                "name": f"{namespace}-{service_account_name}",
                "context": {
                    "cluster": f"kubernetes-admin@{cluster_info['context_name']}",
                    "namespace": namespace,
                    "user": service_account_name
                }
            }],
            "current-context": f"{namespace}-{service_account_name}"
        }
        
        return {
            "status": "token_rotated",
            "service_account": service_account_name,
            "namespace": namespace,
            "role": f"{role_template}-template-{service_account_name}",
            "role_template": role_template,
            "token_expiry_hours": token_expiry_hours,
            "kubeconfig": kubeconfig
        }
    
    def list_generated_access(
        self,
        namespace: str
    ) -> list:
        """List all generated access in namespace"""
        
        sa_list = self.sa_ops.list_service_accounts(namespace)
        
        result = []
        for sa in sa_list:
            if sa.get("labels", {}).get("app") == "cloudops-generated":
                result.append(sa)
        
        return result
    
    def get_template(self, template_name: str) -> Optional[Dict]:
        """Get role template by name"""
        return ROLE_TEMPLATES.get(template_name)
    
    def list_templates(self) -> list:
        """List all available role templates"""
        return [
            {
                "name": name,
                "description": template["description"]
            }
            for name, template in ROLE_TEMPLATES.items()
        ]
    
    def _get_current_cluster(self) -> Dict[str, Any]:
        """Get current cluster info from kubeconfig"""
        try:
            import os
            config_file = os.path.expanduser("~/.kube/config")
            if os.path.exists(config_file):
                with open(config_file, 'r') as f:
                    kubeconfig = yaml.safe_load(f)
                
                current_ctx = kubeconfig.get("current-context", "")
                for ctx in kubeconfig.get("contexts", []):
                    if ctx.get("name") == current_ctx:
                        cluster_name = ctx["context"]["cluster"]
                        for cluster in kubeconfig.get("clusters", []):
                            if cluster["name"] == cluster_name:
                                return {
                                    "context_name": current_ctx,
                                    "server": cluster["cluster"].get("server", "https://kubernetes.default.svc"),
                                    "ca_data": cluster["cluster"].get("certificate-authority-data", "")
                                }
        except:
            pass
        
        return {
            "context_name": "default",
            "server": "https://kubernetes.default.svc",
            "ca_data": ""
        }


from kubernetes import config as k8s_config