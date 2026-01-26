from pydantic import BaseModel

class CodeSourceControlType(BaseModel):
    name: str
    pat_id: int = None 