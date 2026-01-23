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
    registry_host = "registry.docker.localhome.com"
    registry_url = f"{registry_host}"
    
    print("="*60)
    print(f"🐳 Docker Push to Private Registry")
    print(f"📍 Registry: {registry_url}")
    print("="*60)
    
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
            print("💡 Example: python test_with_docker_push.py hello-world latest")
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
            print(f"💡 Pull the image first: docker pull {source_image}")
            return
        
        full_image_name = f"{registry_url}/{repo_name}:{source_tag}"
        print(f"🏷️  Target image name: {full_image_name}")
        
        # Tag the image for our registry
        print(f"\n🏷️  Tagging image for registry...")
        selected_image.tag(f"{registry_url}/{repo_name}", tag=source_tag)
        print(f"✅ Tagged as: {full_image_name}")
        
        # Test registry connectivity
        print(f"\n🔍 Testing registry connectivity...")
        try:
            # Try to get registry info
            import requests
            import urllib3
            urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
            
            registry_api_url = f"http://{registry_url}/v2/_catalog"
            response = requests.get(registry_api_url, timeout=10, verify=False)
            
            if response.status_code == 200:
                print(f"✅ Registry API accessible at {registry_api_url}")
            else:
                print(f"⚠️  Registry returned status {response.status_code}")
        except Exception as e:
            print(f"⚠️  Registry connectivity test failed: {e}")
            print("💡 Proceeding anyway - Docker might handle connectivity differently")
        
        # Configure Docker daemon for insecure registry
        print(f"\n⚙️  Checking Docker daemon configuration...")
        daemon_config_path = "/etc/docker/daemon.json"
        
        print(f"💡 To allow insecure registry, ensure Docker daemon has this config:")
        print(f"   File: {daemon_config_path}")
        print(f"   Content:")
        print(f'   {{')
        print(f'     "insecure-registries": ["{registry_url}"]')
        print(f'   }}')
        print(f"💡 Or in Docker Desktop: Settings → Docker Engine → Add to JSON config")
        print(f"💡 After changes, restart Docker daemon")
        
        # Attempt the push
        print(f"\n🚀 Pushing image to registry...")
        print(f"⬆️  Pushing: {full_image_name}")
        
        try:
            # Use Docker SDK push with stream for real-time feedback
            push_stream = docker_client.images.push(
                repository=f"{registry_url}/{repo_name}",
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
                    
                    # Show progress for different layers
                    if layer_id:
                        if layer_id not in last_status or last_status[layer_id] != status:
                            print(f"  📦 {layer_id[:12]}: {status}")
                            last_status[layer_id] = status
                    else:
                        print(f"  ℹ️  {status}")
                
                # Check for errors
                if 'error' in line:
                    print(f"❌ Push error: {line['error']}")
                    if 'server gave HTTP response to HTTPS client' in line['error']:
                        print("💡 This error suggests the registry is HTTP but Docker is trying HTTPS")
                        print("💡 Make sure the registry URL in insecure-registries uses the correct protocol")
                    elif 'x509' in line['error'] or 'certificate' in line['error']:
                        print("💡 This is a certificate error - confirm registry is in insecure-registries")
                    raise Exception(line['error'])
            
            print("✅ Push completed successfully!")
            
        except APIError as e:
            print(f"❌ Docker API error during push: {e}")
            if 'server gave HTTP response to HTTPS client' in str(e):
                print("💡 Solution: Add registry to insecure-registries in Docker daemon config")
                print(f"💡 Registry URL to add: {registry_url}")
            elif 'connection refused' in str(e).lower():
                print("💡 Solution: Check if registry is running and accessible")
                print(f"💡 Test with: curl http://{registry_url}/v2/")
            elif 'unauthorized' in str(e).lower():
                print("💡 Solution: Check if registry requires authentication")
            else:
                print("💡 Check Docker daemon logs for more details")
            return
        
        except Exception as e:
            print(f"❌ Unexpected error during push: {e}")
            return
        
        # Verify the push
        print(f"\n🔍 Verifying push...")
        try:
            import requests
            catalog_url = f"http://{registry_url}/v2/_catalog"
            response = requests.get(catalog_url, timeout=10, verify=False)
            
            if response.status_code == 200:
                catalog = response.json()
                repositories = catalog.get('repositories', [])
                print(f"📋 Registry catalog: {repositories}")
                
                if repo_name in repositories:
                    print(f"✅ Repository '{repo_name}' found in registry!")
                    
                    # Check tags
                    tags_url = f"http://{registry_url}/v2/{repo_name}/tags/list"
                    tags_response = requests.get(tags_url, timeout=10, verify=False)
                    
                    if tags_response.status_code == 200:
                        tags_data = tags_response.json()
                        available_tags = tags_data.get('tags', [])
                        print(f"🏷️  Available tags: {available_tags}")
                        
                        if source_tag in available_tags:
                            print(f"🎉 SUCCESS! Image {full_image_name} is available in registry!")
                        else:
                            print(f"⚠️  Tag '{source_tag}' not found in available tags")
                    else:
                        print(f"⚠️  Could not retrieve tags (status: {tags_response.status_code})")
                else:
                    print(f"⚠️  Repository '{repo_name}' not found in catalog")
            else:
                print(f"⚠️  Could not retrieve catalog (status: {response.status_code})")
                
        except Exception as verify_error:
            print(f"⚠️  Verification failed: {verify_error}")
            print("💡 Push might still be successful - check registry manually")
        
        # Show pull command
        print(f"\n📥 To pull this image later:")
        print(f"   docker pull {full_image_name}")
        
        print("\n" + "="*60)
        print("🎯 Push operation completed!")
        print("="*60)
        
    except docker.errors.DockerException as e:
        print(f"❌ Docker error: {e}")
        print("💡 Make sure Docker is running and accessible")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main() 