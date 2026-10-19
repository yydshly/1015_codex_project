"""Verify project-local documentation links and built HTTP resources."""
import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parents[1]


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"href", "src"} and value and not urlsplit(value).scheme and not value.startswith("#"):
                self.urls.append(value)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="http://127.0.0.1:8768/projects/008-boss-agent-cli/")
    base = parser.parse_args().base
    if urlsplit(base).hostname not in {"127.0.0.1", "localhost"}:
        raise ValueError("This verifier only targets the local preview server")
    docs = []
    for path in ROOT.rglob("*.md"):
        for target in re.findall(r"\]\(([^)]+)\)", path.read_text(encoding="utf-8")):
            if urlsplit(target).scheme or target.startswith("#"):
                continue
            resolved = (path.parent / unquote(target.split('#')[0])).resolve()
            if not resolved.is_relative_to(WORKSPACE.resolve()) or not resolved.exists():
                raise AssertionError(f"Missing local link: {path.name}: {target}")
            docs.append({"from": str(path.relative_to(ROOT)), "target": target, "exists": True})
    index = (ROOT / "web/index.html").read_text(encoding="utf-8")
    links = Links()
    links.feed(index)
    resources = sorted(set(["", "assets/lab.mjs", "assets/evidence.json", "assets/core-tests.json", "references/replay.json", "references/core-tests.txt", "capabilities.md", "architecture.md", "THIRD_PARTY.md", *links.urls]))
    http = []
    for relative in resources:
        url = urljoin(base, relative)
        if urlsplit(url).netloc != urlsplit(base).netloc:
            raise ValueError("Unexpected external resource")
        with urlopen(url, timeout=10) as response:
            body = response.read()
            if response.status != 200:
                raise AssertionError(f"HTTP {response.status}: {url}")
            http.append({"path": relative or "index.html", "status": response.status, "bytes": len(body)})
        if relative.startswith("assets/"):
            original = ROOT / "web" / relative
            if original.exists() and body != original.read_bytes():
                raise AssertionError(f"Built resource differs from source: {relative}")
    report = {"date": "2026-10-16", "base": base, "documentation_links": docs, "http": http,
              "summary": {"local_links": len(docs), "http_checks": len(http), "failed": 0}}
    (ROOT / "references/static-checks.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False))


if __name__ == "__main__":
    main()
