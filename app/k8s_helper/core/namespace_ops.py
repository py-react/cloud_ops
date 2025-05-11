from typing import Dict, List, Optional, Any
from kubernetes import client

class NamespaceOperations:
    """Class containing namespace-related operations"""
    
    def __init__(self, core_api: client.CoreV1Api, resource_helper):
        self.core_api = core_api
        self.resource_helper = resource_helper

    def get_namespaces(self, label_selector: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all namespaces in the cluster
        
        Args:
            label_selector: Label selector to filter namespaces
            
        Returns:
            List of namespace details
        """
        try:
            response = self.core_api.list_namespace(label_selector=label_selector)
            return [self._convert_to_dict(ns) for ns in response.items]
        except Exception as e:
            raise Exception(f"Error fetching namespaces: {str(e)}")

    def get_namespace_details(self, namespace: str) -> Dict[str, Any]:
        """
        Get detailed information about a specific namespace
        
        Args:
            namespace: Name of the namespace
            
        Returns:
            Dictionary containing namespace details and resource counts
        """
        try:
            # Get namespace object
            ns_obj = self.core_api.read_namespace(namespace)
            ns_dict = self._convert_to_dict(ns_obj)
            
            # Get resource counts
            resource_counts = {
                'pods': len(self.resource_helper.get_resource_details('pods', namespace=namespace)),
                'services': len(self.resource_helper.get_resource_details('services', namespace=namespace)),
                'deployments': len(self.resource_helper.get_resource_details('deployments', namespace=namespace)),
                'configmaps': len(self.resource_helper.get_resource_details('configmaps', namespace=namespace)),
                'secrets': len(self.resource_helper.get_resource_details('secrets', namespace=namespace)),
            }
            
            ns_dict['resource_counts'] = resource_counts
            return ns_dict
            
        except client.rest.ApiException as e:
            if e.status == 404:
                raise ValueError(f"Namespace {namespace} not found")
            raise Exception(f"Error fetching namespace details: {str(e)}")

    def create_namespace(self, name: str, labels: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Create a new namespace
        
        Args:
            name: Name of the namespace
            labels: Optional labels to apply to the namespace
            
        Returns:
            Dictionary containing the created namespace details
        """
        try:
            metadata = client.V1ObjectMeta(name=name)
            if labels:
                metadata.labels = labels
                
            namespace = client.V1Namespace(metadata=metadata)
            response = self.core_api.create_namespace(namespace)
            return self._convert_to_dict(response)
            
        except client.rest.ApiException as e:
            if e.status == 409:
                raise ValueError(f"Namespace {name} already exists")
            raise Exception(f"Error creating namespace: {str(e)}")

    def delete_namespace(self, name: str) -> None:
        """
        Delete a namespace and all resources in it
        
        Args:
            name: Name of the namespace to delete
        """
        try:
            self.core_api.delete_namespace(name)
        except client.rest.ApiException as e:
            if e.status == 404:
                raise ValueError(f"Namespace {name} not found")
            raise Exception(f"Error deleting namespace: {str(e)}")

    def _convert_to_dict(self, obj: Any) -> Dict[str, Any]:
        """Convert Kubernetes object to dictionary"""
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        return obj 