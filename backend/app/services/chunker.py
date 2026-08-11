from lxml import etree

def chunk_tree(tree):
    """Structure-aware chunking: chunks by immediate children of the root."""
    chunks = []
    root = tree.getroot()
    
    # We chunk at depth 1 (e.g., each <Order> inside <Orders>)
    for i, child in enumerate(root):
        chunk_text = etree.tostring(child, encoding="unicode", pretty_print=True)
        xpath = tree.getpath(child)
        
        chunks.append({
            "xpath": xpath,
            "parent_tag": root.tag.split("}")[-1], # Strip namespace
            "text_content": chunk_text,
            "attributes": dict(child.attrib)
        })
    return chunks