#!/usr/bin/env python3
"""
Straightforward Docker push to private insecure registry using Docker SDK
Registry: registry.docker.localhome.com
"""

import docker
import json
import sys
from docker.errors import APIError, ImageNotFound

def main():
    # Registry configuration
    # Use 127.0.0.1:5001 to test the loopback bridge workaround
    registry_host = "127.0.0.1:5001"
    registry_url = f"{registry_host}"
    
    print("="*60)
    print(f"🐳 Docker Push to Private Registry (Bridge Mode)")
    print(f"📍 Registry: {registry_url}")
    print("="*60)
    
    bridge = None
    try:
        # Initialize Docker client
        print("🔧 Initializing Docker client...")
        docker_client = docker.from_env()
        
        # Test Docker connection
        docker_info = docker_client.info()
        print(f"✅ Docker connected - Version: {docker_info.get('ServerVersion', 'Unknown')}")
        
        # Get image name and tag from command line arguments
        if len(sys.argv) < 3:
            print("❌ Usage: python test_with_docker_push.py <image_name> <tag>")
            print("💡 Example: python test_with_docker_push.py nginx alpine")
            return
        
        # Parse arguments
        image_name = sys.argv[1]    # e.g., "nginx" or "hello-world"
        source_tag = sys.argv[2]    # e.g., "alpine" or "latest"
        
        # Construct the full source image name
        source_image = f"{image_name}:{source_tag}"
        repo_name = image_name.replace('/', '-')
        
        print(f"🎯 Source image: {source_image}")
        print(f"🏷️  Target tag: {source_tag}")
        print(f"📦 Target repository: {repo_name}")
        
        # Get the image object
        try:
            selected_image = docker_client.images.get(source_image)
            print(f"✅ Found local image: {selected_image.id[:12]}")
        except ImageNotFound:
            print(f"❌ Image '{source_image}' not found locally!")
            return
        
        # For the proxy, the image name must include the service and namespace
        proxy_prefix = "local-service/image-registry"
        full_image_name = f"{registry_url}/{proxy_prefix}/{repo_name}:{source_tag}"
        print(f"🏷️  Target image name: {full_image_name}")
        
        # Tag the image for our registry
        print(f"\n🏷️  Tagging image for registry...")
        selected_image.tag(f"{registry_url}/{proxy_prefix}/{repo_name}", tag=source_tag)
        print(f"✅ Tagged as: {full_image_name}")
        
        # Start the Registry Bridge
        print(f"\n🌉 Starting Registry Bridge container...")
        bridge_name = "test-registry-bridge"
        try:
            docker_client.containers.get(bridge_name).remove(force=True)
        except:
            pass
            
        bridge = docker_client.containers.run(
            "alpine/socat",
            command="tcp-listen:5001,fork,reuseaddr tcp-connect:host.docker.internal:5001",
            name=bridge_name,
            network_mode="host",
            detach=True
        )
        print("✅ Bridge started (127.0.0.1:5001 inside VM -> host:5001)")

        # Attempt the push
        print(f"\n🚀 Pushing image to registry...")
        print(f"⬆️  Pushing: {full_image_name}")
        
        try:
            # Use Docker SDK push with stream for real-time feedback
            push_stream = docker_client.images.push(
                repository=f"{registry_url}/{proxy_prefix}/{repo_name}",
                tag=source_tag,
                stream=True,
                decode=True,
            )
            
            print("📡 Push progress:")
            last_status = {}
            
            for line in push_stream:
                if 'status' in line:
                    status = line['status']
                    layer_id = line.get('id', '')
                    if layer_id:
                        if layer_id not in last_status or last_status[layer_id] != status:
                            print(f"  📦 {layer_id[:12]}: {status}")
                            last_status[layer_id] = status
                    else:
                        print(f"  ℹ️  {status}")
                if 'error' in line:
                    raise Exception(line['error'])
            
            print("✅ Push completed successfully!")
            
        except Exception as e:
            print(f"❌ Push error: {e}")
            return
        
        # Verify the push
        print(f"\n🔍 Verifying push via host proxy...")
        try:
            import requests
            # Use 127.0.0.1 directly on host for verification
            catalog_url = f"http://127.0.0.1:5001/v2/local-service/image-registry/_catalog"
            response = requests.get(catalog_url, timeout=10)
            if response.status_code == 200:
                print(f"✅ Verification success: {response.json()}")
            else:
                print(f"⚠️ Verification returned status {response.status_code}")
        except Exception as verify_error:
            print(f"⚠️ Verification failed: {verify_error}")
        
        print("\n" + "="*60)
        print("🎯 Push operation completed!")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        if bridge:
            print("\n🧹 Cleaning up bridge...")
            try:
                bridge.stop()
                print("✅ Bridge cleaned up")
            except:
                pass

if __name__ == "__main__":
    main()

if __name__ == "__main__":
    main() 