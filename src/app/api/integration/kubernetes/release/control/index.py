from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.k8s_helper.deployment_with_strategy.release_orchestrator import ReleaseOrchestrator
from app.db_client.db import get_session
from typing import Optional, Dict

async def GET(request: Request, namespace: str = "default"):
    """
    List active releases (canary/blue-green).
    """
    try:
        with get_session() as session:
            orchestrator = ReleaseOrchestrator(session)
            releases = orchestrator.list_active_releases(namespace)
            return {
                "status": "success",
                "data": releases
            }
    except Exception as e:
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)

async def POST(request: Request):
    """
    Handle release actions: update weights, promote, or rollback.
    """
    try:
        body = await request.json()
        action = body.get("action", "weight") # Default to weight for backward compatibility
        namespace = body.get("namespace", "default")
        
        with get_session() as session:
            orchestrator = ReleaseOrchestrator(session)
            
            if action == "weight":
                route_name = body.get("route_name")
                weights = body.get("weights", {})
                if not route_name or not weights:
                    raise HTTPException(status_code=400, detail="route_name and weights are required")
                result = orchestrator.update_weights(namespace, route_name, weights)
            
            elif action == "promote":
                name = body.get("name")
                if not name:
                    raise HTTPException(status_code=400, detail="Deployment name is required")
                result = orchestrator.promote_canary(name, namespace)
                
            elif action == "rollback":
                name = body.get("name")
                if not name:
                    raise HTTPException(status_code=400, detail="Deployment name is required")
                result = orchestrator.rollback_canary(name, namespace)
            
            else:
                raise HTTPException(status_code=400, detail=f"Invalid action: {action}")
            
            if "successfully" in result.lower():
                return {"status": "success", "message": result}
            else:
                return JSONResponse(content={"status": "error", "message": result}, status_code=400)
                
    except Exception as e:
        print(e)
        return JSONResponse(content={"status": "error", "message": str(e)}, status_code=500)
