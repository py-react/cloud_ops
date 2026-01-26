from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.services.enhanced_deployment_generator import RuntimeDeploymentComposer
from app.db_client.models.deployment_config.enhanced_deployment_config import DeploymentConfigEnhanced

router = APIRouter(prefix="/api/integration/kubernetes/composition", tags=["composition"])

class CompositionPreviewRequest(BaseModel):
    """Request model for composition preview"""
    container_profile_ids: List[str]
    volume_profile_ids: Optional[List[str]] = None
    scheduling_profile_ids: Optional[List[str]] = None
    other_profile_ids: Optional[Dict[str, List[str]]] = None  # profile_type -> ids
    deployment_config: Dict[str, Any]

class CompositionPreviewResponse(BaseModel):
    """Response model for composition preview"""
    success: bool
    composed_yaml: Optional[str]
    errors: List[str]
    warnings: List[str]
    metadata: Dict[str, Any]
    composition_time_ms: int

@router.post("/preview", response_model=CompositionPreviewResponse)
async def preview_composition(request: CompositionPreviewRequest):
    """
    Preview the composition of multiple profiles without saving.
    This endpoint allows users to see what the final YAML would look like
    when multiple profiles are composed together.
    """
    try:
        # Initialize composer
        composer = RuntimeDeploymentComposer()
        
        # Create a temporary deployment config for preview
        temp_deployment_config = DeploymentConfigEnhanced(
            deployment_name=request.deployment_config.get("deployment_name", "preview-deployment"),
            namespace=request.deployment_config.get("namespace", "default"),
            replicas=request.deployment_config.get("replicas", 1),
            labels=request.deployment_config.get("labels", {}),
            annotations=request.deployment_config.get("annotations", {}),
            type="web-app",
            tag="preview",
            code_source_control_name="preview",
            deployment_strategy_id=1,
            # Set the profile IDs for composition
            container_profile_ids=request.container_profile_ids,
            volume_profile_ids=request.volume_profile_ids,
            scheduling_profile_ids=request.scheduling_profile_ids
        )
        
        # Add mock relationship mappings for demonstration
        # In real implementation, this would come from database
        from app.db_client.models.deployment_config.enhanced_deployment_config import (
            DeploymentConfigContainerEnhanced,
            DeploymentConfigVolumeEnhanced
        )
        
        # Create mock container mappings
        temp_deployment_config.containers = [
            DeploymentConfigContainerEnhanced(
                container_profile_id=int(pid),
                composition_order=idx,
                is_enabled=True,
                merge_priority=100
            )
            for idx, pid in enumerate(request.container_profile_ids)
        ]
        
        if request.volume_profile_ids:
            temp_deployment_config.volumes = [
                DeploymentConfigVolumeEnhanced(
                    volume_profile_id=int(pid),
                    composition_order=idx,
                    is_enabled=True,
                    merge_priority=100
                )
                for idx, pid in enumerate(request.volume_profile_ids)
            ]
        
        # Compose at runtime
        result = await composer.compose_deployment_at_runtime(
            deployment_config=temp_deployment_config,
            runtime_overrides=request.deployment_config.get("runtime_overrides")
        )
        
        return CompositionPreviewResponse(
            success=result.success,
            composed_yaml=result.composed_yaml,
            errors=result.errors,
            warnings=result.warnings,
            metadata=result.metadata,
            composition_time_ms=result.composition_time_ms
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Composition preview failed: {str(e)}"
        )

@router.get("/strategies")
async def get_merge_strategies():
    """Get available merge strategies for composition"""
    return {
        "strategies": [
            {
                "value": "deep",
                "label": "Deep Merge",
                "description": "Recursively merge objects, combine arrays"
            },
            {
                "value": "shallow", 
                "label": "Shallow Merge",
                "description": "Only merge top-level keys"
            },
            {
                "value": "override",
                "label": "Override",
                "description": "Replace existing values completely"
            },
            {
                "value": "append",
                "label": "Append",
                "description": "Add to existing arrays and objects"
            }
        ]
    }

@router.get("/conflict-resolution")
async def get_conflict_resolution_strategies():
    """Get strategies for resolving conflicts between profiles"""
    return {
        "strategies": [
            {
                "value": "priority_based",
                "label": "Priority Based",
                "description": "Higher priority profiles win conflicts"
            },
            {
                "value": "order_based",
                "label": "Order Based", 
                "description": "Later applied profiles win conflicts"
            },
            {
                "value": "manual",
                "label": "Manual Resolution",
                "description": "User must resolve conflicts manually"
            }
        ]
    }

@router.post("/validate")
async def validate_composition(request: CompositionPreviewRequest):
    """
    Validate a composition without generating the full YAML.
    Returns potential conflicts, missing dependencies, and validation errors.
    """
    try:
        # TODO: Implement validation logic
        # This would check for:
        # - Missing dependencies
        # - Port conflicts between containers
        # - Volume mount validation
        # - Resource limit conflicts
        # - Duplicate container names
        
        return {
            "valid": True,
            "conflicts": [],
            "missing_dependencies": [],
            "validation_errors": [],
            "warnings": []
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Validation failed: {str(e)}"
        )