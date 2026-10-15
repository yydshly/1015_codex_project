"""Verify the published page, runtime resources, documents and exact guide image."""

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
from urllib.parse import urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
IMPORTS = re.compile(r"(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)['\"]([^'\"]+)['\"]")


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        for name in ("src", "href"):
            value = values.get(name, "")
            if value and not urlsplit(value).scheme and not value.startswith(("#", "../../")):
                self.paths.add(urlsplit(value).path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", default="https://yydshly.github.io/1015_codex_project/")
    parser.add_argument("--output", type=Path, default=ROOT / "assets/deployed-verification.json")
    args = parser.parse_args()
    prefix = "projects/004-obsidian/"
    paths = {"", prefix, "assets/004-obsidian/obsidian-understanding.png"}
    links = Links()
    links.feed((ROOT / "web/index.html").read_text(encoding="utf-8"))
    paths.update(prefix + value for value in links.paths)
    for module in (ROOT / "web/assets").glob("*.mjs"):
        paths.add(prefix + "assets/" + module.name)
        for specifier in IMPORTS.findall(module.read_text(encoding="utf-8")):
            if specifier.startswith("."):
                path = (module.parent / specifier).resolve().relative_to(ROOT / "web")
                paths.add(prefix + path.as_posix())
    for path in (ROOT / "web/vendor/three").rglob("*.js"):
        paths.add(prefix + path.relative_to(ROOT / "web").as_posix())
    paths.update(prefix + name for name in [
        "assets/understanding/obsidian-understanding.png", "vendor/obsidian/LICENSE",
        "vendor/three/LICENSE", "vendor/mediabunny/LICENSE", "vendor/mediabunny/src/index.ts",
    ])
    expected_png = hashlib.sha256((ROOT / "assets/obsidian-understanding.png").read_bytes()).hexdigest()
    powershell = (shutil.which("pwsh") or shutil.which("powershell")) if os.name == "nt" else None

    def verify(path):
        url = urljoin(args.base, path)
        if powershell:
            # Use Windows' verified .NET HTTPS path. Never disable certificate checks.
            with tempfile.NamedTemporaryFile(prefix="obsidian-http-", suffix=".bin", delete=False) as output:
                target = Path(output.name)
            try:
                environment = dict(os.environ, OBSIDIAN_VERIFY_URL=url, OBSIDIAN_VERIFY_FILE=str(target))
                script = "$ErrorActionPreference = 'Stop'; $obsidianResult = Invoke-WebRequest -Uri $env:OBSIDIAN_VERIFY_URL -OutFile $env:OBSIDIAN_VERIFY_FILE -PassThru -TimeoutSec 40; [Console]::Write($obsidianResult.StatusCode)"
                for attempt in range(2):
                    response = subprocess.run([powershell, "-NoProfile", "-NonInteractive", "-Command", script],
                                              env=environment, capture_output=True)
                    if response.returncode == 0:
                        break
                    if attempt:
                        raise RuntimeError(url + ": " + response.stderr.decode(errors="replace")[-1200:])
                    time.sleep(1)
                data = target.read_bytes()
                status = int(response.stdout.strip())
            finally:
                target.unlink(missing_ok=True)
        else:
            with urlopen(Request(url, headers={"User-Agent": "Obsidian-Research-Verification"}), timeout=40) as response:
                data = response.read()
                status = response.status
        assert status == 200, (url, status)
        row = {"path": path or "/", "status": status, "bytes": len(data)}
        if path.endswith("obsidian-understanding.png"):
            row["sha256"] = hashlib.sha256(data).hexdigest()
            assert row["sha256"] == expected_png, "Published guide differs: " + url
        if path == prefix:
            assert '一张图，读懂我们的研究结论'.encode() in data
        if not path:
            assert b'004-obsidian' in data and '目标采样匹配'.encode() in data
        return row

    checks, errors = [], []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(verify, path): path for path in sorted(paths)}
        for future in as_completed(futures):
            try:
                checks.append(future.result())
            except Exception as error:
                errors.append({"path": futures[future], "error": str(error)})
            if (len(checks) + len(errors)) % 10 == 0:
                print(f"Checked {len(checks) + len(errors)} / {len(paths)} resources; failures: {len(errors)}", flush=True)
    result = {
        "page": urljoin(args.base, prefix) + "#understanding",
        "demo": urljoin(args.base, prefix) + "#demo",
        "content_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT).decode().strip(),
        "checks": sorted(checks, key=lambda item: item["path"]),
        "errors": errors,
        "guide_sha256": expected_png,
    }
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if errors:
        for error in errors:
            print(error["path"], error["error"])
        raise SystemExit(f"Verification failed for {len(errors)} resources.")
    print(f"Verified {len(checks)} published resources; both guide PNG copies match the generated original.")


if __name__ == "__main__":
    main()
