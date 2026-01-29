import sys
import os
import json

# Add project root to path
sys.path.append(os.getcwd())

from app.k8s_helper.core.resource_helper import KubernetesResourceHelper
from app.k8s_helper.monitoring.stack import get_monitoring_manifests

def verify_manifests():
    print("--- Verifying Manifest Generation ---")
    manifests = get_monitoring_manifests()
    print(f"Total manifests generated: {len(manifests)}")
    
    kinds = [m.get("kind") for m in manifests]
    expected_kinds = ["Namespace", "ClusterRole", "ServiceAccount", "ClusterRoleBinding", "ConfigMap", "Deployment", "Service"]
    
    for kind in expected_kinds:
        if kind in kinds:
            print(f" [✓] {kind} manifest exists")
        else:
            print(f" [✗] {kind} manifest MISSING")
            return False
    return True

def cleanup_monitoring():
    print("--- Cleaning Up Monitoring Resources ---")
    k8s_helper = KubernetesResourceHelper()
    namespace = "monitoring"
    
    try:
        print(f" Deleting namespace {namespace}...")
        k8s_helper.delete_namespace(namespace)
        print("Cleanup initiated.")
    except Exception as e:
        if "not found" in str(e).lower():
            print(" Namespace already gone.")
        else:
            print(f" Error during cleanup: {str(e)}")

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "verify"
    
    if action == "verify":
        if verify_manifests():
            print("\nSUCCESS: Manifests are valid.")
        else:
            sys.exit(1)
    elif action == "cleanup":
        cleanup_monitoring()
    elif action == "test-all":
        print("Starting full test (Verify -> Cleanup)...")
        verify_manifests()
        cleanup_monitoring()
    else:
        print("Usage: python3 verify_monitoring_stack.py [verify|cleanup|test-all]")
