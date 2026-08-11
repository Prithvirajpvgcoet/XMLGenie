from langchain_core.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session
from app.services.retriever import hybrid_search
from app.services.comparator import compare_documents
from sqlalchemy import select
from app.models.chunk import Chunk

MAX_CHUNK_CHARS = 600  # Enough for attribute summaries without hitting token limits


@tool
async def search_xml_document(document_id: int, query: str) -> str:
    """Use this tool to search the XML document for specific information using semantic search.
    Always call this before answering. Use precise keywords from the user's question.
    For aggregate questions (total, count, period), use the keyword 'Metadata' as the query.
    """
    async with async_session() as db:
        hits = await hybrid_search(db, document_id, query)

        # If the query is about totals/counts/period, also forcefully fetch the Metadata chunk
        meta_keywords = ["total", "count", "revenue", "period", "how many", "bundle", "generated"]
        if any(kw in query.lower() for kw in meta_keywords):
            meta_result = await db.execute(
                select(Chunk)
                .where(Chunk.document_id == document_id)
                .where(Chunk.xpath.ilike('%Metadata%'))
                .limit(1)
            )
            meta_chunk = meta_result.scalar_one_or_none()
            if meta_chunk:
                meta_hit = {
                    "xpath": meta_chunk.xpath,
                    "text_content": meta_chunk.text_content,
                    "score": 1.0,
                    "source": "exact"
                }
                # Prepend metadata chunk so the LLM sees it first
                existing_xpaths = {h['xpath'] for h in hits}
                if meta_chunk.xpath not in existing_xpaths:
                    hits = [meta_hit] + hits

    if not hits:
        return "No relevant information found in the document."

    results = []
    for hit in hits:
        # Truncate very long chunks to reduce token usage
        text = hit['text_content']
        if len(text) > MAX_CHUNK_CHARS:
            text = text[:MAX_CHUNK_CHARS] + "... [truncated]"
        results.append(f"XPath: {hit['xpath']}\nContent:\n{text}")

    return "\n---\n".join(results)


@tool
async def compare_xml_documents(doc_id_a: int, doc_id_b: int) -> str:
    """
    Use this tool to compare two XML documents and find differences.
    Returns a structured summary of additions, removals, and modifications.
    """
    async with async_session() as db:
        result = await compare_documents(db, doc_id_a, doc_id_b)

    if not result.diffs:
        return f"Documents #{doc_id_a} and #{doc_id_b} are identical — no differences found."

    lines = [result.summary, ""]

    added = [d for d in result.diffs if d.status == "added"]
    removed = [d for d in result.diffs if d.status == "removed"]
    modified = [d for d in result.diffs if d.status == "modified"]

    if added:
        lines.append(f"=== ADDED ({len(added)}) ===")
        for d in added[:5]:
            lines.append(f"+ {d.xpath}\n  {d.value_b[:150]}")

    if removed:
        lines.append(f"\n=== REMOVED ({len(removed)}) ===")
        for d in removed[:5]:
            lines.append(f"- {d.xpath}\n  {d.value_a[:150]}")

    if modified:
        lines.append(f"\n=== MODIFIED ({len(modified)}) ===")
        for d in modified[:5]:
            lines.append(f"~ {d.xpath}\n  BEFORE: {d.value_a[:100]}\n  AFTER:  {d.value_b[:100]}")

    return "\n".join(lines)
