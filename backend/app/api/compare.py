from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.schemas.compare import CompareRequest, CompareResponse
from app.services.comparator import compare_documents

router = APIRouter(prefix="/api/compare", tags=["compare"])

@router.post("/", response_model=CompareResponse)
async def compare_xml(req: CompareRequest, db: AsyncSession = Depends(get_db)):
    return await compare_documents(db, req.doc_id_a, req.doc_id_b)
