"""Verify the published static research, never profile or execute upstream software."""
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
from urllib.request import Request, urlopen
import argparse
import hashlib
import json
import sys

PROJECT = Path(__file__).resolve().parents[1]
BASE = "https://yydshly.github.io/1015_codex_project/projects/009-tracy-performance/"


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = set()

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        for key in ("href", "src"):
            value = attributes.get(key, "")
            parts = urlsplit(value)
            if parts.path and not parts.scheme and not parts.netloc:
                self.references.add(unquote(parts.path))


def digest(payload):
    return hashlib.sha256(payload).hexdigest()


def fetch(url, version):
    request = Request(url + ("?v=" + version if version else ""), headers={"User-Agent": "Tracy-Research-009-Verification"})
    with urlopen(request, timeout=45) as response:
        if response.status != 200:
            raise ValueError(f"Unexpected HTTP status: {response.status}")
        return response.read()


def local_file(relative):
    if relative in ("index.html", "styles.css", "app.js") or relative.startswith("assets/"):
        target = PROJECT / "web" / relative
    else:
        target = PROJECT / relative
    if not target.resolve().is_relative_to(PROJECT.resolve()):
        raise ValueError(f"Unexpected relative path: {relative}")
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--commit", default="")
    parser.add_argument("--run-id", default="")
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    html = (PROJECT / "web/index.html").read_text(encoding="utf-8")
    links = Links()
    links.feed(html)
    paths = {"index.html", "architecture.md", "extensions.md", "references/tracy-BSD-3-Clause.txt", "references/upstream.json"} | links.references

    def check(relative):
        url = urljoin(BASE, "" if relative == "index.html" else relative)
        try:
            payload = fetch(url, args.commit)
            original = local_file(relative).read_bytes()
            # Git normalizes text newlines on Linux Pages builds.
            binary = Path(relative).suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".gif")
            normalize = (lambda value: value) if binary else (lambda value: value.replace(b"\r\n", b"\n"))
            matches = normalize(payload) == normalize(original)
            return {"path": relative, "url": url, "status": 200, "matches_local": matches, "sha256": digest(payload)}
        except Exception as error:
            return {"path": relative, "url": url, "error": str(error), "matches_local": False}

    with ThreadPoolExecutor(max_workers=5) as pool:
        checks = list(pool.map(check, sorted(paths)))
    root_url = urljoin(BASE, "../../")
    navigation = fetch(root_url, args.commit).decode("utf-8")
    navigation_ok = all(value in navigation for value in ("projects/009-tracy-performance/", "assets/009-tracy-performance/understanding-map.png", "运行时性能瓶颈", "编码 Agent"))
    cover_url = urljoin(root_url, "assets/009-tracy-performance/understanding-map.png")
    guide = fetch(cover_url, args.commit)
    original_guide = (PROJECT / "web/assets/understanding-map.png").read_bytes()
    guide_ok = guide == original_guide == (PROJECT / "assets/understanding-map.png").read_bytes()
    all_passed = all(item["matches_local"] for item in checks) and navigation_ok and guide_ok
    result = {"checked_on": "2026-10-19", "timezone": "Asia/Shanghai", "commit": args.commit, "run_id": args.run_id, "workflow_url": f"https://github.com/yydshly/1015_codex_project/actions/runs/{args.run_id}" if args.run_id else "", "url": BASE, "scope": "已发布研究网页、静态资源与引导图；不验证上游性能或自动修复效果。", "checks": checks, "navigation_verified": navigation_ok, "guide_matches_original": guide_ok, "guide_sha256": digest(guide), "http_check_count": len(checks)+2, "all_passed": all_passed}
    if args.output:
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps({"all_passed": all_passed, "http_check_count": len(checks)+2, "navigation_verified": navigation_ok, "guide_matches_original": guide_ok, "errors": [item for item in checks if not item["matches_local"]]}, ensure_ascii=False))
    if not all_passed:
        sys.exit(1)


if __name__ == "__main__":
    main()
