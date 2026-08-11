from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.retrieve import RetrieveRequest, RetrieveResponse
from app.services.retriever import hybrid_search

router = APIRouter(prefix="/api/retrieve", tags=["retrieve"])

@router.post("/", response_model=RetrieveResponse)
async def retrieve_chunks(req: RetrieveRequest, db: AsyncSession = Depends(get_db)):
    hits = await hybrid_search(db, req.document_id, req.query)
    
    return RetrieveResponse(
        query=req.query,
        hits=hits
    )