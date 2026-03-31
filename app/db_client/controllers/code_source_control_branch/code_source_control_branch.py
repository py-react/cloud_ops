from sqlmodel import Session, select
from app.db_client.models.code_source_control_branch.code_source_control_branch import CodeSourceControlBranch
from app.db_client.models.code_source_control_branch.types import CodeSourceControlBranchType
from typing import List

def create_code_source_control_branch(session: Session, data: CodeSourceControlBranchType) -> CodeSourceControlBranch:
    if data.docker_config_id == 0:
        data.docker_config_id = None
    obj = CodeSourceControlBranch(**data.dict())
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_code_source_control_branches(session: Session, code_source_control_id: int) -> List[CodeSourceControlBranch]:
    return session.exec(select(CodeSourceControlBranch).where(CodeSourceControlBranch.code_source_control_id == code_source_control_id)).all() 