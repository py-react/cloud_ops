from fastapi import Request
from app.db_client.db import get_session
from app.db_client.models.ssh_management import SSHAuditLog, SSHAuditEvent, System
from sqlmodel import select, func
import json


async def GET(request: Request):
    """List all audit log sessions ordered by most recent first, or return full keystroke data for a specific id"""
    resource_id = request.query_params.get("id")

    with get_session() as db:
        if resource_id:
            # Return single log WITH full keystroke data payload
            log = db.get(SSHAuditLog, int(resource_id))
            if not log:
                return {"error": True, "message": "Log not found"}
                
            system = db.get(System, log.system_id)
            
            # Combine legacy data and new event rows
            legacy_events = json.loads(log.keystroke_data or "[]")
            new_events = db.exec(
                select(SSHAuditEvent).where(SSHAuditEvent.log_id == log.id).order_by(SSHAuditEvent.created_at.asc())
            ).all()
            
            formatted_new_events = [
                {"t": event.created_at.isoformat(), "d": event.data}
                for event in new_events
            ]
            
            all_events = legacy_events + formatted_new_events
            
            return {
                "error": False,
                "log": {
                    "id": log.id,
                    "session_id": log.session_id,
                    "system_id": log.system_id,
                    "system_name": system.name if system else "Unknown",
                    "user_id": log.user_id,
                    "started_at": log.started_at.isoformat() if log.started_at else None,
                    "ended_at": log.ended_at.isoformat() if log.ended_at else None,
                    "duration_seconds": (
                        int((log.ended_at - log.started_at).total_seconds())
                        if log.ended_at and log.started_at else None
                    ),
                    "keystroke_count": sum(len(e.get("d", "")) for e in all_events),
                    "keystroke_events": all_events
                }
            }

        else:
            # Return list of all logs WITHOUT keystroke payload (for performance)
            logs = db.exec(select(SSHAuditLog).order_by(SSHAuditLog.started_at.desc())).all()
            systems = {s.id: s.name for s in db.exec(select(System)).all()}

            # Batch query event sizes to avoid N+1 queries
            event_sizes = db.exec(
                select(SSHAuditEvent.log_id, func.sum(func.length(SSHAuditEvent.data)))
                .group_by(SSHAuditEvent.log_id)
            ).all()
            event_size_map = {log_id: size for log_id, size in event_sizes}

            result = []
            for log in logs:
                # Combine size of legacy JSON and new event chunks
                legacy_size = sum(len(e.get("d", "")) for e in json.loads(log.keystroke_data or "[]"))
                new_size = event_size_map.get(log.id, 0)
                
                entry = {
                    "id": log.id,
                    "session_id": log.session_id,
                    "system_id": log.system_id,
                    "system_name": systems.get(log.system_id, "Unknown"),
                    "user_id": log.user_id,
                    "started_at": log.started_at.isoformat() if log.started_at else None,
                    "ended_at": log.ended_at.isoformat() if log.ended_at else None,
                    "duration_seconds": (
                        int((log.ended_at - log.started_at).total_seconds())
                        if log.ended_at and log.started_at else None
                    ),
                    "keystroke_count": legacy_size + new_size,
                }
                result.append(entry)

            return {"error": False, "logs": result}
