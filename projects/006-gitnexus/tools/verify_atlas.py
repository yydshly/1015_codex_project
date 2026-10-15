"""Validate real evidence joins and standalone workbench production resources."""
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urlsplit

project = Path(__file__).resolve().parents[1]
site = project.parents[1] / "_site/projects/006-gitnexus"


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls, self.ids, self.modes = [], set(), []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            assert attrs["id"] not in self.ids, "Duplicate id: " + attrs["id"]
            self.ids.add(attrs["id"])
        if "data-mode" in attrs:
            self.modes.append(attrs["data-mode"])
        for key in ("href", "src"):
            if attrs.get(key):
                self.urls.append(attrs[key])


def load(name):
    return json.loads((site / "assets" / name).read_text(encoding="utf-8"))


atlas, advanced, probes = load("atlas.json"), load("advanced.json"), load("business-probes.json")
assert len(atlas["nodes"]) == 71 and len(atlas["edges"]) == 131
assert len(atlas["contexts"]) == len(atlas["impacts"]) == 10
assert len(atlas["searches"]) == 3
for graph in [atlas, *advanced["graphs"].values(), *advanced["views"].values()]:
    ids = {node["id"] for node in graph["nodes"]}
    assert len(ids) == len(graph["nodes"])
    assert all(edge["source"] in ids and edge["target"] in ids for edge in graph["edges"])
assert len(advanced["graphs"]["all"]["nodes"]) == 103
assert len(advanced["graphs"]["all"]["edges"]) == 154
assert advanced["results"]["rename"]["applied"] is False
assert len(advanced["views"]["rename"]["details"]["edits"]) == 5
assert advanced["results"]["shape_check"]["mismatches"] == 1
assert advanced["results"]["pdg_controls"]["total"] == 7
assert advanced["results"]["pdg_flows"]["total"] == 3
assert advanced["results"]["explain_callback"]["totalFindings"] == 0
assert advanced["upstream"]["tagAndNpmGitHeadMatch"] is False
assert len(probes["cases"]) == 5 and probes["fixtureRestored"]
probe = next(case for case in probes["cases"] if case["id"] == "local-110")
assert probe["before"]["shipping"] == 0 and probe["after"]["shipping"] == 900
for sample, files in [("checkout-lab", atlas["files"]), ("advanced-lab", advanced["files"])]:
    for file in files:
        assert (project / "src" / sample / file["path"]).read_text(encoding="utf-8") == file["content"]
document = Document()
document.feed((site / "assets/atlas.html").read_text(encoding="utf-8"))
assert len(set(document.modes)) == 12
for url in document.urls:
    part = urlsplit(url)
    if not part.scheme and part.path:
        assert (site / "assets" / part.path).resolve().exists(), url
    elif not part.scheme and part.fragment:
        assert part.fragment in document.ids, url
result = {"status":"passed", "modes":12,"baseGraph":{"nodes":71,"edges":131}, "advancedGraph":{"nodes":103,"edges":154}, "contexts":10,"impacts":10,"searches":3,"renameEdits":5,"pdgControls":7,"pdgFlows":3,"shapeMismatches":1,"businessProbePairs":5,"sourceSnapshotsMatch":True,"graphReferencesValid":True}
print(json.dumps(result,ensure_ascii=False,indent=2))
(project / "assets/atlas-integrity.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
