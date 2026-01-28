import sys
import os
import json
import time
from sqlmodel import Session, select

# Add project root to path
sys.path.append(os.getcwd())

from app.db_client.db import get_session
from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
from app.db_client.services.deployment_composer import DeploymentComposer
from app.db_client.services.service_composer import ServiceComposer
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from app.db_client.models.kubernetes_profiles.service import K8sService
from app.db_client.models.deployment_run.types import DeploymentRunType

def main():
    manager = DeploymentManager()
    
    # Use unique name to avoid IntegrityError
    timestamp = int(time.time())
    deploy_name = f"import-test-{timestamp}"
    svc_name = f"svc-test-{timestamp}"

    # 1. Test Deployment Import
    deployment_yaml = {
        "apiVersion": "apps/v1",
        "kind": "Deployment",
        "metadata": {
            "name": deploy_name,
            "namespace": "default",
            "labels": {"app": deploy_name}
        },
        "spec": {
            "replicas": 3,
            "selector": {"matchLabels": {"app": deploy_name}},
            "template": {
                "metadata": {
                    "labels": {"app": deploy_name},
                    "annotations": {"prometheus.io/scrape": "true"}
                },
                "spec": {
                    "containers": [
                        {
                            "name": "main-container",
                            "image": "nginx:latest",
                            "ports": [{"containerPort": 80, "protocol": "TCP"}],
                            "env": [{"name": "ENV_VAR", "value": "test-value"}]
                        }
                    ]
                }
            }
        }
    }

    print(f"\n📦 Testing Deployment Import with name '{deploy_name}'...")
    result = manager.import_from_yaml(deployment_yaml)
    print(json.dumps(result, indent=2))
    
    config_id = result["data"]["deployment_config_id"]
    
    # 2. Test Service Import
    service_yaml = {
        "apiVersion": "v1",
        "kind": "Service",
        "metadata": {
            "name": svc_name,
            "namespace": "default",
            "labels": {"app": deploy_name}
        },
        "spec": {
            "type": "LoadBalancer",
            "selector": {"app": deploy_name},
            "ports": [
                {
                    "name": "http",
                    "port": 80,
                    "targetPort": 80,
                    "protocol": "TCP"
                }
            ],
            "externalTrafficPolicy": "Local"
        }
    }

    print(f"\n🌐 Testing Service Import with name '{svc_name}'...")
    svc_result = manager.import_from_yaml(service_yaml)
    print(json.dumps(svc_result, indent=2))
    
    svc_id = svc_result["data"]["service_id"]

    # 3. LINK Service to DeploymentConfig (Manual link for testing)
    print("\n� Linking Service to DeploymentConfig...")
    config_obj = manager.session.get(DeploymentConfig, config_id)
    config_obj.service_id = svc_id
    manager.session.add(config_obj)
    manager.session.commit()

    # 4. Verify using Composer
    print("\n🔍 Verifying Deployment Composition...")
    composer = DeploymentComposer(manager.session)
    composed_data = composer.compose(config_obj)
    
    print(f"Name: {composed_data.get('deployment_name')}")
    print(f"Replicas: {composed_data.get('replicas')}")
    print(f"Containers: {len(composed_data.get('containers', []))}")

    # 5. Test Release Run from Imported Config
    # print("\n🚀 Testing Release Run (Apply to K8s)...")
    # run_payload = DeploymentRunType(
    #     deployment_config_id=config_id,
    #     images={"main-container": "nginx:1.21-alpine"},
    #     pr_url="https://github.com/test/pull/1",
    #     jira="OPS-101",
    #     apply_derived_service=True 
    # )
    
    # try:
    #     release_result = manager.run_deployment_from_run(run_payload)
    #     print("✅ Release Run Triggered Successfully!")
    #     print(f"Outcome: {release_result['deployment_result']}")
    # except Exception as e:
    #     print(f"❌ Release Run Failed: {e}")

if __name__ == "__main__":
    main()
