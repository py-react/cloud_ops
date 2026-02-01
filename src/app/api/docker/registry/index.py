from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.k8s_helper.core import access_registry_via_api_proxy
from kubernetes import client as k8s_client, config as k8s_config
from typing import Optional, Dict, Any, Literal
from render_relay.utils import load_settings
from app.docker_client.clientContext import client
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
                     base_url = reg.url
                     if not base_url.startswith("http"):
                         base_url = f"https://{base_url}"
                     
                     # Construct V2 API path
                     if image_name:
                         if blob:
                             path = f"/v2/{image_name}/blobs/{sha256_digest}"
                         elif tag:
                             path = f"/v2/{image_name}/manifests/{tag}"
                         else:
                             path = f"/v2/{image_name}/tags/list"
                     else:
                         path = f"/v2/_catalog"
                         
                     target_url = f"{base_url}{path}"
                     
                     # Auth Headers
                     auth = None
                     # Decrypt password for use
                     plain_password = decrypt(reg.password) if reg.password else None
                     
                     if reg.username and plain_password:
                         auth = requests.auth.HTTPBasicAuth(reg.username, plain_password)
                         
                     logger.info(f"Accessing Remote Registry: {target_url}")
                     
                     # Make Request
                     # Note: verify=False for self-signed certs (common in internal setups), 
                     # ideally this should be a setting.
                     resp = requests.get(target_url, auth=auth, verify=False, timeout=10)
                     
                     if resp.status_code == 401:
                          return {"error": True, "message": "Authentication failed for remote registry"}
                     
                     if resp.status_code != 200:
                         logger.error(f"Remote registry error {resp.status_code}: {resp.text}")
                         return {"error": True, "message": f"Remote registry returned {resp.status_code}"}
                         
                     return resp.json()
                     
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

    # Fallback/Backward Comp: Use provided params or defaults
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
    logger.info(f"POST Body (Pydantic): {body}")

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