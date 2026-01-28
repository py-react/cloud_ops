import sys
import os
import yaml
import json

# Add project root to sys.path
sys.path.append(os.getcwd())

from app.db_client.db import engine, get_session
from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
from app.db_client.services.deployment_composer import DeploymentComposer
from app.db_client.services.deployment_generator import DeploymentGenerator
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig

def test_import_regression():
    
    import random
    import string
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=5))
    test_name = f"testing-002-{suffix}"

    # helper for cleanup
    def cleanup(name, namespace="default"):
        with get_session() as session:
            manager = DeploymentManager(session)
            try:
                manager.delete_deployment_and_service(name, namespace)
                print(f"🧹 Cleaned up existing deployment: {name}")
            except Exception:
                pass

    cleanup(test_name)

    original_yaml = f"""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {test_name}
  labels:
    app: {test_name}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: {test_name}
  template:
    metadata:
      labels:
        app: {test_name}
    spec:
      dnsPolicy: ClusterFirst  # Test Pod dynamic attr
      containers:
        - name: nginx
          image: nginx:stable
          securityContext:     # Test Container dynamic attr
            runAsNonRoot: true
          ports:
            - containerPort: 80
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "256Mi"
"""
    yaml_data = yaml.safe_load(original_yaml)
    
    with get_session() as session:
        manager = DeploymentManager(session)
        print(f"📦 Importing Deployment...")
        result = manager.import_from_yaml(yaml_data)
        
        if result["status"] == "success":
            config_id = result["data"]["deployment_config_id"]
            print(f"✅ Import success. Config ID: {config_id}")
            
            # Now recompose and generate
            config = session.get(DeploymentConfig, config_id)
            composer = DeploymentComposer(session)
            composed_data = composer.compose(config)
            
            generator = DeploymentGenerator(session)
            recomposed_manifest = generator.generate(composed_data)
            
            print("\n--- RECOMPOSED MANIFEST ---")
            print(yaml.dump(recomposed_manifest, sort_keys=False))
            print("---------------------------\n")
            
            # Verify Selector
            selector = recomposed_manifest.get("spec", {}).get("selector", {})
            match_labels = selector.get("matchLabels", {})
            if match_labels.get("app") == test_name:
                print("✅ Selector matchLabels: app verified")
            else:
                print(f"❌ Selector mismatch: {selector}")
                
            # Verify Pod Dynamic Attr (dnsPolicy)
            pod_spec = recomposed_manifest.get("spec", {}).get("template", {}).get("spec", {})
            if pod_spec.get("dnsPolicy") == "ClusterFirst":
                print("✅ Pod dynamic attr (dnsPolicy) verified")
            else:
                print(f"❌ Pod dynamic attr mismatch: {pod_spec.get('dnsPolicy')}")

            # Verify Container Dynamic Attr (securityContext)
            container = pod_spec.get("containers", [{}])[0]
            sec_ctx = container.get("securityContext", {})
            if sec_ctx.get("runAsNonRoot") is True:
                print("✅ Container dynamic attr (securityContext) verified")
            else:
                print(f"❌ Container dynamic attr mismatch: {sec_ctx}")

            # Verify Ports
            ports = container.get("ports", [])
            if ports:
                port = ports[0]
                if "name" not in port:
                    print("✅ Port name is correctly omitted (not null)")
                else:
                    print(f"❓ Port has name: {port.get('name')}")
            else:
                print("❌ No ports found in recomposed manifest")

if __name__ == "__main__":
    test_import_regression()
