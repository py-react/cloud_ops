import sys
import os
import json

# Add project root to path
sys.path.append(os.getcwd())

from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
from app.k8s_helper.monitoring.stack import get_monitoring_manifests
from app.k8s_helper.monitoring.metrics_server import get_metrics_server_manifests

def verify_manifests():
    print("--- Verifying Manifest Generation ---")
    manifests = get_monitoring_manifests() + get_metrics_server_manifests("kube-system")
    print(f"Total manifests generated: {len(manifests)}")
    
    kinds = [m.get("kind") for m in manifests]
    expected_kinds = ["Namespace", "ClusterRole", "ServiceAccount", "ClusterRoleBinding", "ConfigMap", "Deployment", "Service", "APIService"]
    
    for kind in expected_kinds:
        if kind in kinds:
            print(f" [✓] {kind} manifest exists")
        else:
            print(f" [✗] {kind} manifest MISSING")
            return False
    return True

def deploy_monitoring():
    print("--- Deploying Monitoring Stack ---")
    k8s_helper = KubernetesResourceHelper()
    manifests = get_monitoring_manifests() + get_metrics_server_manifests("kube-system")
    
    for manifest in manifests:
        try:
            kind = manifest.get("kind")
            name = manifest.get("metadata", {}).get("name")
            print(f" Applying {kind}/{name}...")
            k8s_helper.apply_resource(manifest)
        except Exception as e:
            print(f" Failed to apply {kind}/{name}: {str(e)}")

def cleanup_monitoring():
    print("--- Cleaning Up Monitoring Resources ---")
    k8s_helper = KubernetesResourceHelper()
    namespace = "monitoring"
    
    # Get all manifests including metrics-server
    manifests = get_monitoring_manifests() + get_metrics_server_manifests("kube-system")
    
    # Delete resources in reverse order (best practice)
    for manifest in reversed(manifests):
        kind = manifest.get("kind")
        if kind == "Namespace":
            continue
            
        try:
            name = manifest.get("metadata", {}).get("name")
            print(f" Deleting {kind}/{name}...")
            k8s_helper.delete_resource(manifest)
        except Exception as e:
            # Ignore not found errors during cleanup
            if "not found" not in str(e).lower():
                print(f" Failed to delete {kind}/{name}: {str(e)}")


if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "verify"
    
    if action == "verify":
        if verify_manifests():
            print("\nSUCCESS: Manifests are valid.")
        else:
            sys.exit(1)
    elif action == "deploy":
        deploy_monitoring()
    elif action == "cleanup":
        cleanup_monitoring()
    elif action == "test-all":
        print("Starting full test (Verify -> Cleanup)...")
        verify_manifests()
        cleanup_monitoring()
    else:
        print("Usage: python3 verify_monitoring_stack.py [verify|cleanup|test-all]")
