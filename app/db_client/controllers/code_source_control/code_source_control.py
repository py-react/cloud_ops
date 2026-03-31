from sqlmodel import Session, select
from app.db_client.models.code_source_control.code_source_control import CodeSourceControl
from app.db_client.models.code_source_control.types import CodeSourceControlType
from typing import List, Optional

def create_code_source_control(session: Session, data: CodeSourceControlType) -> CodeSourceControl:
    docker_config_id = None if data.docker_config_id == 0 else data.docker_config_id
    obj = CodeSourceControl(
        name=data.name, 
        pat_id=data.pat_id, 
        registry_id=data.registry_id, 
        docker_config_id=docker_config_id,
        status=data.status
    )
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_code_source_controls(session: Session) -> List[CodeSourceControl]:
    return list(session.exec(select(CodeSourceControl)).all())

def get_code_source_control(session: Session, id: int) -> Optional[CodeSourceControl]:
    return session.get(CodeSourceControl, id)

def update_code_source_control_status(session: Session, id: int, status: str) -> Optional[CodeSourceControl]:
    obj = session.get(CodeSourceControl, id)
    if not obj:
        return None
    obj.status = status
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj