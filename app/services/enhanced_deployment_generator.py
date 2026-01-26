import yaml
from typing import Dict, Any, List, Optional

from app.services.yaml_composer import YamlComposer, YamlFragment, CompositionResult
from app.db_client.models.deployment_config.enhanced_deployment_config import (
    DeploymentConfigEnhanced, 
    DeploymentConfigContainerEnhanced, 
    DeploymentConfigVolumeEnhanced
)
from app.db_client.models.kubernetes_profiles.enhanced_profiles import (
    K8sContainerProfileEnhanced,
    K8sVolumeProfileEnhanced, 
    K8sSchedulingProfileEnhanced,
    K8sProbeProfileEnhanced,
    K8sResourceProfileEnhanced,
    K8sEnvProfileEnhanced,
    K8sLifecycleProfileEnhanced,
    MergeStrategy
)

class RuntimeDeploymentComposer:
    """
    Runtime deployment composer that generates Kubernetes manifests from composable modules.
    Composes YAML ONLY at release runtime with latest profile data.
    Does not store composition results - always uses fresh data.
    """
    
    def __init__(self):
        self.composer = YamlComposer()
    
    async def compose_deployment_at_runtime(self, 
                                           deployment_config: DeploymentConfigEnhanced,
                                           runtime_overrides: Optional[Dict[str, Any]] = None) -> CompositionResult:
        """
        Compose a complete Kubernetes deployment at runtime using latest profile data.
        
        Args:
            deployment_config: Enhanced deployment configuration with composable modules
            runtime_overrides: Runtime-specific overrides (e.g., image name, PR-specific configs)
            
        Returns:
            CompositionResult with composed YAML and metadata
        """
        
        # Collect all profile fragments with LATEST data from database
        fragments = await self._collect_all_fragments(deployment_config)
        
        # Create base deployment config with runtime overrides
        base_config = self._extract_base_config(deployment_config, runtime_overrides)
        
        # Group fragments by type for composition
        container_fragments = [f for f in fragments if f.profile_type == "container"]
        volume_fragments = [f for f in fragments if f.profile_type == "volume"]
        scheduling_fragments = [f for f in fragments if f.profile_type == "scheduling"]
        other_fragments = [f for f in fragments if f.profile_type not in ["container", "volume", "scheduling"]]
        
        # Compose deployment with latest data
        result = self.composer.compose_deployment(
            deployment_config=base_config,
            container_fragments=container_fragments,
            volume_fragments=volume_fragments,
            scheduling_fragments=scheduling_fragments,
            other_fragments=other_fragments
        )
        
        # Apply runtime-specific modifications to composed YAML
        if result.success and runtime_overrides and result.composed_yaml:
            result.composed_yaml = self._apply_runtime_overrides(result.composed_yaml, runtime_overrides)
        
        return result
    
    async def _collect_all_fragments(self, deployment_config: DeploymentConfigEnhanced) -> List[YamlFragment]:
        """Collect YAML fragments from all linked profiles, always fetching latest data"""
        fragments = []
        
        # Container fragments (multiple containers supported)
        if deployment_config.containers:
            for container_mapping in deployment_config.containers:
                if (isinstance(container_mapping, DeploymentConfigContainerEnhanced) and 
                    container_mapping.is_enabled and 
                    container_mapping.container_profile_id):
                    container_profile = await self._get_latest_container_profile(container_mapping.container_profile_id)
                    if container_profile and container_profile.is_active:
                        fragment = self._create_container_fragment(container_profile, container_mapping)
                        fragments.append(fragment)
        
        # Volume fragments (multiple volumes supported)
        if deployment_config.volumes:
            for volume_mapping in deployment_config.volumes:
                if (isinstance(volume_mapping, DeploymentConfigVolumeEnhanced) and 
                    volume_mapping.is_enabled and 
                    volume_mapping.volume_profile_id):
                    volume_profile = await self._get_latest_volume_profile(volume_mapping.volume_profile_id)
                    if volume_profile and volume_profile.is_active:
                        fragment = self._create_volume_fragment(volume_profile, volume_mapping)
                        fragments.append(fragment)
        
        # Scheduling fragments (multiple supported)
        if deployment_config.scheduling_profile_ids:
            for sched_id in deployment_config.scheduling_profile_ids:
                if sched_id:
                    sched_profile = await self._get_latest_scheduling_profile(sched_id)
                    if sched_profile and sched_profile.is_active:
                        fragment = self._create_scheduling_fragment(sched_profile)
                        fragments.append(fragment)
        
        return fragments
    
    def _create_container_fragment(self, 
                                  profile: K8sContainerProfileEnhanced,
                                  mapping: DeploymentConfigContainerEnhanced) -> YamlFragment:
        """Create a YAML fragment from latest container profile data"""
        
        # Generate container YAML from profile (latest data)
        container_spec = {
            "name": profile.container_name,
            "image": profile.image,  # This will be overridden at runtime with actual image
            "imagePullPolicy": profile.image_pull_policy
        }
        
        # Add optional fields if present
        if profile.command:
            container_spec["command"] = profile.command
        if profile.args:
            container_spec["args"] = profile.args
        if profile.working_dir:
            container_spec["workingDir"] = profile.working_dir
        if profile.ports:
            container_spec["ports"] = profile.ports
        if profile.volume_mounts:
            container_spec["volumeMounts"] = profile.volume_mounts
        if profile.security_context:
            container_spec["securityContext"] = profile.security_context
        
        # Use profile's YAML fragment if available, otherwise generate
        yaml_content = profile.yaml_fragment or yaml.dump(container_spec, default_flow_style=False)
        
        return YamlFragment(
            profile_id=profile.id if profile.id is not None else 0,
            profile_name=profile.name,
            profile_type="container",
            yaml_content=yaml_content,
            merge_strategy=profile.merge_strategy,
            priority=mapping.merge_priority or profile.priority,
            composition_order=mapping.composition_order,
            dependencies=profile.dependencies or [],
            is_enabled=mapping.is_enabled
        )
    
    def _create_volume_fragment(self, 
                               profile: K8sVolumeProfileEnhanced,
                               mapping: DeploymentConfigVolumeEnhanced) -> YamlFragment:
        """Create a YAML fragment from latest volume profile data"""
        
        volume_spec = {
            "name": profile.volume_name,
            **profile.volume_config
        }
        
        yaml_content = profile.yaml_fragment or yaml.dump(volume_spec, default_flow_style=False)
        
        return YamlFragment(
            profile_id=profile.id if profile.id is not None else 0,
            profile_name=profile.name,
            profile_type="volume", 
            yaml_content=yaml_content,
            merge_strategy=profile.merge_strategy,
            priority=mapping.merge_priority or profile.priority,
            composition_order=mapping.composition_order,
            dependencies=profile.dependencies or [],
            is_enabled=mapping.is_enabled
        )
    
    def _create_scheduling_fragment(self, profile: K8sSchedulingProfileEnhanced) -> YamlFragment:
        """Create a YAML fragment from latest scheduling profile data"""
        
        scheduling_spec = {}
        if profile.node_selector:
            scheduling_spec["nodeSelector"] = profile.node_selector
        if profile.affinity:
            scheduling_spec["affinity"] = profile.affinity
        if profile.tolerations:
            scheduling_spec["tolerations"] = profile.tolerations
        
        yaml_content = profile.yaml_fragment or yaml.dump(scheduling_spec, default_flow_style=False)
        
        return YamlFragment(
            profile_id=profile.id if profile.id is not None else 0,
            profile_name=profile.name,
            profile_type="scheduling",
            yaml_content=yaml_content,
            merge_strategy=profile.merge_strategy,
            priority=profile.priority,
            composition_order=0,  # Scheduling typically applied after basic structure
            dependencies=profile.dependencies or []
        )
    
    def _extract_base_config(self, 
                              deployment_config: DeploymentConfigEnhanced,
                              runtime_overrides: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Extract base deployment configuration with runtime overrides"""
        base_config = {
            "deployment_name": deployment_config.deployment_name,
            "namespace": deployment_config.namespace,
            "replicas": deployment_config.replicas,
            "labels": deployment_config.labels or {},
            "annotations": deployment_config.annotations or {}
        }
        
        # Apply runtime overrides to base config
        if runtime_overrides:
            if "replicas" in runtime_overrides:
                base_config["replicas"] = runtime_overrides["replicas"]
            if "labels" in runtime_overrides:
                base_config["labels"].update(runtime_overrides["labels"])
            if "annotations" in runtime_overrides:
                base_config["annotations"].update(runtime_overrides["annotations"])
        
        return base_config
    
    def _apply_runtime_overrides(self, 
                                 composed_yaml: str,
                                 runtime_overrides: Dict[str, Any]) -> str:
        """Apply runtime-specific overrides to composed YAML"""
        if not runtime_overrides:
            return composed_yaml
        
        try:
            deployment_data = yaml.safe_load(composed_yaml)
            
            # Override images for all containers (common use case)
            if "image" in runtime_overrides:
                containers = deployment_data.get("spec", {}).get("template", {}).get("spec", {}).get("containers", [])
                for container in containers:
                    container["image"] = runtime_overrides["image"]
            
            # Apply other runtime overrides
            if "env_overrides" in runtime_overrides:
                containers = deployment_data.get("spec", {}).get("template", {}).get("spec", {}).get("containers", [])
                for container in containers:
                    env_vars = container.setdefault("env", [])
                    for env_override in runtime_overrides["env_overrides"]:
                        # Update existing env var or add new one
                        for env in env_vars:
                            if env.get("name") == env_override["name"]:
                                env["value"] = env_override["value"]
                                break
                        else:
                            env_vars.append(env_override)
            
            return yaml.dump(deployment_data, default_flow_style=False)
            
        except Exception as e:
            # If runtime overrides fail, return original YAML
            print(f"Warning: Failed to apply runtime overrides: {str(e)}")
            return composed_yaml
    
    # Latest data getter methods (always fetch fresh data)
    async def _get_latest_container_profile(self, profile_id: int) -> Optional[K8sContainerProfileEnhanced]:
        """Get the latest version of container profile from database"""
        # TODO: Implement database query that fetches latest version
        # This should always query the database to get current state
        return None
    
    async def _get_latest_volume_profile(self, profile_id: int) -> Optional[K8sVolumeProfileEnhanced]:
        """Get the latest version of volume profile from database"""
        # TODO: Implement database query that fetches latest version
        return None
    
    async def _get_latest_scheduling_profile(self, profile_id: int) -> Optional[K8sSchedulingProfileEnhanced]:
        """Get the latest version of scheduling profile from database"""
        # TODO: Implement database query that fetches latest version  
        return None


# Legacy compatibility wrapper
class EnhancedDeploymentGenerator(RuntimeDeploymentComposer):
    """
    Backward compatible wrapper for existing deployment generation system.
    """
    pass