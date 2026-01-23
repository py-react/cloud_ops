from sqlmodel import Session, select, delete, desc, asc
from app.db_client.models.source_code_build.source_code_build import SourceCodeBuild, SourceCodeBuildLog
from app.db_client.models.source_code_build.types import SourceCodeBuildType,SourceCodeBuildWithLogsType,SourceCodeBuildLogType
from typing import List,Optional
from collections import deque
import json
from datetime import datetime


def parse_docker_build_logs(logs):
    lines = []
    image_id = None

    for entry in logs:
        if 'stream' in entry:
            # Split multiline chunks just in case
            stream_lines = entry['stream'].splitlines()
            lines.extend(line.strip() for line in stream_lines if line.strip())
        elif 'aux' in entry and 'ID' in entry['aux']:
            image_id = entry['aux']['ID']

    return {
        "lines": lines,        # Cleaned log lines
        "image_id": image_id   # Final built image ID
    }



def create_source_code_build(session: Session, data: SourceCodeBuildType) -> SourceCodeBuild:
    obj = SourceCodeBuild(**data.dict())
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def list_source_code_builds(session: Session) -> List[SourceCodeBuild]:
    return list(session.exec(select(SourceCodeBuild)).all())

def get_source_code_build(session: Session, repo_name: Optional[str] = None,base_branch:Optional[str]=None, branch_name: Optional[str]=None,last:Optional[bool]=False,build_id=None) -> list[SourceCodeBuildWithLogsType]:
    # 1. Start the base query
    statement = select(SourceCodeBuild)

    # 2. Apply filters dynamically
    if build_id:
        statement = statement.where(SourceCodeBuild.id == build_id)
    else:
        if repo_name:
            statement = statement.where(SourceCodeBuild.repo_name == repo_name)
        if base_branch:
            statement = statement.where(SourceCodeBuild.base_branch_name == base_branch)
        if branch_name:
            statement = statement.where(SourceCodeBuild.branch_name == branch_name)
        
        # Apply ordering if we might need the "last" one
        statement = statement.order_by(desc(SourceCodeBuild.id))

    # 3. Handle the 'last' flag
    if last:
        statement = statement.limit(1)

    build_objs = session.exec(statement).all()

    # 4. Construct results
    result = []
    for build in build_objs:
        # Optimization Tip: Consider using a relationship attribute like `build.logs` 
        # if defined in your SQLModel to avoid this extra query.
        log_statement = (
            select(SourceCodeBuildLog)
            .where(SourceCodeBuildLog.build_id == build.id)
            .order_by(asc(SourceCodeBuildLog.created_at))
        )
        logs = session.exec(log_statement).all()
        
        result.append(
            SourceCodeBuildWithLogsType(
                **build.model_dump(), # .dict() is deprecated in Pydantic v2
                logs=[SourceCodeBuildLogType(**log.model_dump()) for log in logs]
            )
        )
    return result

def get_source_code_build_by_id(session: Session, build_id: int) -> Optional[SourceCodeBuild]:
    statement = select(SourceCodeBuild)
    statement = statement.where(SourceCodeBuild.id == build_id)
    return session.exec(statement).first()

def get_last_build_for_pr(session: Session,base_branch:str,branch_name:str, pull_request_number: str) -> Optional[SourceCodeBuild]:
    """Return the last SourceCodeBuild for the given repo_full_name and PR number, or None."""
    builds = session.exec(
        select(SourceCodeBuild)
        .where(
            SourceCodeBuild.base_branch_name == base_branch,
            SourceCodeBuild.branch_name == branch_name,
            SourceCodeBuild.pull_request_number == str(pull_request_number)
        )
        .order_by(desc(SourceCodeBuild.id))
        .limit(1)
    ).all()
    return builds[0] if builds else None

def update_pr_head_sha(session: Session, pull_request_number: str, pr_head_sha: str,base_branch:str,branch_name:str) -> Optional[SourceCodeBuild]:
    build_obj = get_last_build_for_pr(session,branch_name=branch_name,base_branch=base_branch, pull_request_number=pull_request_number)
    if build_obj:
        build_obj.pr_head_sha = pr_head_sha
        session.add(build_obj)
        session.commit()
        session.refresh(build_obj)
    return build_obj

def add_build_log(session: Session, build_id: int, logs):
    # Split logs by new line, get last 100 lines, join back with new line
    if type(logs) == list:
        lines = deque(logs, maxlen=100)
        # Now last_logs contains the final 100 log lines
        # Optionally, parse or filter them
        cleaned_logs = []
        for log in lines:
            if isinstance(log, dict):
                cleaned_logs.append(log)
            else:
                try:
                    parsed = json.loads(log)
                    cleaned_logs.append(parsed)
                except Exception:
                    continue  # skip malformed lines
        parsed_logs = parse_docker_build_logs(cleaned_logs)
        processed_logs = '\n'.join(parsed_logs["lines"])
        log = SourceCodeBuildLog(build_id=build_id, logs=processed_logs)
        session.add(log)
        session.commit()
        return log
    else:
        log = SourceCodeBuildLog(build_id=build_id, logs=logs)
        session.add(log)
        session.commit()
        return log
        

def update_source_code_build_status(session: Session, build_id: int, status: str):
    build_obj = session.get(SourceCodeBuild, build_id)
    if build_obj:
        build_obj.status = status
        # If status is 'success', update timeTook attribute
        if status == "success":
            now = datetime.utcnow()
            if  build_obj.created_at:
                time_taken = (now - build_obj.created_at).total_seconds()
                build_obj.time_taken = time_taken
        session.add(build_obj)
        session.commit()
        session.refresh(build_obj)
    return build_obj

def update_source_code_build_time_taken(session: Session, build_id: int):
    build_obj = session.get(SourceCodeBuild, build_id)
    if build_obj:
        now = datetime.utcnow()
        if  build_obj.created_at:
            time_taken = (now - build_obj.created_at).total_seconds()
            build_obj.time_taken = time_taken
        session.add(build_obj)
        session.commit()
        session.refresh(build_obj)
    return build_obj



def safe_add_build_log(session: Session, build_id: int, message: list[str] | str):
    """
    Add a build log entry, but handle missing build gracefully (no exception).
    """
    build_obj = session.get(SourceCodeBuild, build_id)
    if not build_obj:
        return None
    return add_build_log(session, build_id, message)

