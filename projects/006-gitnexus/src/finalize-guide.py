"""Preserve the conversation diagram; export a self-contained SVG and matching cover."""
from hashlib import sha256
from pathlib import Path
import json
import re
import xml.etree.ElementTree as ET

project = Path(__file__).resolve().parents[1]
source = project / "web/assets/research-guide.mmd"
output = project / "web/assets/research-guide.svg"
ns = "http://www.w3.org/2000/svg"
ET.register_namespace("", ns)
tree = ET.parse(output)
root = tree.getroot()
titles = dict(re.findall(r'subgraph (\w+)\["([^"]+)"\]', source.read_text(encoding="utf-8")))
for group in root.iter(f"{{{ns}}}g"):
    if group.get("class") != "cluster" or group.get("id") not in titles:
        continue
    rect = group.find(f"{{{ns}}}rect")
    for child in list(group):
        if child.get("class") in {"cluster-label", "guide-cluster-title"}:
            group.remove(child)
    text = ET.SubElement(group, f"{{{ns}}}text", {
        "class":"guide-cluster-title", "x":str(float(rect.get("x")) + float(rect.get("width"))/2),
        "y":str(float(rect.get("y")) + 32), "text-anchor":"middle",
        "style":"font:600 20px 'Segoe UI','Microsoft YaHei',sans-serif;fill:#233a31",
    })
    text.text = titles[group.get("id")]
for child in list(root):
    if child.get("id") == "guide-background":
        root.remove(child)
x, y, width, height = root.get("viewBox").split()
background = ET.Element(f"{{{ns}}}rect", {"id":"guide-background", "x":x, "y":y, "width":width, "height":height, "fill":"#f7faf2"})
root.insert(next(i for i,node in enumerate(root) if node.tag == f"{{{ns}}}style") + 1, background)
content = ET.tostring(root, encoding="utf-8", xml_declaration=True)
assert not root.findall(f".//{{{ns}}}script")
assert not root.findall(f".//{{{ns}}}foreignObject")
output.write_bytes(content)
(project / "assets/cover.svg").write_bytes(content)
record = {"source":"Conversation overview flowchart; same labels and edges, with accessibility title and description added", "sourceFile":"web/assets/research-guide.mmd", "sourceSha256":sha256(source.read_bytes()).hexdigest(), "renderer":"mermaid@11.12.0", "renderRecipe":"src/render-guide.html, then src/finalize-guide.py", "layout":"Mermaid render with exported single-line chapter headings to avoid wrapped-title overlap", "checkedAt":"2026-10-19", "viewBox":root.get("viewBox"), "svgSha256":sha256(content).hexdigest(), "coverMatchesGuide":True, "selfContainedSvg":True, "scope":"Research understanding diagram, not a tool-generated repository graph or new experiment"}
(project / "references/guide-provenance.json").write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps({"viewBox":record["viewBox"],"coverMatchesGuide":True,"bytes":len(content)},ensure_ascii=False))
