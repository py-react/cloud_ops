from fastapi import Request, HTTPException, BackgroundTasks
from sqlmodel import select, Session
from app.db_client.db import engine, get_session, ensure_default_essential_addons, ensure_default_strategies
from app.db_client.models.tenant.tenant import Tenant
from pydantic import BaseModel
from typing import Optional
from app.utils.auth import get_current_user

class OnboardingCompleteRequest(BaseModel):
    name: Optional[str] = None

async def GET(request: Request):
    """Check if onboarding is required for the current user's tenant."""
    user = get_current_user(request)
    with get_session() as session:
        tenant = session.get(Tenant, user.tenant_id)
        if not tenant:
            return {"onboarding_required": True}
        
        return {
            "onboarding_required": not tenant.onboarding_completed,
            "tenant": tenant.model_dump()
        }

async def POST(request: Request, body: OnboardingCompleteRequest, background_tasks: BackgroundTasks):
    """Mark onboarding as completed for the current user's tenant."""
    user = get_current_user(request)
    with get_session() as session:
        tenant = session.get(Tenant, user.tenant_id)
        if not tenant:
            raise HTTPException(status_code=404, detail="Tenant not found")
        
        tenant.onboarding_completed = True
        if body.name:
            tenant.name = body.name
        
        session.add(tenant)
        session.commit()
        session.refresh(tenant)
        
        # Seed default data in the background (per-tenant/cluster if applicable)
        background_tasks.add_task(ensure_default_strategies)
        background_tasks.add_task(ensure_default_essential_addons)
        
        return {"status": "success", "tenant": tenant.model_dump()}
