import yaml
from typing import Optional, Dict, List, Any
from kubernetes import client, config
from kubernetes.dynamic import DynamicClient
from kubernetes.dynamic.exceptions import NotFoundError,ApiException
import json
import jsonpatch

from .namespace_ops import NamespaceOperations
from .cluster_ops import ClusterOperations
from .resource_ops import ResourceOperations
from ..models.resources import ResourceScope, ClusterInfo, ResourceInfo
from ..registry import PatchRegistry, supported_mapping_types
import inspect


def get_class_methods(cls):
    return [
        name for name, member in inspect.getmembers(cls, predicate=inspect.isfunction)
    ]
from app.services.kube_config_service import KubeConfigService

class KubernetesResourceHelper:
    """Main class to interact with Kubernetes resources"""
    
    def __init__(self, kubeconfig_path: Optional[str] = None):
        """
        Initialize the Kubernetes client
        
        Args:
            kubeconfig_path: Path to kubeconfig file. If None, uses active config from DB or default
        """
        # Initialize Kubernetes client
        success = False
        if kubeconfig_path:
            try:
                config.load_kube_config(kubeconfig_path)
                success = True
            except Exception as e:
                raise ValueError(f"Failed to load Kubeconfig from path '{kubeconfig_path}': {e}")
        else:
            # Dynamically load from DB
            success = KubeConfigService.load_active_config()
        
        if not success:
            raise ValueError("No active Kubernetes configuration found. Please upload or activate a Kubeconfig in the Control Center.")

        # Initialize API clients
        try:
            self.api_client = client.ApiClient()
            self.dyn_client = DynamicClient(self.api_client)
            self.core_api = client.CoreV1Api()
            self.apps_api = client.AppsV1Api()
            self.rbac_api = client.RbacAuthorizationV1Api()
            self.custom_objects_api = client.CustomObjectsApi()
        except Exception as e:
            raise ValueError(f"Failed to initialize Kubernetes API clients: {e}. Ensure your configuration is valid and reachable.")
        
        # Initialize operation classes
        self.resource_ops = ResourceOperations(
            self.api_client,
            apps_api=self.apps_api,
            networking_api=None,  # Initialize if needed
            rbac_api=self.rbac_api
        )
        self.namespace_ops = NamespaceOperations(self.core_api, self)
        self.cluster_ops = ClusterOperations(self.api_client, self.core_api,self.custom_objects_api, self)
        self._registry = {
            "PatchRegistry": PatchRegistry({})
        }
    # Resource Operations
    def get_api_resources(self, scope: ResourceScope = ResourceScope.ALL) -> List[ResourceInfo]:
        """Get list of available API resources"""
        return self.resource_ops.get_api_resources(scope)

    def get_resource_details(self, resource_type: str, namespace: Optional[str] = None,
                           field_selector: Optional[str] = None,
                           label_selector: Optional[str] = None,
                           api_version: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get details of specific resources"""
        return self.resource_ops.get_resource_details(
            resource_type, namespace, field_selector, label_selector, api_version
        )

    # Namespace Operations
    def get_namespaces(self, label_selector: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get all namespaces in the cluster"""
        return self.namespace_ops.get_namespaces(label_selector)

    def get_namespace_details(self, namespace: str) -> Dict[str, Any]:
        """Get detailed information about a specific namespace"""
        return self.namespace_ops.get_namespace_details(namespace)

    def create_namespace(self, name: str, labels: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """Create a new namespace"""
        return self.namespace_ops.create_namespace(name, labels)

    def delete_namespace(self, name: str) -> None:
        """Delete a namespace and all resources in it"""
        self.namespace_ops.delete_namespace(name)

    def list_resources(self, api_version: str, kind: str, namespace: Optional[str] = None, label_selector: Optional[str] = None):
        """List resources of a specific api_version and kind"""
        resource_client = self.dyn_client.resources.get(api_version=api_version, kind=kind)
        return resource_client.get(namespace=namespace, label_selector=label_selector)

    def get_resource(self, api_version: str, kind: str, name: str, namespace: Optional[str] = None):
        """Get a specific resource"""
        resource_client = self.dyn_client.resources.get(api_version=api_version, kind=kind)
        return resource_client.get(name=name, namespace=namespace)

    def create_resource(self, resource: dict):
        """
        Create a resource directly.
        """
        api_version = resource.get('apiVersion')
        kind = resource.get('kind')
        name = resource.get('metadata', {}).get('name')
        namespace = resource.get('metadata', {}).get('namespace', 'default')
        
        resource_client = self.dyn_client.resources.get(api_version=api_version, kind=kind)
        return resource_client.create(body=resource, namespace=namespace)

    def apply_resource(self, resource: dict):
        """
        Create or patch a resource (apply semantics).
        """
        if not resource or not isinstance(resource, dict):
            print(f"Skipping invalid resource: {type(resource)}")
            return None

        # print("resource", type(resource))
        api_version = resource.get('apiVersion')
        kind = resource.get('kind')
        
        if not api_version or not kind:
            print(f"Skipping resource missing apiVersion or kind: {resource}")
            return None

        metadata = resource.get('metadata', {})
        name = metadata.get('name')
        if not name:
            print(f"Skipping resource missing name: {resource}")
            return None

        namespace = metadata.get('namespace', 'default')

        resource_client = self.dyn_client.resources.get(api_version=api_version, kind=kind)
        
        # Add last-applied-configuration annotation to the desired state
        if 'metadata' not in resource:
            resource['metadata'] = {}
        if 'annotations' not in resource['metadata']:
            resource['metadata']['annotations'] = {}
        
        # Store the complete desired state as JSON string
        resource['metadata']['annotations']['kubectl.kubernetes.io/last-applied-configuration'] = json.dumps(resource)
        
        try:
            # Try to get the current resource from the cluster
            current_resource = resource_client.get(name=name, namespace=namespace)
            current_dict = current_resource.to_dict()
            
            # Extract last-applied-configuration from current resource
            last_applied = None
            if (current_dict.get('metadata', {}).get('annotations', {})
                .get('kubectl.kubernetes.io/last-applied-configuration')):
                try:
                    last_applied = json.loads(
                        current_dict['metadata']['annotations']['kubectl.kubernetes.io/last-applied-configuration']
                    )
                except json.JSONDecodeError:
                    pass
            
            if last_applied:
                # Create a patch that includes explicit null values for removed fields
                # This is how kubectl apply handles field removal
                patch_resource = self._create_apply_patch(last_applied, resource)
                
                # Use strategic merge patch with the patch resource
                return resource_client.patch(
                    name=name, 
                    namespace=namespace, 
                    body=patch_resource,
                    content_type='application/merge-patch+json'
                )
            else:
                # No last-applied-configuration, do a strategic merge patch
                return resource_client.patch(
                    name=name, 
                    namespace=namespace, 
                    body=resource,
                    content_type='application/merge-patch+json'
                )
        
        except Exception as e:
            # Resource doesn't exist, create it
            if isinstance(e,NotFoundError):
                return resource_client.create(body=resource, namespace=namespace)
            elif isinstance(e,ApiException):
                raise Exception(json.loads(e.body) if e.body  else str(e))
            else:
                raise e

    def _create_apply_patch(self, last_applied: dict, desired: dict) -> dict:
        """
        Create a patch resource that includes explicit null values for removed fields.
        This mimics kubectl apply's behavior for field removal.
        """
        patch = {}
        
        # Handle all fields from last_applied
        for key, value in last_applied.items():
            if key not in desired:
                # Field was in last_applied but not in desired - set to null to remove it
                patch[key] = None
            elif isinstance(value, dict) and isinstance(desired.get(key), dict):
                # Recursively handle nested objects
                nested_patch = self._create_apply_patch(value, desired[key])
                if nested_patch:  # Only add if there are changes
                    patch[key] = nested_patch
            elif isinstance(value, list) and isinstance(desired.get(key), list):
                # For lists, replace with the new list
                patch[key] = desired[key]
            else:
                # Field exists in both, use the desired value
                patch[key] = desired[key]
        
        # Add new fields from desired that weren't in last_applied
        for key, value in desired.items():
            if key not in last_applied:
                patch[key] = value
        
        return patch

    def delete_resource(self, resource: dict):
        """
        Delete a resource by its metadata.
        """
        api_version = resource['apiVersion']
        kind = resource['kind']
        name = resource['metadata']['name']
        namespace = resource['metadata'].get('namespace', 'default')
        resource_client = self.dyn_client.resources.get(api_version=api_version, kind=kind)
        print(f"Deleting {kind} '{name}' in namespace '{namespace}'")
        try:
            return resource_client.delete(name=name, namespace=namespace)
        except ApiException as e:
            raise Exception(json.loads(e.body) if e.body  else str(e))
        except Exception as e:
            raise e
    
    def edit_resource(self, resource: dict, modify_fn):
        """
        Retrieve, apply modify_fn, then patch the resource.
        :param modify_fn: Function(resource_dict) -> modified_dict
        """
        api_version = resource['apiVersion']
        kind = resource['kind']
        name = resource['metadata']['name']
        namespace = resource['metadata'].get('namespace', 'default')

        resource_client = self.dyn_client.resources.get(api_version=api_version, kind=kind)
        current = resource_client.get(name=name, namespace=namespace).to_dict()
        modified = modify_fn(current)
        return resource_client.patch(name=name, namespace=namespace, body=modified,content_type='application/merge-patch+json')
    
    def run_op(self, resource: dict, op_name: str, kind: str, data: dict):
        """
        Look up a registered operation and apply it via edit_resource.
        :param op_name: The key under which a factory was registered.
        :param kwargs: Arguments for the factory to build the modify_fn.
        """
        print(op_name,data)
        if op_name == "__init__":
            raise ValueError("Operation name must be registered")
        patch_registry = self._registry.get("PatchRegistry")
        if op_name not in self.list_operations():
            raise KeyError(f"Operation '{op_name}' is not registered")
        if kind not in self.get_supported_operations(op_name):
            raise KeyError(f"Operation '{op_name}' is not registered for kind '{kind}'")
        modify_fn = getattr(patch_registry, op_name)(data)
        return self.edit_resource(resource, modify_fn)
    
    def get_supported_operations(self,op_name: str):
        """
        Get the supported operations for a given operation name.
        """
        return supported_mapping_types.get(op_name, [])
    
    def list_operations(self):
        """
        List all registered operations.
        """
        methods = list(get_class_methods(PatchRegistry))
        methods.remove("__init__")
        return methods
    
    def handle_manifest(self, menifest: dict, action: str, **kwargs):
        """
        YAML manifest (parsed into a dictionary) apply/delete/patch each document.
        :menifest Dict: YAML manifest parsed into a dictionary.
        :param action: 'apply', 'delete', or registered op_name.
        :param kwargs: Parameters for patch operations (if action is not apply/delete).
        """

        kind = menifest.get('kind', '<Unknown>')
        name = menifest.get('metadata', {}).get('name', '<no-name>')
        
        if action == 'apply':
            print(f"Applying {kind}/{name}")
            self.apply_resource(menifest)
        elif action == 'delete':
            print(f"Deleting {kind}/{name}")
            self.delete_resource(menifest)
        else:
            print(f"Patching {kind}/{name} via '{action}' with {kwargs}")
            self.run_op(menifest, action, kind, **kwargs)

    # Cluster Operations
    def get_cluster_info(self) -> ClusterInfo:
        """Get comprehensive information about the cluster"""
        return self.cluster_ops.get_cluster_info() 
    
    def get_cluster_metrics(self):
        """Get comprehensive information about the cluster"""
        return self.cluster_ops.get_cluster_metrics() 

    def get_namespace_metrics(self, namespace: str):
        """Get resource metrics for a specific namespace"""
        return self.cluster_ops.get_namespace_metrics(namespace)