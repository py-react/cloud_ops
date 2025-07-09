from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.k8s_helper.core import access_registry_via_api_proxy
from typing import Optional
from render_relay.utils import load_settings
from app.docker_client.clientContext import client
from docker.errors import APIError, ImageNotFound
import docker
import requests
import urllib3
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

async def GET(request:Request,namespace:Optional[str]="image-registry",service_name:Optional[str]="docker",service_port:Optional[int]=5000,image_name:Optional[str]=None,tag:Optional[str]=None,blob:Optional[bool]=False,sha256_digest:Optional[str]=None):
    try:
        return access_registry_via_api_proxy(namespace,service_name,service_port,image_name,tag,blob,sha256_digest)
    except Exception as e:
        return {"error":True,"message":e.__dict__["explanation"]}
    

async def _verify_registry_connectivity(registry_url: str) -> bool:
    """Test if registry is accessible"""
    try:
        registry_api_url = f"http://{registry_url}/v2/_catalog"
        response = requests.get(registry_api_url, timeout=10, verify=False)
        return response.status_code == 200
    except Exception:
        return False


async def _push_image_to_registry(docker_client, registry_url: str, repo_name: str, source_tag: str):
    """Push image to registry and collect progress"""
    push_logs = []
    
    push_stream = docker_client.images.push(
        repository=f"{registry_url}/{repo_name}",
        tag=source_tag,
        stream=True,
        decode=True,
    )
    
    for line in push_stream:
        if 'status' in line:
            status = line['status']
            layer_id = line.get('id', '')
            
            if layer_id:
                push_logs.append(f"{layer_id[:12]}: {status}")
            else:
                push_logs.append(status)
        
        if 'error' in line:
            raise APIError(line['error'])
    
    return push_logs


async def _verify_push_success(registry_url: str, repo_name: str, source_tag: str):
    """Verify image was successfully pushed to registry"""
    try:
        # Check repository exists
        catalog_url = f"http://{registry_url}/v2/_catalog"
        response = requests.get(catalog_url, timeout=10, verify=False)
        
        if response.status_code != 200:
            return False, "Cannot access registry catalog"
        
        repositories = response.json().get('repositories', [])
        if repo_name not in repositories:
            return False, f"Repository '{repo_name}' not found in registry"
        
        # Check tag exists
        tags_url = f"http://{registry_url}/v2/{repo_name}/tags/list"
        tags_response = requests.get(tags_url, timeout=10, verify=False)
        
        if tags_response.status_code != 200:
            return False, "Cannot retrieve tags"
        
        available_tags = tags_response.json().get('tags', [])
        if source_tag not in available_tags:
            return False, f"Tag '{source_tag}' not found in available tags"
        
        return True, "Image successfully verified in registry"
    
    except Exception as e:
        return False, f"Verification failed: {str(e)}"
    
def clean_image_name(name: str) -> str:
    # Remove @sha256:<digest> if present
    return re.sub(r'@sha256:[a-f0-9]{64}$', '', name)


async def POST(
    request: Request,
    image_name: str,
    source_tag: str,
):
    """Push a Docker image to the private registry"""
    
    try:
        # Load configuration
        settings = load_settings()
        registry_host = settings.get("REGISTRY_HOST")
        if not registry_host:
            raise HTTPException(
                status_code=500, 
                detail="Registry host not configured"
            )
        
        registry_url = f"{registry_host}"
        source_image = f"{image_name}:{source_tag}"
        image_name = clean_image_name(image_name)
        repo_name = image_name.replace('/', '-')
        full_image_name = f"{registry_url}/{repo_name}:{source_tag}"
        
        logger.info(f"Starting push of {source_image} to {full_image_name}")
        
        # Validate Docker connection
        docker_client = client
        try:
            docker_info = docker_client.info()
            logger.info(f"Docker connected - Version: {docker_info.get('ServerVersion', 'Unknown')}")
        except Exception as e:
            raise HTTPException(
                status_code=503,
                detail=f"Docker daemon not accessible: {str(e)}"
            )
        
        # Check if source image exists locally
        try:
            selected_image = docker_client.images.get(source_image)
            logger.info(f"Found local image: {selected_image.id[:12]}")
        except ImageNotFound:
            raise HTTPException(
                status_code=404,
                detail=f"Image '{source_image}' not found locally. Pull the image first."
            )
        
        # Test registry connectivity
        registry_accessible = await _verify_registry_connectivity(registry_url)
        if not registry_accessible:
            logger.warning(f"Registry at {registry_url} may not be accessible")
        
        # Tag image for registry
        try:
            selected_image.tag(f"{registry_url}/{repo_name}", tag=source_tag)
            logger.info(f"Tagged image as {full_image_name}")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to tag image: {str(e)}"
            )
        
        # Push image to registry
        try:
            push_logs = await _push_image_to_registry(
                docker_client, registry_url, repo_name, source_tag
            )
            logger.info("Image push completed successfully")
        except APIError as e:
            error_msg = str(e)
            if 'server gave HTTP response to HTTPS client' in error_msg:
                detail = f"Registry connection error: {error_msg}. Add '{registry_url}' to Docker's insecure-registries."
            elif 'connection refused' in error_msg.lower():
                detail = f"Registry not accessible: {error_msg}"
            elif 'unauthorized' in error_msg.lower():
                detail = f"Registry authentication failed: {error_msg}"
            else:
                detail = f"Docker push failed: {error_msg}"
            
            raise HTTPException(status_code=500, detail=detail)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Unexpected push error: {str(e)}"
            )
        
        # Verify push success
        verified, verification_msg = await _verify_push_success(
            registry_url, repo_name, source_tag
        )
        
        # Prepare response
        response_data = {
            "success": True,
            "message": "Image pushed successfully",
            "image": {
                "source": source_image,
                "target": full_image_name,
                "registry": registry_url,
                "repository": repo_name,
                "tag": source_tag
            },
            "verification": {
                "verified": verified,
                "message": verification_msg
            },
            "pull_command": f"docker pull {full_image_name}"
        }
        
        if verified:
            logger.info(f"Push verified successfully: {full_image_name}")
            return JSONResponse(
                status_code=201,
                content=response_data
            )
        else:
            logger.warning(f"Push completed but verification failed: {verification_msg}")
            response_data["message"] = "Image pushed but verification failed"
            return JSONResponse(
                status_code=202,
                content=response_data
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during push: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )