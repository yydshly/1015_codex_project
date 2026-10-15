"""Export the complete existing checkout-lab graph and per-function tool runs."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import time

parser = argparse.ArgumentParser()
parser.add_argument("--node", required=True)
parser.add_argument("--lab", required=True)
args = parser.parse_args()
project = Path(__file__).resolve().parents[1]
refs = project / "references"
lab = Path(args.lab).resolve()
fixture = lab / "checkout-lab"
cli = lab / "node_modules/gitnexus/dist/cli/index.js"
env = dict(os.environ, GITNEXUS_HOME=str(lab / "home"), CI="1", SCARF_ANALYTICS="false", NO_COLOR="1")
commands = []


def invoke(name, arguments):
    started = time.perf_counter()
    result = subprocess.run([args.node, str(cli), *arguments], cwd=fixture, env=env,
                            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    def clean(text):
        text = re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", text)
        for path, label in [(fixture, "<LAB>/checkout-lab"), (lab, "<LAB>"), (Path.home(), "<USER_HOME>")]:
            for spelling in (str(path).replace("\\", "\\\\"), str(path), str(path).replace("\\", "/")):
                text = text.replace(spelling, label)
        return text
    stdout, stderr = clean(result.stdout), clean(result.stderr)
    (refs / f"atlas-{name}.stdout.txt").write_text(stdout, encoding="utf-8")
    (refs / f"atlas-{name}.stderr.txt").write_text(stderr, encoding="utf-8")
    data = json.loads(stdout)
    assert result.returncode == 0 and not data.get("error"), (name, stderr, data)
    (refs / f"atlas-{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    commands.append({"name":name,"arguments":arguments,"exitCode":result.returncode,"seconds":round(time.perf_counter()-started,3)})
    print(name, flush=True)
    return data


def rows(data):
    lines = data["markdown"].splitlines()
    headers = [part.strip() for part in lines[0].strip("|").split("|")]
    return [dict(zip(headers, [part.strip() for part in line.strip("|").split("|")])) for line in lines[2:] if line.startswith("|")]


raw_nodes = invoke("nodes", ["cypher", "MATCH (n) RETURN n.id AS id, labels(n) AS kind, n.name AS name, n.filePath AS filePath, n.startLine AS startLine, n.endLine AS endLine, n.label AS label ORDER BY n.id", "--limit", "500"])
raw_edges = invoke("edges", ["cypher", "MATCH (a)-[r:CodeRelation]->(b) RETURN a.id AS source, b.id AS target, r.type AS type, r.confidence AS confidence, r.step AS step ORDER BY a.id, b.id, r.type", "--limit", "500"])
nodes = rows(raw_nodes)
for node in nodes:
    node["name"] = node["name"] if node["name"] not in ("", "null") else node["label"] if node["label"] not in ("", "null") else node["id"].split(":")[-1]
    for field in ("startLine", "endLine"):
        node[field] = int(node[field]) + 1 if node[field].lstrip("-").isdigit() else None
    node["filePath"] = "" if node["filePath"] == "null" else node["filePath"]
edges = rows(raw_edges)
for index, edge in enumerate(edges):
    edge["id"] = f"edge-{index}"
    edge["confidence"] = float(edge["confidence"]) if edge["confidence"] not in ("", "null") else None
    edge["step"] = int(edge["step"]) if edge["step"].isdigit() else None
business = json.loads((project / "web/assets/evidence.json").read_text(encoding="utf-8"))
contexts, impacts = {}, {}
for index, node in enumerate(business["nodes"]):
    contexts[node["id"]] = invoke(f"context-{index}", ["context", node["name"], "--file", node["filePath"], "--content"])
    impacts[node["id"]] = invoke(f"impact-{index}", ["impact", node["name"], "--file", node["filePath"], "--direction", "upstream", "--depth", "4"])
searches = []
for query in ("shipping checkout order", "inventory stock validate", "discount subtotal"):
    searches.append({"query":query,"result":invoke(f"query-{len(searches)}",["query",query,"--limit","5","--content"])})
assert len(nodes) == 71 and len(edges) == 131
ids = {node["id"] for node in nodes}
assert all(edge["source"] in ids and edge["target"] in ids for edge in edges)
data = {"status":"verified","version":"1.6.12","sample":"checkout-lab", "nodes":nodes,"edges":edges,"contexts":contexts,"impacts":impacts,"searches":searches,"files":business["files"],"commands":commands,"raw":{"nodes":"references/atlas-nodes.json","edges":"references/atlas-edges.json"},"lineNumbers":"one-based; Cypher lines normalized from zero-based"}
data["upstream"] = json.loads((refs / "advanced-provenance.json").read_text(encoding="utf-8")) if (refs / "advanced-provenance.json").exists() else {"artifact": "npm:gitnexus@1.6.12", "sourceEquivalence": "not-established"}
(refs / "atlas-commands.json").write_text(json.dumps(commands,ensure_ascii=False,indent=2),encoding="utf-8")
(project / "web/assets/atlas.json").write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding="utf-8")
print(f"Complete graph: {len(nodes)} nodes / {len(edges)} edges; 10 contexts / 10 impacts / 3 searches")
