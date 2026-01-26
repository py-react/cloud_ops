import yaml
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from app.db_client.models.kubernetes_profiles.enhanced_profiles import MergeStrategy
from app.db_client.models.deployment_config.enhanced_deployment_config import CompositionStatus

class CompositionError(Exception):
    """Raised when composition fails"""
    pass

class DependencyError(CompositionError):
    """Raised when dependencies cannot be resolved"""
    pass

class ConflictError(CompositionError):
    """Raised when conflicts cannot be resolved"""
    pass

@dataclass
class YamlFragment:
    """Represents a YAML fragment from a profile"""
    profile_id: int
    profile_name: str
    profile_type: str
    yaml_content: str
    merge_strategy: MergeStrategy
    priority: int
    composition_order: int
    dependencies: List[str]
    is_enabled: bool = True

@dataclass
class CompositionResult:
    """Result of YAML composition"""
    success: bool
    composed_yaml: Optional[str]
    errors: List[str]
    warnings: List[str]
    metadata: Dict[str, Any]
    composition_time_ms: int

class YamlComposer:
    """
    Enhanced YAML composer for Kubernetes deployment modules.
    Supports multiple modules per type with intelligent merging strategies.
    """
    
    def __init__(self):
        self.fragments: List[YamlFragment] = []
        self.dependencies: Dict[str, List[str]] = {}
        self.composition_cache: Dict[str, CompositionResult] = {}
    
    def compose_deployment(self, 
                          deployment_config: Dict[str, Any],
                          container_fragments: List[YamlFragment],
                          volume_fragments: List[YamlFragment],
                          scheduling_fragments: List[YamlFragment],
                          other_fragments: List[YamlFragment] = None) -> CompositionResult:
        """
        Compose a complete deployment YAML from multiple fragments.
        
        Args:
            deployment_config: Base deployment configuration
            container_fragments: Container profile fragments
            volume_fragments: Volume profile fragments  
            scheduling_fragments: Scheduling profile fragments
            other_fragments: Other profile fragments (probes, resources, etc.)
            
        Returns:
            CompositionResult with composed YAML and metadata
        """
        import time
        start_time = time.time()
        
        try:
            # Collect and validate all fragments
            all_fragments = self._collect_fragments(
                container_fragments, volume_fragments, scheduling_fragments, other_fragments or []
            )
            
            # Validate dependencies
            dep_errors = self._validate_dependencies(all_fragments)
            if dep_errors:
                return CompositionResult(
                    success=False,
                    composed_yaml=None,
                    errors=dep_errors,
                    warnings=[],
                    metadata={"status": CompositionStatus.MISSING_DEPS},
                    composition_time_ms=int((time.time() - start_time) * 1000)
                )
            
            # Sort fragments by composition order and priority
            sorted_fragments = self._sort_fragments(all_fragments)
            
            # Create base deployment structure
            deployment_yaml = self._create_base_deployment(deployment_config)
            
            # Merge fragments by type
            composed_yaml = self._merge_fragments(sorted_fragments, deployment_yaml)
            
            # Validate final YAML
            validation_errors = self._validate_final_yaml(composed_yaml)
            if validation_errors:
                return CompositionResult(
                    success=False,
                    composed_yaml=None,
                    errors=validation_errors,
                    warnings=[],
                    metadata={"status": CompositionStatus.INVALID_YAML},
                    composition_time_ms=int((time.time() - start_time) * 1000)
                )
            
            composition_time = int((time.time() - start_time) * 1000)
            
            return CompositionResult(
                success=True,
                composed_yaml=composed_yaml,
                errors=[],
                warnings=self._detect_warnings(sorted_fragments, composed_yaml),
                metadata={
                    "status": CompositionStatus.VALID,
                    "fragment_count": len(sorted_fragments),
                    "fragment_types": list(set(f.profile_type for f in sorted_fragments))
                },
                composition_time_ms=composition_time
            )
            
        except Exception as e:
            return CompositionResult(
                success=False,
                composed_yaml=None,
                errors=[f"Composition failed: {str(e)}"],
                warnings=[],
                metadata={"status": "error"},
                composition_time_ms=int((time.time() - start_time) * 1000)
            )
    
    def _collect_fragments(self, *fragment_lists: List[YamlFragment]) -> List[YamlFragment]:
        """Collect and filter enabled fragments"""
        all_fragments = []
        for fragment_list in fragment_lists:
            all_fragments.extend([f for f in fragment_list if f.is_enabled])
        return all_fragments
    
    def _validate_dependencies(self, fragments: List[YamlFragment]) -> List[str]:
        """Validate that all dependencies are satisfied"""
        errors = []
        available_ids = {str(f.profile_id) for f in fragments}
        
        for fragment in fragments:
            for dep_id in fragment.dependencies:
                if dep_id not in available_ids:
                    errors.append(
                        f"Fragment '{fragment.profile_name}' (id: {fragment.profile_id}) "
                        f"depends on missing profile id: {dep_id}"
                    )
        
        # Check for circular dependencies
        try:
            self._check_circular_dependencies(fragments)
        except DependencyError as e:
            errors.append(str(e))
        
        return errors
    
    def _check_circular_dependencies(self, fragments: List[YamlFragment]):
        """Detect circular dependencies using depth-first search"""
        dep_graph = {str(f.profile_id): f.dependencies for f in fragments}
        visited = set()
        rec_stack = set()
        
        def dfs(node_id):
            if node_id in rec_stack:
                raise DependencyError(f"Circular dependency detected involving profile: {node_id}")
            if node_id in visited:
                return
            
            visited.add(node_id)
            rec_stack.add(node_id)
            
            for dep_id in dep_graph.get(node_id, []):
                dfs(dep_id)
            
            rec_stack.remove(node_id)
        
        for node_id in dep_graph:
            if node_id not in visited:
                dfs(node_id)
    
    def _sort_fragments(self, fragments: List[YamlFragment]) -> List[YamlFragment]:
        """Sort fragments by composition order, then priority (descending), then dependencies"""
        # Simple topological sort based on dependencies, then order by priority
        fragments.sort(key=lambda f: (f.composition_order, -f.priority))
        return fragments
    
    def _create_base_deployment(self, deployment_config: Dict[str, Any]) -> str:
        """Create the base deployment YAML structure"""
        base_deployment = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": deployment_config.get("deployment_name"),
                "namespace": deployment_config.get("namespace"),
                "labels": deployment_config.get("labels", {})
            },
            "spec": {
                "replicas": deployment_config.get("replicas", 1),
                "selector": {
                    "matchLabels": deployment_config.get("labels", {})
                },
                "template": {
                    "metadata": {
                        "labels": deployment_config.get("labels", {})
                    },
                    "spec": {
                        "containers": []
                    }
                }
            }
        }
        
        return yaml.dump(base_deployment, default_flow_style=False)
    
    def _merge_fragments(self, fragments: List[YamlFragment], base_yaml: str) -> str:
        """Merge fragments into the base YAML using their merge strategies"""
        try:
            base_data = yaml.safe_load(base_yaml) or {}
            
            # Group fragments by type for specialized merging
            container_fragments = [f for f in fragments if f.profile_type == "container"]
            volume_fragments = [f for f in fragments if f.profile_type == "volume"]
            scheduling_fragments = [f for f in fragments if f.profile_type == "scheduling"]
            other_fragments = [f for f in fragments if f.profile_type not in ["container", "volume", "scheduling"]]
            
            # Merge each type
            self._merge_container_fragments(container_fragments, base_data)
            self._merge_volume_fragments(volume_fragments, base_data)
            self._merge_scheduling_fragments(scheduling_fragments, base_data)
            self._merge_other_fragments(other_fragments, base_data)
            
            return yaml.dump(base_data, default_flow_style=False)
            
        except Exception as e:
            raise CompositionError(f"Failed to merge YAML fragments: {str(e)}")
    
    def _merge_container_fragments(self, fragments: List[YamlFragment], base_data: Dict[str, Any]):
        """Merge container fragments"""
        if not fragments:
            return
            
        containers = base_data.setdefault("spec", {}).setdefault("template", {}).setdefault("spec", {}).setdefault("containers", [])
        
        for fragment in fragments:
            try:
                fragment_data = yaml.safe_load(fragment.yaml_content)
                if fragment_data:
                    # Handle different merge strategies
                    if fragment.merge_strategy == MergeStrategy.APPEND:
                        containers.append(fragment_data)
                    elif fragment.merge_strategy == MergeStrategy.OVERRIDE:
                        containers[0] = fragment_data  # Override first container
                    elif fragment.merge_strategy == MergeStrategy.DEEP:
                        if containers:
                            containers[0] = self._deep_merge(containers[0], fragment_data)
                        else:
                            containers.append(fragment_data)
                    # SHALLOW merge just updates top-level keys
                    elif fragment.merge_strategy == MergeStrategy.SHALLOW:
                        if containers:
                            containers[0].update(fragment_data)
                        else:
                            containers.append(fragment_data)
            except Exception as e:
                raise CompositionError(f"Failed to merge container fragment '{fragment.profile_name}': {str(e)}")
    
    def _merge_volume_fragments(self, fragments: List[YamlFragment], base_data: Dict[str, Any]):
        """Merge volume fragments"""
        if not fragments:
            return
            
        volumes = base_data.setdefault("spec", {}).setdefault("template", {}).setdefault("spec", {}).setdefault("volumes", [])
        
        for fragment in fragments:
            try:
                fragment_data = yaml.safe_load(fragment.yaml_content)
                if fragment_data:
                    if isinstance(fragment_data, list):
                        volumes.extend(fragment_data)
                    else:
                        volumes.append(fragment_data)
            except Exception as e:
                raise CompositionError(f"Failed to merge volume fragment '{fragment.profile_name}': {str(e)}")
    
    def _merge_scheduling_fragments(self, fragments: List[YamlFragment], base_data: Dict[str, Any]):
        """Merge scheduling fragments"""
        if not fragments:
            return
            
        pod_spec = base_data.setdefault("spec", {}).setdefault("template", {}).setdefault("spec", {})
        
        for fragment in fragments:
            try:
                fragment_data = yaml.safe_load(fragment.yaml_content)
                if fragment_data:
                    # Merge scheduling-specific fields
                    if "nodeSelector" in fragment_data:
                        pod_spec.setdefault("nodeSelector", {}).update(fragment_data["nodeSelector"])
                    if "affinity" in fragment_data:
                        pod_spec["affinity"] = self._deep_merge(pod_spec.get("affinity", {}), fragment_data["affinity"])
                    if "tolerations" in fragment_data:
                        pod_spec.setdefault("tolerations", []).extend(fragment_data["tolerations"])
            except Exception as e:
                raise CompositionError(f"Failed to merge scheduling fragment '{fragment.profile_name}': {str(e)}")
    
    def _merge_other_fragments(self, fragments: List[YamlFragment], base_data: Dict[str, Any]):
        """Merge other types of fragments (probes, resources, etc.)"""
        pod_spec = base_data.setdefault("spec", {}).setdefault("template", {}).setdefault("spec", {})
        
        for fragment in fragments:
            try:
                fragment_data = yaml.safe_load(fragment.yaml_content)
                if fragment_data:
                    if fragment.merge_strategy == MergeStrategy.DEEP:
                        self._deep_merge_to_path(pod_spec, fragment_data, fragment.profile_type)
                    else:
                        pod_spec.update(fragment_data)
            except Exception as e:
                raise CompositionError(f"Failed to merge {fragment.profile_type} fragment '{fragment.profile_name}': {str(e)}")
    
    def _deep_merge_to_path(self, target: Dict[str, Any], source: Dict[str, Any], profile_type: str):
        """Deep merge source into target based on profile type"""
        # Determine the target path based on profile type
        if profile_type == "resource" and "containers" in target:
            # Apply resources to all containers
            for container in target["containers"]:
                if "resources" in source:
                    container.setdefault("resources", {})
                    container["resources"] = self._deep_merge(container["resources"], source["resources"])
        elif profile_type == "probe" and "containers" in target:
            # Apply probes to containers
            for container in target["containers"]:
                container.update(source)
        elif profile_type == "lifecycle" and "containers" in target:
            # Apply lifecycle to containers
            for container in target["containers"]:
                if "lifecycle" in source:
                    container["lifecycle"] = self._deep_merge(container.get("lifecycle", {}), source["lifecycle"])
        else:
            # Generic deep merge
            self._deep_merge(target, source)
    
    def _deep_merge(self, base: Dict[str, Any], merge: Dict[str, Any]) -> Dict[str, Any]:
        """Deep merge two dictionaries"""
        result = base.copy()
        
        for key, value in merge.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            elif key in result and isinstance(result[key], list) and isinstance(value, list):
                result[key] = result[key] + value
            else:
                result[key] = value
                
        return result
    
    def _validate_final_yaml(self, yaml_content: str) -> List[str]:
        """Validate the final composed YAML"""
        errors = []
        
        try:
            data = yaml.safe_load(yaml_content)
            
            # Basic Kubernetes deployment validation
            if not data:
                errors.append("Generated YAML is empty")
                return errors
            
            if "apiVersion" not in data:
                errors.append("Missing apiVersion")
            
            if "kind" not in data:
                errors.append("Missing kind")
            
            if data.get("kind") == "Deployment":
                if "spec" not in data:
                    errors.append("Deployment missing spec")
                elif "template" not in data["spec"]:
                    errors.append("Deployment missing template")
                elif "spec" not in data["spec"]["template"]:
                    errors.append("Deployment template missing spec")
                elif "containers" not in data["spec"]["template"]["spec"]:
                    errors.append("Deployment template must have at least one container")
                    
        except yaml.YAMLError as e:
            errors.append(f"Invalid YAML syntax: {str(e)}")
        
        return errors
    
    def _detect_warnings(self, fragments: List[YamlFragment], yaml_content: str) -> List[str]:
        """Detect potential issues or warnings"""
        warnings = []
        
        # Check for potential conflicts
        container_fragments = [f for f in fragments if f.profile_type == "container"]
        if len(container_fragments) > 1:
            warnings.append(f"Multiple container fragments ({len(container_fragments)}) - ensure merge strategies are correct")
        
        # Check for missing common configurations
        try:
            data = yaml.safe_load(yaml_content)
            if data and "spec" in data and "template" in data["spec"]:
                containers = data["spec"]["template"].get("spec", {}).get("containers", [])
                if containers and not any(c.get("resources") for c in containers):
                    warnings.append("No resource limits/requests specified for containers")
        except:
            pass
        
        return warnings
    
    def get_composition_hash(self, fragments: List[YamlFragment], deployment_config: Dict[str, Any]) -> str:
        """Generate a hash for the composition to enable caching"""
        # Create a deterministic string from all inputs
        hash_components = [
            str(deployment_config.get("deployment_name", "")),
            str(deployment_config.get("namespace", "")),
            str(deployment_config.get("replicas", 1))
        ]
        
        for fragment in sorted(fragments, key=lambda f: f.profile_id):
            hash_components.extend([
                str(fragment.profile_id),
                str(fragment.profile_version or "1.0.0"),
                str(fragment.composition_order),
                str(fragment.merge_strategy),
                fragment.yaml_content or ""
            ])
        
        hash_string = "|".join(hash_components)
        return hashlib.sha256(hash_string.encode()).hexdigest()[:16]