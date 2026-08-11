import pytest
from app.services.xml_parser import parse_xml_bytes
from app.services.chunker import chunk_tree

@pytest.mark.asyncio
async def test_chunk_tree_attribute_extraction():
    xml_content = b'''<?xml version="1.0"?>
    <Root>
        <Order id="ORD-123" status="delivered">
            <Customer name="Alice" />
            <Item sku="A1" />
        </Order>
        <Order id="ORD-124" status="pending">
            <Customer name="Bob" />
        </Order>
    </Root>'''
    
    tree = parse_xml_bytes(xml_content)
    chunks = chunk_tree(tree)
    
    # We expect 3 chunks: The root <Root> wrapper, and each <Order> (grandchild logic)
    # Actually, root children are <Order>s. 
    # Because <Root> has 2 children (<Order>), the chunker chunks the children.
    # Wait, the chunker chunks root-level children AND their grandchildren if multiple.
    # Root children here are <Order> elements.
    
    # Let's find the chunks that correspond to the orders
    order_chunks = [c for c in chunks if "ORD-123" in c["text_content"]]
    assert len(order_chunks) > 0
    
    chunk_text = order_chunks[-1]["text_content"]
    assert "[ATTRIBUTE SUMMARY]" in chunk_text
    assert "Order: id=ORD-123, status=delivered" in chunk_text
    assert "Customer: name=Alice" in chunk_text
    assert "Item: sku=A1" in chunk_text
    assert "[RAW XML]" in chunk_text
