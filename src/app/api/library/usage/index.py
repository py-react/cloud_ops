from fastapi import Request
from app.k8s_helper.deployment_with_strategy.deployment_manager import DeploymentManager
from app.db_client.models.deployment_config.deployment_config import DeploymentConfig
from sqlmodel import select
from typing import Optional

async def GET(request: Request, template: str, env_name: Optional[str] = None):
    dm = DeploymentManager()
    query = select(DeploymentConfig).where(DeploymentConfig.chart_name == template)
    if env_name:
        query = query.where(DeploymentConfig.env_name == env_name)
    
    deployments = dm.session.exec(query).all()
    
    results = []
    for d in deployments:
        results.append({
            "id": d.id,
            "name": d.deployment_name,
            "namespace": d.namespace,
            "chart_name": d.chart_name,
            "env_name": d.env_name
        })
    
    return results
