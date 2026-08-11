import os
from fastapi import APIRouter, HTTPException
from lxml import etree
from app.schemas.document import TreeResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])

def build_tree(element) -> dict:
    tag = element.tag.split('}')[-1] if '{' in element.tag else element.tag
    clean_attribs = {k.split('}')[-1] if '{' in k else k: v for k, v in element.attrib.items()}
    node = {
        "name": tag,
        "attributes": clean_attribs,
        "text": element.text.strip() if element.text and element.text.strip() else None,
        "children": [build_tree(c) for c in element]
    }
    return node

@router.get("/{document_id}/tree")
async def get_document_tree(document_id: int):
    file_path = f"uploads/{document_id}.xml"
    if not os.path.exists(file_path):
        raise HTTPException(404, "Document not found")
        
    try:
        tree = etree.parse(file_path)
        root = tree.getroot()
        tree_data = build_tree(root)
        return {"tree": tree_data}
    except Exception as e:
        raise HTTPException(500, f"Error parsing document: {str(e)}")
