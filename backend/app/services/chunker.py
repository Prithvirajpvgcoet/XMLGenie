from lxml import etree


def _strip_namespaces(root):
    """Remove all XML namespaces in-place so XPaths are clean."""
    for elem in root.iter():
        if isinstance(elem.tag, str) and '{' in elem.tag:
            elem.tag = elem.tag.split('}', 1)[1]
        clean_attribs = {}
        for k, v in list(elem.attrib.items()):
            clean_key = k.split('}', 1)[1] if '{' in k else k
            clean_attribs[clean_key] = v
        elem.attrib.clear()
        elem.attrib.update(clean_attribs)


def _attrib_summary(element) -> str:
    """Recursively build a plain-English summary of all attributes in a subtree.
    This ensures the LLM can read attribute values even without XML parsing skills.
    Example: 'Payment: method=wire_transfer, total=4169.81, tax=335.83'
    """
    lines = []
    for elem in element.iter():
        tag = elem.tag
        if elem.attrib:
            pairs = ", ".join(f"{k}={v}" for k, v in elem.attrib.items())
            lines.append(f"{tag}: {pairs}")
        if elem.text and elem.text.strip():
            lines.append(f"{tag} text: {elem.text.strip()}")
    return "\n".join(lines)


def chunk_tree(tree):
    """
    Structure-aware chunking:
    1. Strip namespaces so XPaths are always clean.
    2. Always include root-level children as chunks (e.g. <Metadata>, <Orders>).
    3. Also chunk each grandchild (e.g. each <Order>) separately.
    4. Prepend a plain-text attribute summary to every chunk for LLM readability.
    """
    root = tree.getroot()
    _strip_namespaces(root)

    cleaned_xml = etree.tostring(root)
    clean_root = etree.fromstring(cleaned_xml)
    clean_tree = etree.ElementTree(clean_root)

    chunks = []

    for child in clean_root:
        grandchildren = list(child)

        # Always chunk the root-level child itself (e.g. <Metadata>, <Orders>)
        raw_xml = etree.tostring(child, encoding="unicode", pretty_print=True)
        attr_summary = _attrib_summary(child)
        chunk_text = f"[ATTRIBUTE SUMMARY]\n{attr_summary}\n\n[RAW XML]\n{raw_xml}" if attr_summary else raw_xml
        xpath = clean_tree.getpath(child)
        chunks.append({
            "xpath": xpath,
            "parent_tag": clean_root.tag,
            "text_content": chunk_text,
            "attributes": dict(child.attrib),
        })

        # Also chunk each grandchild individually (one chunk per <Order>, <Product>, etc.)
        if len(grandchildren) > 1:
            for grandchild in grandchildren:
                gc_raw = etree.tostring(grandchild, encoding="unicode", pretty_print=True)
                gc_attr = _attrib_summary(grandchild)
                gc_text = f"[ATTRIBUTE SUMMARY]\n{gc_attr}\n\n[RAW XML]\n{gc_raw}" if gc_attr else gc_raw
                gc_xpath = clean_tree.getpath(grandchild)
                chunks.append({
                    "xpath": gc_xpath,
                    "parent_tag": child.tag,
                    "text_content": gc_text,
                    "attributes": dict(grandchild.attrib),
                })

    return chunks