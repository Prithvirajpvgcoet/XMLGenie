from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.chunk import Chunk
from app.schemas.compare import DiffItem, CompareResponse


async def compare_documents(
    db: AsyncSession,
    doc_id_a: int,
    doc_id_b: int,
) -> CompareResponse:
    """
    Compares two XML documents by their stored chunks.
    Uses XPath as the key to detect additions, removals, and modifications.
    """

    # Fetch all chunks for both documents
    result_a = await db.execute(select(Chunk).where(Chunk.document_id == doc_id_a))
    result_b = await db.execute(select(Chunk).where(Chunk.document_id == doc_id_b))

    chunks_a = {c.xpath: c.text_content for c in result_a.scalars().all()}
    chunks_b = {c.xpath: c.text_content for c in result_b.scalars().all()}

    xpaths_a = set(chunks_a.keys())
    xpaths_b = set(chunks_b.keys())

    diffs: list[DiffItem] = []

    # Removed in B (existed in A, not in B)
    for xpath in sorted(xpaths_a - xpaths_b):
        diffs.append(DiffItem(
            status="removed",
            xpath=xpath,
            value_a=chunks_a[xpath][:300],
            value_b=None
        ))

    # Added in B (not in A, exists in B)
    for xpath in sorted(xpaths_b - xpaths_a):
        diffs.append(DiffItem(
            status="added",
            xpath=xpath,
            value_a=None,
            value_b=chunks_b[xpath][:300]
        ))

    # Modified (exists in both but content differs)
    for xpath in sorted(xpaths_a & xpaths_b):
        text_a = chunks_a[xpath].strip()
        text_b = chunks_b[xpath].strip()
        if text_a != text_b:
            diffs.append(DiffItem(
                status="modified",
                xpath=xpath,
                value_a=text_a[:300],
                value_b=text_b[:300]
            ))

    added = sum(1 for d in diffs if d.status == "added")
    removed = sum(1 for d in diffs if d.status == "removed")
    modified = sum(1 for d in diffs if d.status == "modified")

    summary = (
        f"Comparing doc #{doc_id_a} vs doc #{doc_id_b}: "
        f"{added} additions, {removed} removals, {modified} modifications found."
    )

    return CompareResponse(
        doc_id_a=doc_id_a,
        doc_id_b=doc_id_b,
        total_added=added,
        total_removed=removed,
        total_modified=modified,
        summary=summary,
        diffs=diffs
    )
