from lxml import etree
import io

def parse_xml_bytes(content: bytes):
    parser = etree.XMLParser(resolve_entities=False, no_network=True) # Security: prevent XML bombs
    tree = etree.parse(io.BytesIO(content), parser)
    return tree

def get_node_count(tree) -> int:
    return sum(1 for _ in tree.iter())