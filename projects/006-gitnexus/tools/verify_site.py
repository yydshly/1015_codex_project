"""Validate deployed static files and the provenance-facing sample projection."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parents[1]
SITE = ROOT / "_site/projects/006-gitnexus"


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.ids.update([attrs["id"]] if "id" in attrs else [])
        for key in ("href", "src"):
            if key in attrs:
                self.urls.append(attrs[key])


def verify():
    parser = Links()
    parser.feed((SITE / "index.html").read_text(encoding="utf-8"))
    local = []
    for url in parser.urls:
        part = urlsplit(url)
        if part.scheme or part.netloc:
            continue
        if not part.path:
            assert not part.fragment or part.fragment in parser.ids, url
            continue
        path = (SITE / unquote(part.path)).resolve()
        assert path.is_relative_to((ROOT / "_site").resolve()), url
        assert path.exists(), f"Missing asset: {url}"
        local.append(url)
    data = json.loads((SITE / "assets/evidence.json").read_text(encoding="utf-8"))
    assert data["status"] == "verified"
    ids = {node["id"] for node in data["nodes"]}
    assert len(ids) == len(data["nodes"])
    assert all(edge["source"] in ids and edge["target"] in ids for edge in data["edges"])
    files = {file["path"]: file["content"] for file in data["files"]}
    for node in data["nodes"]:
        assert node["filePath"] in files
        assert 1 <= node["startLine"] <= node["endLine"] <= len(files[node["filePath"]].splitlines())
    for path, content in files.items():
        assert (PROJECT / "src/checkout-lab" / path).read_text(encoding="utf-8") == content, path
    assert all(check["passed"] is True for check in data["checks"])
    assert data["searchStatus"] == "verified" and data["results"]["query"]["processes"]
    assert not data["results"]["query"].get("warning")
    assert data["metrics"]["verifiedCalls"] == data["metrics"]["expectedCalls"]
    result = {"status":"passed", "relativeLinks":len(local), "businessFunctions":len(ids), "callEdges":len(data["edges"]), "upstreamChecks":len(data["checks"]), "sourceSnapshotsMatch":True}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


if __name__ == "__main__":
    verify()
