from sqlmodel import Session, select, delete
from app.db_client.models.source_code_build.source_code_build import SourceCodeBuild, SourceCodeBuildLog
from app.db_client.models.source_code_build.types import SourceCodeBuildType,SourceCodeBuildWithLogsType,SourceCodeBuildLogType
from typing import List,Sequence,Optional
from itertools import _tee 
from collections import deque
import json


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
    return session.exec(select(SourceCodeBuild)).all()



def get_source_code_build(session: Session, repo_name: str, branch_name: str,last:Optional[bool]=False) -> Sequence[SourceCodeBuildWithLogsType]:
    if not last:
        build_objs = session.exec(
            select(SourceCodeBuild).where(
                SourceCodeBuild.repo_name == repo_name,
                SourceCodeBuild.branch_name == branch_name
            )
        ).all()
    else:
        build_objs = session.exec(
            select(SourceCodeBuild)
            .where(
                SourceCodeBuild.repo_name == repo_name,
                SourceCodeBuild.branch_name == branch_name
            )
            .order_by(SourceCodeBuild.id.desc())
            .limit(1)
        ).all()
    result = []
    for build in build_objs:
        log_obj = session.exec(
            select(SourceCodeBuildLog).where(SourceCodeBuildLog.build_id == build.id)
        ).all()
        result.append(
            SourceCodeBuildWithLogsType(
                **build.dict(),
                logs=[log.dict() for log in log_obj]
            )
        )
    return result

def add_build_log(session: Session, build_id: int, logs):
    # Split logs by new line, get last 100 lines, join back with new line
    if isinstance(logs,_tee):
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
            from datetime import datetime
            now = datetime.utcnow()
            if  build_obj.created_at:
                time_taken = (now - build_obj.created_at).total_seconds()
                build_obj.time_taken = time_taken
        session.add(build_obj)
        session.commit()
        session.refresh(build_obj)
    return build_obj



def safe_add_build_log(session: Session, build_id: int, message: str):
    """
    Add a build log entry, but handle missing build gracefully (no exception).
    """
    build_obj = session.get(SourceCodeBuild, build_id)
    if not build_obj:
        return None
    return add_build_log(session, build_id, message)

