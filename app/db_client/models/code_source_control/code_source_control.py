from sqlmodel import SQLModel, Field
from typing import Optional

class CodeSourceControl(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True)
    pat_id: Optional[int] = Field(default=None, foreign_key="githubpat.id")