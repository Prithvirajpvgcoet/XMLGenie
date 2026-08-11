from pydantic import BaseModel

class CompareRequest(BaseModel):
    doc_id_a: int
    doc_id_b: int
    query: str | None = None  # Optional focus query

class DiffItem(BaseModel):
    status: str   # "added" | "removed" | "modified" | "unchanged"
    xpath: str
    value_a: str | None = None
    value_b: str | None = None

class CompareResponse(BaseModel):
    doc_id_a: int
    doc_id_b: int
    total_added: int
    total_removed: int
    total_modified: int
    summary: str
    diffs: list[DiffItem]
