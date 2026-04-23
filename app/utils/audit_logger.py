import json
from datetime import datetime
from typing import Optional
from app.db_client.db import get_session
from app.db_client.models.ssh_management import SSHAuditLog, SSHAuditEvent
from sqlmodel import select

class AuditLogger:
    def __init__(self, session_id: str, system_id: int, user_id: str, batch_size: int = 50):
        self.session_id = session_id
        self.system_id = system_id
        self.user_id = user_id
        self.batch_size = batch_size
        self._buffer = []
        self._log_id = None
        
        # Create an initial record if it doesn't exist
        with get_session() as db:
            audit_entry = db.exec(select(SSHAuditLog).where(SSHAuditLog.session_id == self.session_id)).first()
            if not audit_entry:
                audit_entry = SSHAuditLog(
                    session_id=self.session_id,
                    system_id=self.system_id,
                    user_id=self.user_id,
                    started_at=datetime.utcnow()
                )
                db.add(audit_entry)
                db.commit()
                db.refresh(audit_entry)
            
            self._log_id = audit_entry.id

    async def log_output(self, data_chunk: str):
        """Append a PTY output chunk to the buffer with its capture timestamp"""
        self._buffer.append((datetime.utcnow(), data_chunk))
        
        # Periodically flush to DB if buffer gets large
        if len(self._buffer) >= self.batch_size:
            await self.flush()

    async def flush(self):
        """Flush buffered data to the database as event rows"""
        if not self._buffer or not self._log_id:
            return

        with get_session() as db:
            events = [
                SSHAuditEvent(
                    log_id=self._log_id,
                    data=chunk,
                    created_at=timestamp
                )
                for timestamp, chunk in self._buffer
            ]
            for event in events:
                db.add(event)
            db.commit()
                
        self._buffer = []

    async def close(self):
        """Finalize the audit log entry"""
        await self.flush()
        if self._log_id:
            with get_session() as db:
                audit_entry = db.get(SSHAuditLog, self._log_id)
                if audit_entry:
                    audit_entry.ended_at = datetime.utcnow()
                    db.add(audit_entry)
                    db.commit()
