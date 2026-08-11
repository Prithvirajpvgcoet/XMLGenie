from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from app.db.base import Base
from pgvector.sqlalchemy import Vector

class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    xpath = Column(String, nullable=False)
    parent_tag = Column(String)
    text_content = Column(String, nullable=False)
    attributes = Column(JSON, default={})
    embedding = Column(Vector(768))  # 768 for Gemini, 1536 for OpenAI etc.