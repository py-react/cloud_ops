from typing import Dict, List, Optional, Any, Tuple
from kubernetes import client, dynamic
from kubernetes.dynamic.exceptions import ResourceNotFoundError
from ..models.resources import ResourceInfo, ResourceScope

class ResourceOperations:
    """Class containing resource-related operations"""
    
    def __init__(self, api_client: client.ApiClient, apps_api: Optional[client.AppsV1Api] = None,
                 networking_api: Optional[client.NetworkingV1Api] = None,
                 rbac_api: Optional[client.RbacAuthorizationV1Api] = None):
        """
        Initialize with API clients
        
        Args:
            api_client: Base Kubernetes API client
            apps_api: Optional AppsV1Api client
            networking_api: Optional NetworkingV1Api client
            rbac_api: Optional RbacAuthorizationV1Api client
        """
        self.api_client = api_client
        self.dynamic_client = dynamic.DynamicClient(api_client)
        
        # Keep specialized API clients for specific operations
        self.core_api = client.CoreV1Api(api_client)
        self.apps_api = apps_api or client.AppsV1Api(api_client)
        self.networking_api = networking_api or client.NetworkingV1Api(api_client)
        self.rbac_api = rbac_api or client.RbacAuthorizationV1Api(api_client)

        # Cache for API resources and versions
        self._api_resources_cache = None
        self._preferred_versions_cache = None

    def get_api_resources(self, scope: ResourceScope = ResourceScope.ALL) -> List[ResourceInfo]:
        """
        Get list of available API resources
        
        Args:
            scope: Filter resources by scope (namespaced/cluster/all)
            
        Returns:
            List of ResourceInfo objects
        """
        api_resources = []
        try:
            # Get API groups
            api_groups = self.api_client.call_api(
                '/apis',
                'GET',
                response_type=object,
                async_req=True
            ).get()[0]
            
            # Add core API (v1) resources
            core_api_resources = self.api_client.call_api(
                '/api/v1',
                'GET',
                response_type=object,
                async_req=True
            ).get()[0]

            api_resources.extend(self._process_api_resources(core_api_resources, "v1"))
            
            # Process each API group
            for group in api_groups.get('groups', []):
                group_version = group['preferredVersion']['groupVersion']
                try:
                    group_resources = self.api_client.call_api(
                        f'/apis/{group_version}',
                        'GET',
                        response_type=object,
                        async_req=True
                    ).get()[0]
                
                    api_resources.extend(self._process_api_resources(group_resources, group_version))
                except Exception as e:
                    raise Exception(f"Unable to fetch group_resources for group_version: {group_version}")
            
            # Filter by scope if specified
            if scope != ResourceScope.ALL:
                is_namespaced = scope == ResourceScope.NAMESPACED
                api_resources = [r for r in api_resources if r.namespaced == is_namespaced]
        except Exception as e:
            raise Exception(e)
                
        return api_resources

    def get_resource_details(self, resource_type: str, namespace: Optional[str] = None,
                           field_selector: Optional[str] = None,
                           label_selector: Optional[str] = None,
                           api_version: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get details of specific resources using dynamic client
        
        Args:
            resource_type: Type of resource (e.g., 'pods', 'services', 'clusterroles')
            namespace: Namespace to look in (None for cluster-wide resources)
            field_selector: Selector to filter by fields
            label_selector: Selector to filter by labels
            api_version: Optional API version override (e.g., 'v1', 'apps/v1')
            
        Returns:
            List of resource details
            
        Raises:
            ValueError: If resource type is not found
            Exception: For other API errors
        """
        tried_versions = set()
        last_error = None
        versions_to_try, discovered_kind = self._get_all_versions_for_resource(resource_type)

        # Try with provided version first if specified
        if api_version:
            versions_to_try = [api_version]

        for version in versions_to_try:
            if version in tried_versions:
                continue
            tried_versions.add(version)
            
            try:
                # Try with the discovered kind if available
                if discovered_kind:
                    try:
                        resource = self.dynamic_client.resources.get(
                            api_version=version,
                            kind=discovered_kind,
                        )
                    except ResourceNotFoundError as e:
                        print(f"DEBUG: Resource not found with discovered kind: {str(e)}")
                        continue
                else:
                    # Fallback to computing kind if not discovered
                    computed_kind = self._get_kind_from_resource(resource_type)
                    try:
                        resource = self.dynamic_client.resources.get(
                            api_version=version,
                            kind=computed_kind
                        )
                    except ResourceNotFoundError as e:
                        print(f"DEBUG: Resource not found with computed kind: {str(e)}")
                        continue

                # Prepare query parameters
                params = {}
                if field_selector:
                    params['field_selector'] = field_selector
                if label_selector:
                    params['label_selector'] = label_selector


                # Get resources based on namespace scope
                if namespace and resource.namespaced:
                    response = resource.get(namespace=namespace, **params)
                else:
                    response = resource.get(**params)
                return [self._convert_to_dict(item) for item in response.items]

            except ResourceNotFoundError as e:
                print(f"DEBUG: ResourceNotFoundError: {str(e)}")
                last_error = f"Resource type {resource_type} not found with API version {version}"
                continue
            except Exception as e:
                print(f"DEBUG: Unexpected error: {str(e)}")
                if "API version" in str(e) or "version not found" in str(e).lower():
                    last_error = str(e)
                    continue
                raise

        # If we get here, none of the versions worked
        error_msg = f"Could not find valid API version for {resource_type}. Last error: {last_error}. Tried versions: {', '.join(tried_versions)}"
        print(f"DEBUG: Final error: {error_msg}")
        raise ValueError(error_msg)

    def _get_all_versions_for_resource(self, resource_type: str) -> Tuple[List[str], Optional[str]]:
        """
        Get all available API versions for a resource type, sorted by preference
        
        Args:
            resource_type: The resource type to look up
            
        Returns:
            Tuple of (List of API versions sorted by preference, Kind if found)
        """
        versions = []
        kind = None
        resources_map = self._discover_api_resources()
        if resource_type in resources_map:
            # Get all versions and sort them by preference
            resource_versions = resources_map[resource_type]
            
            # Sort versions by preference
            sorted_versions = sorted(
                resource_versions,
                key=lambda x: self._get_version_preference(x[1]),
                reverse=True
            )
            # Get the kind from the most preferred version
            if sorted_versions:
                kind = sorted_versions[0][2]
            
            # Convert to full version strings
            versions = [
                f"{group}/{version}" if group else version
                for group, version, _ in sorted_versions
            ]
        # Add fallback versions if they're not already included
        fallback_versions = {
            # Core API (v1)
            'bindings': ['v1'],
            'componentstatuses': ['v1'],
            'configmaps': ['v1'],
            'endpoints': ['v1'],
            'events': ['v1'],
            'limitranges': ['v1'],
            'namespaces': ['v1'],
            'nodes': ['v1'],
            'persistentvolumeclaims': ['v1'],
            'persistentvolumes': ['v1'],
            'pods': ['v1'],
            'podtemplates': ['v1'],
            'replicationcontrollers': ['v1'],
            'resourcequotas': ['v1'],
            'secrets': ['v1'],
            'serviceaccounts': ['v1'],
            'services': ['v1'],

            # Admission Registration
            'mutatingwebhookconfigurations': ['admissionregistration.k8s.io/v1'],
            'validatingadmissionpolicies': ['admissionregistration.k8s.io/v1'],
            'validatingadmissionpolicybindings': ['admissionregistration.k8s.io/v1'],
            'validatingwebhookconfigurations': ['admissionregistration.k8s.io/v1'],

            # API Extensions & Registration
            'customresourcedefinitions': ['apiextensions.k8s.io/v1'],
            'apiservices': ['apiregistration.k8s.io/v1'],

            # Apps
            'controllerrevisions': ['apps/v1'],
            'daemonsets': ['apps/v1'],
            'deployments': ['apps/v1'],
            'replicasets': ['apps/v1'],
            'statefulsets': ['apps/v1'],

            # Authentication
            'selfsubjectreviews': ['authentication.k8s.io/v1'],
            'tokenreviews': ['authentication.k8s.io/v1'],

            # Authorization
            'localsubjectaccessreviews': ['authorization.k8s.io/v1'],
            'selfsubjectaccessreviews': ['authorization.k8s.io/v1'],
            'selfsubjectrulesreviews': ['authorization.k8s.io/v1'],
            'subjectaccessreviews': ['authorization.k8s.io/v1'],

            # Autoscaling
            'horizontalpodautoscalers': ['autoscaling/v2'],

            # Batch
            'cronjobs': ['batch/v1'],
            'jobs': ['batch/v1'],

            # Certificates
            'certificatesigningrequests': ['certificates.k8s.io/v1'],

            # Coordination
            'leases': ['coordination.k8s.io/v1'],

            # Discovery
            'endpointslices': ['discovery.k8s.io/v1'],

            # Events
            'events': ['events.k8s.io/v1'],

            # Flow Control
            'flowschemas': ['flowcontrol.apiserver.k8s.io/v1'],
            'prioritylevelconfigurations': ['flowcontrol.apiserver.k8s.io/v1'],

            # MetalLB
            'bfdprofiles': ['metallb.io/v1beta1'],
            'bgpadvertisements': ['metallb.io/v1beta1'],
            'bgppeers': ['metallb.io/v1beta2'],
            'communities': ['metallb.io/v1beta1'],
            'ipaddresspools': ['metallb.io/v1beta1'],
            'l2advertisements': ['metallb.io/v1beta1'],
            'servicel2statuses': ['metallb.io/v1beta1'],

            # Metrics
            'nodes': ['metrics.k8s.io/v1beta1'],
            'pods': ['metrics.k8s.io/v1beta1'],

            # Networking
            'ingressclasses': ['networking.k8s.io/v1'],
            'ingresses': ['networking.k8s.io/v1'],
            'networkpolicies': ['networking.k8s.io/v1'],

            # Node
            'runtimeclasses': ['node.k8s.io/v1'],

            # Policy
            'poddisruptionbudgets': ['policy/v1'],

            # RBAC
            'clusterrolebindings': ['rbac.authorization.k8s.io/v1'],
            'clusterroles': ['rbac.authorization.k8s.io/v1'],
            'rolebindings': ['rbac.authorization.k8s.io/v1'],
            'roles': ['rbac.authorization.k8s.io/v1'],

            # Scheduling
            'priorityclasses': ['scheduling.k8s.io/v1'],

            # Storage
            'csidrivers': ['storage.k8s.io/v1'],
            'csinodes': ['storage.k8s.io/v1'],
            'csistoragecapacities': ['storage.k8s.io/v1'],
            'storageclasses': ['storage.k8s.io/v1'],
            'volumeattachments': ['storage.k8s.io/v1']
        }
        
        if resource_type in fallback_versions:
            for version in fallback_versions[resource_type]:
                if version not in versions:
                    versions.append(version)
        
        # Always add v1 as last resort if no other versions found
        if not versions:
            versions.append('v1')
            
        return versions, kind

    def _get_version_preference(self, version: str) -> int:
        """
        Get preference value for an API version
        
        Args:
            version: Version string (e.g., 'v1', 'v1beta1')
            
        Returns:
            Preference value (higher is more preferred)
        """
        if version.startswith('v') and version[1].isdigit():
            base_version = int(version[1])
            if version == f'v{base_version}':  # GA version
                return base_version * 100
            elif version.startswith(f'v{base_version}beta'):  # Beta version
                try:
                    beta_num = int(version[len(f'v{base_version}beta'):])
                    return (base_version * 100) - (10 + beta_num)
                except ValueError:
                    return (base_version * 100) - 20
            elif version.startswith(f'v{base_version}alpha'):  # Alpha version
                try:
                    alpha_num = int(version[len(f'v{base_version}alpha'):])
                    return (base_version * 100) - (30 + alpha_num)
                except ValueError:
                    return (base_version * 100) - 40
        return 0

    def _discover_api_resources(self) -> Dict[str, List[Tuple[str, str, str]]]:
        """
        Discover all available API resources and their versions
        
        Returns:
            Dictionary mapping resource names to list of (group, version, kind) tuples
        """
        if self._api_resources_cache is not None:
            return self._api_resources_cache

        resources_map = {}

        # Get core API (v1) resources
        try:
            core_api_resources = self.api_client.call_api(
                '/api/v1',
                'GET',
                response_type=object,
                async_req=True
            ).get()[0]
            
            for resource in core_api_resources.get('resources', []):
                name = resource.get('name', '')
                if '/' not in name:  # Skip subresources
                    resources_map[name] = [('', 'v1', resource.get('kind', ''))]
        except Exception as e:
            print(f"Warning: Error fetching core API resources: {e}")

        # Get API groups and their resources
        try:
            api_groups = self.api_client.call_api(
                '/apis',
                'GET',
                response_type=object,
                async_req=True
            ).get()[0]
            
            for group in api_groups.get('groups', []):
                group_name = group.get('name', '')
                # Get all versions for the group
                for version_info in group.get('versions', []):
                    version = version_info.get('version', '')
                    group_version = f"{group_name}/{version}"
                    
                    try:
                        group_resources = self.api_client.call_api(
                            f'/apis/{group_version}',
                            'GET',
                            response_type=object,
                            async_req=True
                        ).get()[0]
                        
                        for resource in group_resources.get('resources', []):
                            name = resource.get('name', '')
                            if '/' not in name:  # Skip subresources
                                if name not in resources_map:
                                    resources_map[name] = []
                                resources_map[name].append((group_name, version, resource.get('kind', '')))
                    except Exception:
                        # Skip if can't access this API group version
                        continue
        except Exception as e:
            print(f"Warning: Error fetching API groups: {e}")

        self._api_resources_cache = resources_map
        return resources_map

    def _get_kind_from_resource(self, resource_type: str) -> str:
        """
        Convert resource type to Kind
        
        Args:
            resource_type: The resource type (e.g., 'pods', 'services')
            
        Returns:
            The Kind name (e.g., 'Pod', 'Service')
        """
        # Split by any non-alphanumeric characters
        parts = [part for part in resource_type.split() if part]
        if not parts:
            parts = [''.join(c if c.isalnum() else ' ' for c in resource_type).split()]
            parts = [p for p in parts[0] if p]
            
        # Make singular by removing trailing 's'
        if parts[-1].endswith('s'):
            parts[-1] = parts[-1][:-1]
            
        # Capitalize each part
        parts = [part.capitalize() for part in parts]
        
        # Join back together
        return ''.join(parts)

    def _process_api_resources(self, api_data: Dict, group_version: str) -> List[ResourceInfo]:
        """Process API resources from raw API data"""
        resources = []
        for resource in api_data.get('resources', []):
            # Skip subresources (contains '/')
            if '/' in resource.get('name', ''):
                continue
                
            resources.append(ResourceInfo(
                name=resource['name'],
                kind=resource['kind'],
                namespaced=resource.get('namespaced', False),
                api_version=group_version,
                short_names=resource.get('shortNames', [])
            ))
        return resources

    def _convert_to_dict(self, obj: Any) -> Dict[str, Any]:
        """Convert Kubernetes object to dictionary"""
        if hasattr(obj, 'to_dict'):
            return obj.to_dict()
        if hasattr(obj, 'dict'):
            return obj.dict()
        return obj 

    def clear_cache(self) -> None:
        """Clear the API resources and versions cache"""
        self._api_resources_cache = None
        self._preferred_versions_cache = None 