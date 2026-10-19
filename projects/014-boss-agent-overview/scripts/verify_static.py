"""Check local documentation, the standalone package and HTTP build resources."""
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:8773/projects/014-boss-agent-overview/"


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
        self.external_scripts = []

    def handle_starttag(self,tag,attrs):
        for name,value in attrs:
            if tag == "script" and name == "src":
                self.external_scripts.append(value)
            if name in {"href","src"} and value and not urlsplit(value).scheme and not value.startswith("#"):
                self.urls.append(value)


def main():
    docs = []
    for path in ROOT.rglob("*.md"):
        for target in re.findall(r"\]\(([^)]+)\)",path.read_text(encoding="utf-8")):
            if urlsplit(target).scheme or target.startswith("#"):
                continue
            resolved = (path.parent / unquote(target.split('#')[0])).resolve()
            if not resolved.exists():
                raise AssertionError(f"Missing local link: {path.name}: {target}")
            docs.append({"from":path.relative_to(ROOT).as_posix(),"target":target})
    parser = Links()
    parser.feed((ROOT / "web/index.html").read_text(encoding="utf-8"))
    resources = sorted(set(["", "assets/model.mjs", "assets/welfare-evidence.json", "assets/career-samples.json", "extensions.md", *parser.urls]))
    http = []
    for relative in resources:
        # Standalone is validated on disk; file-protocol browser navigation is not attempted.
        if relative == "assets/standalone.html":
            continue
        url = urljoin(BASE,relative)
        if urlsplit(url).netloc != urlsplit(BASE).netloc:
            raise AssertionError("Unexpected external URL")
        with urlopen(url,timeout=10) as response:
            content = response.read()
            if response.status != 200:
                raise AssertionError(url)
            http.append({"path":relative or "index.html","status":response.status,"bytes":len(content)})
        if relative.startswith("assets/") and (ROOT / "web" / relative).exists():
            assert content == (ROOT / "web" / relative).read_bytes(), relative
    standalone = (ROOT / "web/assets/standalone.html").read_text(encoding="utf-8")
    packed = Links()
    packed.feed(standalone)
    assert not packed.external_scripts
    assert '<link rel="stylesheet"' not in standalone
    payload = re.search(r'<script id="offline-data" type="application/json">(.*?)</script>',standalone,re.S)
    embedded = json.loads(payload.group(1))
    assert len(embedded["welfare"]["jobs"]) == 8
    assert len(embedded["careers"]["samples"]) == 9
    report = {"date":"2026-10-20","documentation_links":docs,"http":http,
              "standalone_structure":{"external_runtime_assets":0,"embedded_jobs":8,"embedded_career_samples":9,"file_protocol_browser_tested":False},
              "summary":{"documentation_links":len(docs),"http_resources":len(http),"failed":0}}
    (ROOT / "references/static-checks.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report["summary"],ensure_ascii=False))


if __name__ == "__main__":
    main()
