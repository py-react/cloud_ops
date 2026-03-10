from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.k8s_helper.core import access_registry_via_api_proxy
from kubernetes import client as k8s_client, config as k8s_config
from typing import Optional, Dict, Any, Literal
from render_relay.utils import load_settings
from app.docker_client.clientContext import get_client
from docker.errors import APIError, ImageNotFound
import docker
import requests
import json
import urllib3
import logging
import re
from pydantic import BaseModel
from app.db_client.models.registry_config import RegistryConfig
from app.db_client.db import get_session
from sqlmodel import select
from app.k8s_helper.registry.deploy import deploy_registry_on_k8s

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

from app.utils.crypto import encrypt, decrypt

def get_dockerhub_jwt(username, password, timeout=10):
    """Obtain a JWT token from Docker Hub API."""
    if not password:
        return None
    try:
        r = requests.post(
            "https://hub.docker.com/v2/users/login/",
            json={"username": username, "password": password},
            timeout=timeout
        )
        r.raise_for_status()
        return r.json().get("token")
    except Exception as e:
        logger.error(f"Docker Hub login failed: {e}")
        return None

def list_repos_hub(namespace, token, timeout=10):
    """List all repositories for a user or org on Docker Hub."""
    repos = []
    url = f"https://hub.docker.com/v2/repositories/{namespace}/?page_size=100"
    try:
        while url:
            r = requests.get(url, headers={"Authorization": f"JWT {token}"}, timeout=timeout)
            r.raise_for_status()
            data = r.json()
            repos.extend(f"{namespace}/{repo['name']}" for repo in data.get("results", []))
            url = data.get("next")
        return repos
    except Exception as e:
        logger.error(f"Failed to list Docker Hub repos for {namespace}: {e}")
        return None

def list_tags_hub(namespace, repo, token, timeout=10):
    """List all tags for a repository on Docker Hub."""
    tags = []
    # If repo name already contains namespace, split it
    if "/" in repo:
        ns, rname = repo.split("/", 1)
    else:
        ns, rname = namespace, repo
        
    url = f"https://hub.docker.com/v2/repositories/{ns}/{rname}/tags/?page_size=100"
    try:
        while url:
            r = requests.get(url, headers={"Authorization": f"JWT {token}"}, timeout=timeout)
            r.raise_for_status()
            data = r.json()
            tags.extend(tag["name"] for tag in data.get("results", []))
            url = data.get("next")
        return {"name": repo, "tags": tags}
    except Exception as e:
        logger.error(f"Failed to list Docker Hub tags for {ns}/{rname}: {e}")
        return None


def fetch_registry_v2(
    reg,
    image_name=None,
    tag=None,
    blob=False,
    sha256_digest=None,
    timeout=10,
):
    """
    Main entry point for registry access. Dispatcher for Hub vs Standard V2.
    """
    if not reg.url.startswith(("http://", "https://")):
        raise ValueError("Registry URL must explicitly include http:// or https://")

    is_docker_hub = "docker.io" in reg.url
    plain_password = decrypt(reg.password) if reg.password else None

    if is_docker_hub and reg.username and plain_password:
        return fetch_from_hub(reg, plain_password, image_name, tag, blob, sha256_digest, timeout)
    
    return {"error": True, "message": "Not implemented yet"}

def fetch_from_hub(reg, plain_password, image_name=None, tag=None, blob=False, sha256_digest=None, timeout=10):
    """Specialized logic for Docker Hub using the Hub API (v2)."""
    # 1. Repository Discovery (Discovery phase uses Hub API)
    if not image_name:
        token = get_dockerhub_jwt(reg.username, plain_password, timeout=timeout)
        if not token:
            return {"error": True, "message": "Docker Hub authentication failed"}
        repos = list_repos_hub(reg.username, token, timeout=timeout)
        return {"repositories": repos} if repos is not None else {"error": True, "message": "Failed to list repositories"}

    # 2. Tag Listing (Discovery phase uses Hub API)
    if not tag and not blob:
        token = get_dockerhub_jwt(reg.username, plain_password, timeout=timeout)
        if not token:
            return {"error": True, "message": "Docker Hub authentication failed"}
        tags_data = list_tags_hub(reg.username, image_name, token, timeout=timeout)
        return tags_data if tags_data else {"error": True, "message": "Failed to list tags"}

    return {"error": True, "message": "Not implemented yet"}

async def GET(
    request: Request,
    namespace: Optional[str] = "image-registry",
    service_name: Optional[str] = "docker",
    service_port: Optional[int] = 5000,
    image_name: Optional[str] = None,
    tag: Optional[str] = None,
    blob: Optional[bool] = False,
    sha256_digest: Optional[str] = None,
    registry_id: Optional[int] = None,
    mode: Optional[str] = None
):
    # If parameters specific to a registry query are missing, list all configured registries
    # But wait, the existing code uses namespace/service_name params to proxy!
    # We need to preserve that functionality for "viewing repositories".
    # So if registry_id is NOT provided, and core params are default, check if we want to list?
    # Or maybe we change the contract slightly.
    
    # New logic:
    # 1. If 'list_registries' param is present, return list.
    # 2. If 'registry_id' is present, fetch config, and then proxy.
    
    list_mode = request.query_params.get("mode") == "list"
    
    if list_mode:
        with get_session() as session:
            registries = session.exec(select(RegistryConfig)).all()
            # Sanitize passwords
            results = []
            for r in registries:
                d = r.dict()
                d.pop("password", None)
                results.append(d)
            return {"registries": results}
            
    if registry_id:
        with get_session() as session:
            reg = session.get(RegistryConfig, registry_id)
            if not reg:
                return {"error": True, "message": "Registry not found"}
            
            if reg.is_remote:
                 # Direct access for Remote Registry
                 try:
                     # Determine protocol (default to https if not specified)
                     logger.info(f"Accessing remote registry: {reg.url} {reg.username} {reg.password}")
                     return fetch_registry_v2(
                         reg,
                         image_name=image_name,
                         tag=tag,
                         blob=blob,
                         sha256_digest=sha256_digest,
                     )
                 except Exception as e:
                     logger.error(f"Failed to access remote registry: {e}")
                     return {"error": True, "message": f"Failed to access remote registry: {str(e)}"}
            else:
                 config = reg.config
                 # Use config values, falling back to defaults if necessary
                 # Note: deploy.py saves 'service_name' but let's be safe.
                 namespace = config.get("namespace", "image-registry")
                 service_name = config.get("service_name", f"{reg.name}-service") 
                 # Explicitly check for port in config, though deploy.py doesn't currently save it (defaults to 5000)
                 service_port = config.get("port", 5000)
                 
                 logger.info(f"Proxying to K8s Registry: {service_name}.{namespace}:{service_port}")
                 try:
                     return access_registry_via_api_proxy(namespace, service_name, service_port, image_name, tag, blob, sha256_digest)
                 except Exception as e:
                     logger.error(f"Proxy failed: {e}")
                     return {"error": True, "message": f"Proxy failed: {str(e)}"}

    # Fallback/Backward Comp: Use provided params or defaults
    # This block is now only reached if registry_id is NOT provided.
    # It uses the default namespace/service_name/service_port from the function signature.
    try:
        return access_registry_via_api_proxy(namespace, service_name, service_port, image_name, tag, blob, sha256_digest)
    except Exception as e:
        logger.error(f"Proxy failed: {e}")
        return {"error": True, "message": f"Proxy failed: {str(e)}"}

class CreateRegistryRequest(BaseModel):
    action: Literal["create_registry", "push_image"]
    type: Optional[Literal["k8s", "remote"]] = "k8s"
    name: str
    url: Optional[str] = None
    namespace: Optional[str] = "image-registry"
    username: Optional[str] = None
    password: Optional[str] = None
    image_name: Optional[str] = None
    source_tag: Optional[str] = None

async def POST(
    request: Request,
    body: CreateRegistryRequest
):
    """
    Handle Registry Creation and Image Push
    """

    if body.action == "create_registry":
        # Check duplicate
        with get_session() as session:
            existing = session.exec(select(RegistryConfig).where(RegistryConfig.name == body.name)).first()
            if existing:
                return JSONResponse(status_code=400, content={"error": True, "message": "Registry name already exists"})

        if body.type == "remote":
            new_reg = RegistryConfig(
                name=body.name,
                url=body.url,
                username=body.username,
                password=encrypt(body.password) if body.password else None,
                is_remote=True,
                config_json=json.dumps({})
            )
            with get_session() as session:
                session.add(new_reg)
                session.commit()
                session.refresh(new_reg)
                
            return {"success": True, "message": "Registry created", "registry": new_reg.dict()}
            
        elif body.type == "k8s":
            # Deploy
            try:
                deploy_info = deploy_registry_on_k8s(name=body.name, namespace=body.namespace)
                
                new_reg = RegistryConfig(
                    name=body.name,
                    url=deploy_info["cluster_url"],
                    is_remote=False,
                    config_json=json.dumps(deploy_info)
                )
                with get_session() as session:
                    session.add(new_reg)
                    session.commit()
                    session.refresh(new_reg)
                    
                return {"success": True, "message": "Registry created", "registry": new_reg.dict()}

            except Exception as e:
                return JSONResponse(status_code=500, content={"error": True, "message": f"Deployment failed: {str(e)}"})

    # Fallback to existing logic (push image)
    # Extract params for push
    image_name = body.image_name or request.query_params.get("image_name")
    source_tag = body.source_tag or request.query_params.get("source_tag")
    
    if image_name and source_tag:
        return await push_image(request, image_name, source_tag)
        
    return {"error": True, "message": "Invalid request parameters", "debug_body": str(body)}

class DeleteRegistryRequest(BaseModel):
    registry_id: int

async def DELETE(request: Request):
    try:
        body = await request.json()
        data = DeleteRegistryRequest(**body)
        
        with get_session() as session:
            reg = session.get(RegistryConfig, data.registry_id)
            if not reg:
                return JSONResponse(status_code=404, content={"error": True, "message": "Registry not found"})
            
            logger.info(f"Processing delete for registry: {reg.name} (ID: {reg.id}, Remote: {reg.is_remote})")
            
            # K8s Cleanup Logic
            if not reg.is_remote:
                try:
                    config = reg.config
                    namespace = config.get("namespace", "image-registry")
                    name = reg.name
                    
                    logger.info(f"Initiating K8s cleanup for '{name}' in namespace '{namespace}'")
                    
                    # Load K8s Config
                    try:
                        k8s_config.load_kube_config()
                    except:
                        k8s_config.load_incluster_config()
                    
                    v1 = k8s_client.CoreV1Api()
                    apps_v1 = k8s_client.AppsV1Api()
                    
                    # 1. Delete Service
                    service_name = f"{name}-service"
                    logger.info(f"Deleting Service: {service_name}")
                    try:
                        v1.delete_namespaced_service(service_name, namespace)
                        logger.info(f"Service '{service_name}' deleted")
                    except Exception as e:
                        logger.warning(f"Failed to delete service '{service_name}': {e}")

                    # 2. Delete Deployment
                    deployment_name = name
                    logger.info(f"Deleting Deployment: {deployment_name}")
                    try:
                        apps_v1.delete_namespaced_deployment(deployment_name, namespace)
                        logger.info(f"Deployment '{deployment_name}' deleted")
                    except Exception as e:
                        logger.warning(f"Failed to delete deployment '{deployment_name}': {e}")
                        
                    # 3. Delete PVC
                    pvc_name = config.get("pvc_name", f"{name}-pvc")
                    logger.info(f"Deleting PVC: {pvc_name}")
                    try:
                        v1.delete_namespaced_persistent_volume_claim(pvc_name, namespace)
                        logger.info(f"PVC '{pvc_name}' deleted")
                    except Exception as e:
                        logger.warning(f"Failed to delete PVC '{pvc_name}': {e}")
                        
                except Exception as e:
                    logger.error(f"Critical error during K8s cleanup: {e}")

            session.delete(reg)
            session.commit()
            
        return {"success": True, "message": "Registry removed"}
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        return JSONResponse(status_code=500, content={"error": True, "message": f"Failed to delete: {str(e)}"})


class UpdateRegistryRequest(BaseModel):
    registry_id: int
    name: Optional[str] = None
    url: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

async def PUT(request: Request):
    """
    Update Registry Details
    """
    try:
        body = await request.json()
        data = UpdateRegistryRequest(**body)
        
        with get_session() as session:
            reg = session.get(RegistryConfig, data.registry_id)
            if not reg:
                return JSONResponse(status_code=404, content={"error": True, "message": "Registry not found"})
                
            # Update fields
            if data.name:
                reg.name = data.name
            if data.url:
                reg.url = data.url
            if data.username is not None:
                reg.username = data.username
            if data.password is not None:
                reg.password = encrypt(data.password)
                
            # Note: Changing K8s deployment params is not supported here, only DB record.
            
            session.add(reg)
            session.commit()
            session.refresh(reg)
            
            return {"success": True, "message": "Registry updated", "registry": reg.dict()}

            
    except Exception as e:
        logger.error(f"Update failed: {e}")
        return JSONResponse(status_code=500, content={"error": True, "message": f"Failed to update: {str(e)}"})

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


async def push_image(
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
        docker_client = get_client()
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