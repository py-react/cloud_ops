from sqlmodel import SQLModel, Field
from typing import Optional

class CodeSourceControlBranch(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code_source_control_id: int = Field(foreign_key="codesourcecontrol.id")
    branch: str 