from langchain_core.tools import tool
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session
from app.services.retriever import hybrid_search

@tool
async def search_xml_document(document_id: int, query: str) -> str:
    """Use this tool to search the XML document for specific information."""
    async with async_session() as db:
        hits = await hybrid_search(db, document_id, query)
        
    if not hits:
        return "No relevant information found in the document."
        
    # Format hits for the LLM
    results = []
    for hit in hits:
        results.append(f"XPath: {hit['xpath']}\nContent:\n{hit['text_content']}")
        
    return "\n---\n".join(results)
