import pytest
from app.services.xml_parser import parse_xml_bytes
from lxml.etree import XMLSyntaxError

@pytest.mark.asyncio
async def test_parse_valid_xml():
    xml_content = b'<?xml version="1.0"?><Root><Child>Hello</Child></Root>'
    tree = parse_xml_bytes(xml_content)
    assert tree.getroot().tag == "Root"

@pytest.mark.asyncio
async def test_parse_invalid_xml():
    xml_content = b'<?xml version="1.0"?><Root><Child>Hello</Root>' # Missing closing Child tag
    with pytest.raises(XMLSyntaxError):
        parse_xml_bytes(xml_content)

@pytest.mark.asyncio
async def test_xml_bomb_protection():
    # Billion laughs attack payload
    xml_bomb = b'''<?xml version="1.0"?>
    <!DOCTYPE lolz [
     <!ENTITY lol "lol">
     <!ELEMENT lolz (#PCDATA)>
     <!ENTITY lol1 "&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;&lol;">
     <!ENTITY lol2 "&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;&lol1;">
     <!ENTITY lol3 "&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;&lol2;">
     <!ENTITY lol4 "&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;&lol3;">
    ]>
    <lolz>&lol4;</lolz>'''
    
    # Since resolve_entities=False, it should parse fast and not expand
    # or it might throw an exception depending on lxml configuration.
    # The main thing is it shouldn't hang or eat memory.
    tree = parse_xml_bytes(xml_bomb)
    root = tree.getroot()
    # It should not resolve &lol4; into billions of "lol"s.
    text = root.text or ""
    assert "lol" not in text * 100 # Quick sanity check
