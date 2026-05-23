from fastapi import Request, HTTPException
from sqlmodel import select, Session
from app.db_client.db import get_session
from app.db_client.models.addon_plugin.addon_plugin import AddonPlugin
from app.k8s_helper.core.helm_client import HelmClient
from kiwijs.utils import load_settings
import os

from app.services.kube_config_service import KubeConfigService

def _get_helm_client(session: Session) -> HelmClient:
    """Create a HelmClient using the active KUBECONFIG from the database."""
    kubeconfig_path = KubeConfigService.ensure_active_kubeconfig_path(session)
    return HelmClient(kubeconfig_path=kubeconfig_path)

async def GET(request: Request):
    """
    List all addons, OR fetch default values for a chart.
    
    Query params for chart defaults:
      ?action=fetch_values&repo_name=...&repo_url=...&chart_name=...
    """
    action = request.query_params.get("action")
    
    with get_session() as session:
        if action == "fetch_values":
            repo_name  = request.query_params.get("repo_name", "").strip()
            repo_url   = request.query_params.get("repo_url", "").strip()
            chart_name = request.query_params.get("chart_name", "").strip()
            
            if not repo_name or not repo_url or not chart_name:
                raise HTTPException(status_code=400, detail="repo_name, repo_url, and chart_name are required")
            
            try:
                helm = _get_helm_client(session)
                yaml_values = helm.get_chart_values(repo_name, repo_url, chart_name)
                return {"values": yaml_values}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to fetch chart values: {str(e)}")
        
        # Bulk fetch all Helm releases once for efficiency
        helm = _get_helm_client(session)
        helm_error = None
        try:
            all_releases = helm.list_all_releases()
            # Create a lookup map for quick access: {(name, namespace): release_dict}
            release_map = {(r['name'], r['namespace']): r for r in all_releases}
        except Exception as e:
            print(f"Failed to bulk-list helm releases: {e}")
            release_map = {}
            helm_error = str(e)

        plugins = session.exec(select(AddonPlugin)).all()
        result = []
        for p in plugins:
            p_dict = p.model_dump()
            
            # Lookup status from our pre-fetched bulk map
            rel = release_map.get((p.name, p.namespace))
            
            if rel:
                p_dict['is_installed'] = (rel.get('status') == 'deployed')
                p_dict['revision'] = rel.get('revision')
                p_dict['chart_version'] = rel.get('chart') # Info for the UI
                p_dict['app_version'] = rel.get('app_version')
            else:
                p_dict['is_installed'] = False
                p_dict['revision'] = None
            
            result.append(p_dict)
            
        return {"data": result, "helm_error": helm_error}
        
async def POST(request: Request):
    """Handle creation, install, or uninstall based on action"""
    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
    action = data.get("action", "create")
    
    with get_session() as session:
        if action == "create":
            # Add a new plugin to DB
            plugin = AddonPlugin(**data.get("plugin", {}))
            session.add(plugin)
            session.commit()
            session.refresh(plugin)
            return {"status": "success", "plugin": plugin.model_dump()}
            
        elif action == "install":
            addon_id = data.get("id")
            overrides = data.get("overrides", None)
            
            plugin = session.exec(select(AddonPlugin).where(AddonPlugin.id == addon_id)).first()
            if not plugin:
                raise HTTPException(status_code=404, detail="Plugin not found")
                
            try:
                helm = _get_helm_client(session)
                helm.add_repo(plugin.helm_repo_name, plugin.helm_repo_url)
                helm.update_repos()
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to add helm repo: {str(e)}")
                
            values_to_apply = overrides if overrides is not None else plugin.default_values
            
            # Persist overrides to DB if provided, so the change is permanent
            if overrides is not None:
                plugin.default_values = overrides
                session.add(plugin)
                session.commit()
                session.refresh(plugin)
            
            try:
                helm.install_chart(
                    release_name=plugin.name,
                    chart=plugin.helm_chart_name,
                    namespace=plugin.namespace,
                    version=plugin.helm_version,
                    values=values_to_apply
                )
                return {"status": "success", "message": f"{plugin.name} installed successfully."}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Helm install failed: {str(e)}")
                
        elif action == "uninstall":
            addon_id = data.get("id")
            plugin = session.exec(select(AddonPlugin).where(AddonPlugin.id == addon_id)).first()
            if not plugin:
                raise HTTPException(status_code=404, detail="Plugin not found")
                
            try:
                helm = _get_helm_client(session)
                helm.uninstall_chart(plugin.name, plugin.namespace)
                return {"status": "success", "message": f"{plugin.name} uninstalled."}
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Helm uninstall failed: {str(e)}")
                
        elif action == "delete":
            addon_id = data.get("id")
            plugin = session.exec(select(AddonPlugin).where(AddonPlugin.id == addon_id)).first()
            if not plugin:
                raise HTTPException(status_code=404, detail="Plugin not found")
            
            try:
                session.delete(plugin)
                session.commit()
                return {"status": "success", "message": f"{plugin.name} deleted from registry."}
            except Exception as e:
                session.rollback()
                raise HTTPException(status_code=500, detail=f"Failed to delete plugin: {str(e)}")
        
        elif action == "update":
            addon_id = data.get("id")
            update_data = data.get("plugin", {})
            plugin = session.exec(select(AddonPlugin).where(AddonPlugin.id == addon_id)).first()
            if not plugin:
                raise HTTPException(status_code=404, detail="Plugin not found")
            
            try:
                # Update only provided metadata fields
                if "display_name" in update_data: plugin.display_name = update_data["display_name"]
                if "description" in update_data: plugin.description = update_data["description"]
                if "proxy_url" in update_data: plugin.proxy_url = update_data["proxy_url"]
                if "category" in update_data: plugin.category = update_data["category"]
                if "service_port" in update_data: plugin.service_port = int(update_data["service_port"])
                if "default_values" in update_data: plugin.default_values = update_data["default_values"]
                
                session.add(plugin)
                session.commit()
                session.refresh(plugin)
                return {"status": "success", "message": f"{plugin.display_name} metadata updated.", "plugin": plugin.model_dump()}
            except Exception as e:
                session.rollback()
                raise HTTPException(status_code=500, detail=f"Failed to update metadata: {str(e)}")
                
        else:
            raise HTTPException(status_code=400, detail=f"Unknown action {action}")
