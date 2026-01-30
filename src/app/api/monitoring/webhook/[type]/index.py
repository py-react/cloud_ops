from fastapi import Request
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

# Global storage for alert logs
# Limit to last 50 alerts
ALERT_LOGS = []
MAX_LOGS = 50

async def POST(request: Request, type: str) -> dict:
    """
    Receives alerts, prints to terminal, and stores them in global memory.
    """
    try:
        data = await request.json()
        now = datetime.now().strftime("%H:%M:%S")
        
        # Check X-Forwarded-For for accurate source when behind a proxy
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_host = forwarded_for.split(",")[0].strip()
        else:
            client_host = request.client.host if request.client else "unknown"
        
        # 1. Print to terminal for instant dev feedback
        print("\n" + "="*60)
        print(f"🚨 ALERT RECEIVED - CATEGORY: {type.upper()}")
        print(f"SOURCE: {client_host}")
        print(f"TIME: {now}")
        print(f"PAYLOAD: {json.dumps(data, indent=2)}")
        print("="*60 + "\n")
        
        # 2. Store in memory for UI visualization
        alert_entry = {
            "id": f"{int(datetime.timestamp(datetime.now()) * 1000)}",
            "type": type,
            "source": client_host,
            "time": now,
            "data": data,
            "status": data.get("status", "unknown")
        }
        
        ALERT_LOGS.insert(0, alert_entry)
        if len(ALERT_LOGS) > MAX_LOGS:
            ALERT_LOGS.pop()
            
        logger.info(f"🚨 ALERT RECEIVED - CATEGORY: {type.upper()}")
        
        return {
            "success": True, 
            "message": f"Alert categorization '{type}' processed and stored",
            "type_received": type
        }
    except Exception as e:
        logger.error(f"Error in Alertmanager webhook ({type}): {str(e)}")
        return {"success": False, "message": str(e)}

async def GET(request: Request, type: str = "all") -> dict:
    """
    Retrieve stored alert logs.
    """
    try:
        # Filter by type if requested, but for simplicity we'll just return all
        return {
            "success": True,
            "logs": ALERT_LOGS,
            "count": len(ALERT_LOGS)
        }
    except Exception as e:
        logger.error(f"Error fetching alert logs: {str(e)}")
        return {"success": False, "message": str(e)}
