from pydantic import BaseModel

class RetrieveRequest(BaseModel):
    document_id: int
    query: str

class RetrieveHit(BaseModel):
    chunk_id: int
    xpath: str
    text_content: str
    score: float
    source: str  # "vector" or "exact"

class RetrieveResponse(BaseModel):
    query: str
    hits: list[RetrieveHit]