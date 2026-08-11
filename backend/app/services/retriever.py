from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.chunk import Chunk
from app.services.embedder import embed_query
from app.core.config import settings

async def hybrid_search(db: AsyncSession, doc_id: int, query: str):
    """Combines vector similarity search with basic exact keyword/XPath lookup."""
    
    # 1. Semantic Search (Vector)
    query_vector = embed_query(query)
    
    # We use <-> operator for L2 distance (cosine similarity can be used with <=>)
    # pgvector orders by distance ascending (lowest is best match)
    stmt = (
        select(Chunk, Chunk.embedding.cosine_distance(query_vector).label("distance"))
        .where(Chunk.document_id == doc_id)
        .order_by(text("distance ASC"))
        .limit(settings.VECTOR_SEARCH_TOP_K)
    )
    
    result = await db.execute(stmt)
    vector_hits = result.all()
    
    results = []
    seen_xpaths = set()
    
    # Process vector hits
    for chunk, distance in vector_hits:
        # Convert pgvector distance (0 to 2) to a similarity score (1 to -1)
        sim_score = 1.0 - distance
        results.append({
            "chunk_id": chunk.id,
            "xpath": chunk.xpath,
            "text_content": chunk.text_content,
            "score": round(sim_score, 4),
            "source": "vector"
        })
        seen_xpaths.add(chunk.xpath)
        
    return results