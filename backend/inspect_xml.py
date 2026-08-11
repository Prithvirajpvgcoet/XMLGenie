from lxml import etree
import io

with open('../sample_data/invoices_v1.xml', 'rb') as f:
    content = f.read()

parser = etree.XMLParser(resolve_entities=False, no_network=True)
tree = etree.parse(io.BytesIO(content), parser)
root = tree.getroot()
print('Root tag:', root.tag)
print('Root children count:', len(list(root)))
for child in root:
    print(' CHILD:', child.tag)
    for gc in child:
        print('   GC:', gc.tag)
