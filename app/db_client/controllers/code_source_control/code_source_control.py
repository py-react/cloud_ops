from sqlmodel import Session, select
from app.db_client.models.code_source_control.code_source_control import CodeSourceControl
from app.db_client.models.code_source_control.types import CodeSourceControlType
from typing import List

def create_code_source_control(session: Session, data: CodeSourceControlType) -> CodeSourceControl:
    obj = CodeSourceControl(name=data.name)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_code_source_controls(session: Session) -> List[CodeSourceControl]:
    return session.exec(select(CodeSourceControl)).all()

def get_code_source_control(session: Session, id: int) -> CodeSourceControl:
    return session.get(CodeSourceControl, id) 