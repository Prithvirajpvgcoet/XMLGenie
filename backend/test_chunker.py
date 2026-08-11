"""Quick test: verify chunker produces a Metadata chunk."""
import sys
sys.path.insert(0, '.')
from app.services.xml_parser import parse_xml_bytes
from app.services.chunker import chunk_tree

with open('../sample_data/invoices_v1.xml', 'rb') as f:
    content = f.read()

tree = parse_xml_bytes(content)
chunks = chunk_tree(tree)

print(f"Total chunks: {len(chunks)}")
for c in chunks:
    preview = c['text_content'][:80].replace('\n', ' ')
    print(f"  xpath={c['xpath']}")
    print(f"  preview={preview}")
    print()
