"""Check third-party integrity, import closure, adaptation scope and built local links."""

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import posixpath
import re
from urllib.parse import unquote, urlsplit
from adapt_upstream import adapt_html

ROOT = Path(__file__).resolve().parents[1]
IMPORTS = re.compile(r"(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['\"]([^'\"]+)['\"]")


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            if attrs["id"] in self.ids:
                raise ValueError("Duplicate HTML id: " + attrs["id"])
            self.ids.add(attrs["id"])
        for key in ("href", "src"):
            if attrs.get(key):
                self.urls.append(attrs[key])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--built", action="store_true")
    args = parser.parse_args()
    lock = json.loads((ROOT / "references/sources.json").read_text(encoding="utf-8"))
    for source in lock["upstream"]:
        data = (ROOT / source["path"]).read_bytes()
        assert hashlib.sha256(data).hexdigest() == source["sha256"], source["path"]
    vendor = ROOT / "web/vendor/three"
    modules = set(lock["three"]["files"])
    for name in modules:
        data = (vendor / name).read_bytes()
        assert hashlib.sha256(data).hexdigest() == lock["three"]["sha256"][name], name
        if not name.endswith(".js"):
            continue
        for specifier in IMPORTS.findall(data.decode("utf-8")):
            if specifier.startswith("."):
                target = posixpath.normpath(posixpath.join(posixpath.dirname(name), specifier))
                assert target in modules, (name, specifier)
            else:
                assert specifier == "three" or specifier.startswith("three/addons/"), (name, specifier)
    expected = adapt_html(ROOT)
    assert (ROOT / "web/vendor/obsidian/index.html").read_text(encoding="utf-8") == expected, "Unexpected upstream changes"
    assert (ROOT / "web/vendor/obsidian/LICENSE").read_bytes() == (ROOT / "references/upstream-LICENSE").read_bytes()
    export_lock = json.loads((ROOT / 'references/export-dependency.json').read_text())
    for name, sha256 in export_lock['sha256'].items():
        assert hashlib.sha256((ROOT / 'web/vendor/webm-muxer' / name).read_bytes()).hexdigest() == sha256, name
    media_lock = json.loads((ROOT / 'references/media-dependency.json').read_text())
    for name, sha256 in media_lock['sha256'].items():
        assert hashlib.sha256((ROOT / 'web/vendor/mediabunny' / name).read_bytes()).hexdigest() == sha256, name
    for module in (ROOT / "web/assets").glob("*.mjs"):
        for specifier in IMPORTS.findall(module.read_text(encoding="utf-8")):
            if specifier.startswith("."):
                assert (module.parent / specifier).resolve().is_file(), (module, specifier)
    if args.built:
        destination = ROOT.parents[1] / "_site/projects/004-obsidian"
        for html in destination.rglob("*.html"):
            links = Links()
            links.feed(html.read_text(encoding="utf-8"))
            for url in links.urls:
                parts = urlsplit(url)
                if parts.scheme or parts.netloc:
                    continue
                path = (html.parent / unquote(parts.path)).resolve() if parts.path else html
                if path.is_dir():
                    path /= "index.html"
                assert path.is_file(), (html, url)
                if not parts.path and parts.fragment:
                    assert parts.fragment in links.ids, (html, url)
        for doc in destination.glob("*.md"):
            for url in re.findall(r"(?<!!)\[[^\]]+\]\(([^)]+)\)", doc.read_text(encoding="utf-8")):
                parts = urlsplit(url)
                if parts.scheme or parts.netloc or not parts.path:
                    continue
                target = (doc.parent / unquote(parts.path)).resolve()
                assert target.is_file(), (doc, url)
        for name in ("THIRD_PARTY.md", "capabilities.md", "architecture.md", "extensions.md", "notes.md", "poster.jpg"):
            assert (destination / name).is_file(), name
        for module in (ROOT / 'web/assets').glob('*.mjs'):
            assert (destination / 'assets' / module.name).read_bytes() == module.read_bytes(), module.name
        for name in export_lock['sha256']:
            assert (destination / 'vendor/webm-muxer' / name).read_bytes() == (ROOT / 'web/vendor/webm-muxer' / name).read_bytes(), name
        for name in media_lock['sha256']:
            assert (destination / 'vendor/mediabunny' / name).read_bytes() == (ROOT / 'web/vendor/mediabunny' / name).read_bytes(), name
    print(f"Verified upstream snapshots, {len(modules)} vendored files, local adaptation" + (" and built HTML links." if args.built else "."))


if __name__ == "__main__":
    main()
