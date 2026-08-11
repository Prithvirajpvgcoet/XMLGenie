from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.document import Document
from app.models.chunk import Chunk
from app.schemas.document import DocumentResponse
from app.services.xml_parser import parse_xml_bytes, get_node_count
from app.services.chunker import chunk_tree

router = APIRouter(prefix="/api/upload", tags=["upload"])

@router.post("/", response_model=DocumentResponse, status_code=201)
async def upload_xml(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename.endswith(".xml"):
        raise HTTPException(400, "Only XML files allowed")
    
    content = await file.read()
    try:
        tree = parse_xml_bytes(content)
    except Exception as e:
        raise HTTPException(400, f"Invalid XML: {str(e)}")

    root_tag = tree.getroot().tag.split("}")[-1]
    node_count = get_node_count(tree)

    # 1. Save Document metadata
    doc = Document(filename=file.filename, root_tag=root_tag, node_count=node_count)
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # 2. Chunk, Embed, and save
    from app.services.embedder import embed_texts
    chunks = chunk_tree(tree)
    
    # Get texts to embed (the raw XML chunks)
    texts_to_embed = [c["text_content"] for c in chunks]
    
    # Generate vectors in one batch
    vectors = embed_texts(texts_to_embed)
    
    for c_data, vector in zip(chunks, vectors):
        chunk = Chunk(
            document_id=doc.id,
            xpath=c_data["xpath"],
            parent_tag=c_data["parent_tag"],
            text_content=c_data["text_content"],
            attributes=c_data["attributes"],
            embedding=vector  # <-- Now we save the vector to pgvector!
        )
        db.add(chunk)
    
    await db.commit()
    return doc
