from pydantic import BaseModel

class ChatRequest(BaseModel):
    document_id: int
    message: str
    thread_id: str | None = None  # To keep track of conversation history

class ChatResponse(BaseModel):
    thread_id: str
    response: str
