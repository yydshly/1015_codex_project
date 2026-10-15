"""Vendor the pinned work and only its transitive Three.js module dependencies."""

import base64
import hashlib
import io
import json
from pathlib import Path, PurePosixPath
import posixpath
import re
import tarfile
from urllib.request import Request, urlopen
from adapt_upstream import adapt_html, CHANGES

ROOT = Path(__file__).resolve().parents[1]
COMMIT = "74510f112c0a7e4318f688b851523105ec4f79e4"
VERSION = "0.186.1"
INTEGRITY = "sha512-blFeqb49wRCSGUGj7gtpfnSGHy2lwDk94RhUmS1c/hTby70kvChbWpkJ4Pm1390LqzzvTmzgXKHPEafJwCb8jA=="
IMPORTS = re.compile(r"(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['\"]([^'\"]+)['\"]")


def fetch(url):
    with urlopen(Request(url, headers={"User-Agent": "Obsidian-Research/1.0"}), timeout=60) as response:
        return response.read()


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return {"path": path.relative_to(ROOT).as_posix(), "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}


def main():
    evidence = []
    upstream = {}
    for name in ("index.html", "README.md", "LICENSE"):
        url = f"https://raw.githubusercontent.com/iamtechartist/obsidian/{COMMIT}/{name}"
        data = fetch(url)
        upstream[name] = data
        entry = save(ROOT / "references" / ("upstream-" + name), data)
        evidence.append({**entry, "source": url})
    html = upstream["index.html"].decode("utf-8")
    entries = ["build/three.module.js"]
    entries += ["examples/jsm/" + path for path in re.findall(r"from ['\"]three/addons/([^'\"]+)", html)]
    package_url = f"https://registry.npmjs.org/three/-/three-{VERSION}.tgz"
    archive = fetch(package_url)
    digest = base64.b64encode(hashlib.sha512(archive).digest()).decode()
    if "sha512-" + digest != INTEGRITY:
        raise ValueError("Three.js package integrity mismatch")
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as package:
        pending, visited, module_hashes = entries + ["LICENSE"], set(), {}
        while pending:
            name = pending.pop()
            if name in visited:
                continue
            visited.add(name)
            if ".." in PurePosixPath(name).parts or name.startswith("/"):
                raise ValueError("Dependency escaped package")
            member = package.getmember("package/" + name)
            if not member.isfile():
                raise ValueError("Expected a regular package file")
            data = package.extractfile(member).read()
            save(ROOT / "web" / "vendor" / "three" / name, data)
            module_hashes[name] = hashlib.sha256(data).hexdigest()
            if name.endswith(".js"):
                for specifier in IMPORTS.findall(data.decode("utf-8")):
                    if specifier.startswith("."):
                        pending.append(posixpath.normpath(posixpath.join(posixpath.dirname(name), specifier)))
                    elif specifier == "three":
                        pending.append("build/three.module.js")
                    elif specifier.startswith("three/addons/"):
                        pending.append("examples/jsm/" + specifier[len("three/addons/"):])
    html = adapt_html(ROOT)
    save(ROOT / "web" / "vendor" / "obsidian" / "index.html", html.encode("utf-8"))
    save(ROOT / "web" / "vendor" / "obsidian" / "LICENSE", upstream["LICENSE"])
    save(ROOT / "web" / "vendor" / "obsidian" / "README.md", upstream["README.md"])
    lock = {"research_date": "2026-10-15", "repository": "https://github.com/iamtechartist/obsidian", "commit": COMMIT,
            "upstream": evidence, "three": {"version": VERSION, "tarball": package_url, "integrity": INTEGRITY, "files": sorted(visited), "sha256": dict(sorted(module_hashes.items()))},
            "local_changes": CHANGES}
    save(ROOT / "references" / "sources.json", (json.dumps(lock, ensure_ascii=False, indent=2) + "\n").encode())
    print(f"Pinned Obsidian {COMMIT[:7]}; Three.js {VERSION}, {len(visited)} local files.")


if __name__ == "__main__":
    main()
