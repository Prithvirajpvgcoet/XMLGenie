from pydantic import BaseModel
from datetime import datetime

class DocumentResponse(BaseModel):
    id: int
    filename: str
    root_tag: str | None
    node_count: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class TreeResponse(BaseModel):
    tree: dict