import asyncio
import time
from fastapi import Request
from app.k8s_helper import KubernetesResourceHelper
from app.db_client.db import get_session
from sqlalchemy import func
from app.db_client.controllers.docker_config.docker_config import (
    list_docker_configs,
    get_active_docker_config
)
from app.db_client.models.registry_config import RegistryConfig
from sqlmodel import select
from app.github_client.core.allowed_repo import AllowedRepoUtils
from app.k8s_helper.core.context_ops import ContextOperations
from app.db_client.models.ssh_management import System, SSHKey
from render_relay.utils import load_settings

# Simple Global Cache
DASHBOARD_CACHE = {
    "data": None,
    "timestamp": 0,
    "ttl": 5  # 5 seconds cache to prevent API call bombardment
}

async def fetch_k8s_data():
    """Fetch Kubernetes cluster info and metrics."""
    try:
        # Initialize helper (loads config)
        helper = KubernetesResourceHelper()
        # Fetch data in parallel on threads since these are synchronous K8s calls
        info = await asyncio.to_thread(helper.get_cluster_info)
        metrics = await asyncio.to_thread(helper.get_cluster_metrics)
        
        return {
            "online": True,
            "info": info if isinstance(info, dict) else info.dict() if hasattr(info, 'dict') else {},
            "metrics": metrics
        }
    except Exception as e:
        return {"online": False, "error": str(e)}

async def fetch_docker_engines():
    """Fetch list of Docker engines and their active status."""
    try:
        with get_session() as session:
            configs = list_docker_configs(session)
            active_config = get_active_docker_config(session)
            
            engines = []
            # Local Engine (ID 0)
            engines.append({
                "id": 0,
                "name": "Local Engine",
                "base_url": "unix:///var/run/docker.sock",
                "is_active": active_config is None,
                "is_default": True
            })
            
            for c in configs:
                engines.append({
                    "id": c.id,
                    "name": c.name,
                    "base_url": c.base_url,
                    "is_active": active_config is not None and active_config.id == c.id,
                    "is_default": False
                })
            return {"engines": engines, "total": len(engines)}
    except Exception as e:
        return {"error": str(e)}

async def fetch_registries():
    """Fetch Image Registry counts."""
    try:
        with get_session() as session:
            registries = session.exec(select(RegistryConfig)).all()
            return {
                "total": len(registries),
                "remote": sum(1 for r in registries if r.is_remote),
                "k8s": sum(1 for r in registries if not r.is_remote)
            }
    except Exception as e:
        return {"error": str(e)}

async def fetch_cicd_data():
    """Fetch CI/CD Source Control polling summary."""
    try:
        utils = AllowedRepoUtils()
        # get_all returns (result, branches_with_config, deployments, repo_pats, repo_registries, repo_engines, repo_polling_enabled)
        repos, branches, _, _, _, _, polling_status = await asyncio.to_thread(utils.get_all)
        
        active_list = []
        for name in repos.keys():
            active_list.append({
                "name": name,
                "branch_count": len(branches.get(name, [])),
                "polling_enabled": polling_status.get(name, False)
            })
        
        # Sort by polling status then name
        active_list.sort(key=lambda x: (x['polling_enabled'], x['name']), reverse=True)

        return {
            "repositories_count": len(repos),
            "total_branches": sum(len(b) for b in branches.values()) if branches else 0,
            "active_repos": active_list[:5] # Detailed summary of top 5
        }
    except Exception as e:
        return {"error": str(e)}

async def fetch_k8s_contexts():
    """Fetch Kubernetes context list and current active context."""
    try:
        settings = load_settings()
        config_path = settings.get("KUBECONFIG", "~/.kube/config")
        context_ops = ContextOperations(path=config_path)
        
        # Use to_thread for the synchronous kubeconfig read
        data = await asyncio.to_thread(context_ops.get_contexts)
        
        contexts = []
        for ctx in data.get("contexts", []):
            contexts.append({
                "name": ctx["name"],
                "is_active": ctx["name"] == data["current_context"]
            })
            
        return {
            "contexts": contexts,
            "current_context": data["current_context"],
            "total": len(contexts)
        }
    except Exception as e:
        return {"error": str(e)}

async def fetch_bastion_data():
    """Fetch Bastion systems and access summary with real-time TCP health checks."""
    try:
        with get_session() as session:
            systems = session.exec(select(System)).all()
            total_keys = session.exec(select(func.count(SSHKey.id))).one()
            
            # Perform real-time TCP health checks (Port 22) in parallel
            async def check_connectivity(system):
                try:
                    # Timeout of 500ms to keep it extremely fast
                    conn = asyncio.open_connection(system.ip_address, 22)
                    _, writer = await asyncio.wait_for(conn, timeout=0.5)
                    writer.close()
                    await writer.wait_closed()
                    return True
                except:
                    return False
            
            health_results = await asyncio.gather(*[check_connectivity(s) for s in systems])
            online_count = sum(1 for r in health_results if r)
            
            return {
                "total_systems": len(systems),
                "active_systems": online_count, # Now represents real-time reachability
                "service_keys_deployed": sum(1 for s in systems if s.service_key_deployed),
                "user_pems_active": sum(1 for s in systems if s.private_key is not None),
                "total_ssh_keys": total_keys,
                "recent_systems": [{"name": s.name, "ip": s.ip_address} for s in systems[:3]]
            }
    except Exception as e:
        return {"error": str(e)}

async def GET(request: Request):
    """
    Aggregated Dashboard API.
    Fetches K8s, Docker, Registry, and CI/CD data in parallel with a 5s TTL cache.
    """
    now = time.time()
    
    # Check Cache
    if DASHBOARD_CACHE["data"] and (now - DASHBOARD_CACHE["timestamp"] < DASHBOARD_CACHE["ttl"]):
        return DASHBOARD_CACHE["data"]
    
    # Fetch all data in parallel
    k8s_task = fetch_k8s_data()
    docker_task = fetch_docker_engines()
    registry_task = fetch_registries()
    cicd_task = fetch_cicd_data()
    k8s_ctx_task = fetch_k8s_contexts()
    bastion_task = fetch_bastion_data()
    
    k8s_data, docker_data, registry_data, cicd_data, k8s_ctx_data, bastion_data = await asyncio.gather(
        k8s_task, docker_task, registry_task, cicd_task, k8s_ctx_task, bastion_task,
        return_exceptions=True
    )
    
    # Format Response
    dashboard_data = {
        "kubernetes": k8s_data if not isinstance(k8s_data, Exception) else {"error": str(k8s_data)},
        "k8s_contexts": k8s_ctx_data if not isinstance(k8s_ctx_data, Exception) else {"error": str(k8s_ctx_data)},
        "docker_engines": docker_data if not isinstance(docker_data, Exception) else {"error": str(docker_data)},
        "registries": registry_data if not isinstance(registry_data, Exception) else {"error": str(registry_data)},
        "cicd": cicd_data if not isinstance(cicd_data, Exception) else {"error": str(cicd_data)},
        "bastion": bastion_data if not isinstance(bastion_data, Exception) else {"error": str(bastion_data)},
        "last_updated": now,
        "cache_hit": False
    }
    
    # Update Cache
    DASHBOARD_CACHE["data"] = dashboard_data
    DASHBOARD_CACHE["timestamp"] = now
    
    return dashboard_data
