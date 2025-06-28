from typing import Dict, Any, Optional
from kubernetes import client
from ..core.resource_ops import ResourceOperations

class StrategyHandler:
    """Handles different deployment strategies and their configurations"""
    
    STRATEGY_CONFIGS = {
        "rolling": {
            "type": "RollingUpdate",
            "config": {
                "maxSurge": "25%",
                "maxUnavailable": "25%"
            }
        },
        "recreate": {
            "type": "Recreate",
            "config": {}
        },
        "blue-green": {
            "type": "RollingUpdate",
            "config": {
                "maxSurge": "100%",
                "maxUnavailable": 0
            }
        },
        "canary": {
            "type": "RollingUpdate",
            "config": {
                "maxSurge": "20%",
                "maxUnavailable": 0
            }
        }
    }

    @classmethod
    def get_strategy_config(cls, strategy_id: int) -> Dict[str, Any]:
        """
        Get the deployment strategy configuration based on the strategy ID
        
        Args:
            strategy_id: The ID of the deployment strategy
            
        Returns:
            Dictionary containing strategy configuration
        """
        strategy_map = {
            1: "rolling",
            2: "blue-green",
            3: "canary",
            4: "recreate"
        }
        
        strategy_type = strategy_map.get(strategy_id)
        if not strategy_type:
            raise ValueError(f"Invalid strategy ID: {strategy_id}")
            
        return cls.STRATEGY_CONFIGS[strategy_type]

    @classmethod
    def apply_strategy(cls, deployment_spec: Dict[str, Any], strategy_id: int) -> Dict[str, Any]:
        """
        Apply the deployment strategy configuration to the deployment spec
        
        Args:
            deployment_spec: The deployment specification dictionary
            strategy_id: The ID of the deployment strategy to apply
            
        Returns:
            Updated deployment specification with strategy applied
        """
        strategy_config = cls.get_strategy_config(strategy_id)
        
        # Ensure 'spec' exists
        if "spec" not in deployment_spec:
            deployment_spec["spec"] = {}

        # Apply strategy configuration under 'spec'
        deployment_spec["spec"]["strategy"] = {
            "type": strategy_config["type"],
            "rollingUpdate": strategy_config["config"] if strategy_config["type"] == "RollingUpdate" else None
        }
        
        # For blue-green deployments, add necessary labels
        if strategy_id == 2:  # blue-green
            if "metadata" not in deployment_spec:
                deployment_spec["metadata"] = {}
            if "labels" not in deployment_spec["metadata"]:
                deployment_spec["metadata"]["labels"] = {}
            deployment_spec["metadata"]["labels"]["version"] = "blue"
            
        # For canary deployments, add necessary annotations
        elif strategy_id == 3:  # canary
            if "metadata" not in deployment_spec:
                deployment_spec["metadata"] = {}
            if "annotations" not in deployment_spec["metadata"]:
                deployment_spec["metadata"]["annotations"] = {}
            deployment_spec["metadata"]["annotations"]["kubernetes.io/canary"] = "true"
            
        return deployment_spec 