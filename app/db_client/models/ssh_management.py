from sqlmodel import SQLModel, Field, Column, Relationship
from sqlalchemy.dialects.postgresql import JSONB, BOOLEAN, TIMESTAMP, TEXT
from typing import Optional, List, Dict
from datetime import datetime

class Group(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    description: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(TIMESTAMP))

class SSHKey(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    public_key: str = Field(sa_column=Column(TEXT))
    user_id: str = Field(index=True)  # Reference to external user system
    is_active: bool = Field(default=True, sa_column=Column(BOOLEAN))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(TIMESTAMP))
    last_used_at: Optional[datetime] = Field(default=None, sa_column=Column(TIMESTAMP))

class System(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    hostname: str = Field()
    ip_address: str = Field()
    username: Optional[str] = Field(default="root")
    password: Optional[str] = Field(default=None)
    private_key: Optional[str] = Field(default=None, sa_column=Column(TEXT))  # User-provided identity key
    os_type: str = Field(default="linux")  # linux, windows
    connection_type: str = Field(default="ssh")  # ssh, rdp
    connection_port: int = Field(default=22)  # 22 for SSH, 3389 for RDP
    provider: Optional[str] = Field(default=None)  # aws, azure, etc.
    status: str = Field(default="active")
    service_key_deployed: bool = Field(default=False, sa_column=Column(BOOLEAN))  # Bastion identity key installed
    default_key_id: Optional[int] = Field(default=None)  # FK to SSHKey used for connection
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(TIMESTAMP))
    deleted_at: Optional[datetime] = Field(default=None, sa_column=Column(TIMESTAMP))

class SystemAccess(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    system_id: int = Field(foreign_key="system.id")
    user_id: Optional[str] = Field(default=None, index=True)
    group_id: Optional[int] = Field(default=None, foreign_key="group.id")
    access_level: str = Field(default="user")  # user, admin
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(TIMESTAMP))

class SSHAuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    system_id: int = Field(foreign_key="system.id")
    user_id: str = Field(index=True)
    keystroke_data: Optional[str] = Field(default=None, sa_column=Column(TEXT)) # Legacy JSON storage
    started_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(TIMESTAMP))
    ended_at: Optional[datetime] = Field(default=None, sa_column=Column(TIMESTAMP))

    events: List["SSHAuditEvent"] = Relationship(back_populates="log")

class SSHAuditEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    log_id: int = Field(foreign_key="sshauditlog.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(TIMESTAMP, index=True))
    data: str = Field(sa_column=Column(TEXT)) # The specific PTY chunk

    log: SSHAuditLog = Relationship(back_populates="events")

class UserGroupLink(SQLModel, table=True):
    user_id: str = Field(primary_key=True)
    group_id: int = Field(foreign_key="group.id", primary_key=True)

class KeyDeployment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    key_id: int = Field(foreign_key="sshkey.id", index=True)
    system_id: int = Field(foreign_key="system.id", index=True)
    linux_username: str = Field(index=True)
    privilege_level: str = Field(default="user")  # user, sudo, root
    status: str = Field(default="pending")  # pending, active, failed, revoking, revoke_failed
    last_error: Optional[str] = Field(default=None, sa_column=Column(TEXT))
    
    # Store dynamic restrictions as JSON
    restrictions: Optional[Dict] = Field(default=None, sa_column=Column(JSONB))
    
    is_system_managed: bool = Field(default=False)  # If true, Bastion created this user account
    
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(TIMESTAMP))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(TIMESTAMP))
