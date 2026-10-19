"""Capture a pinned, read-only upstream research snapshot (standard library only)."""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import urllib.request


ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = "laoma528/awesome-zhuiju-free"
COMMIT = "d1049a3af73c068c390decc92eebe9bff84d52a0"
PATHS = [
    "README.md", "LICENSE", "CONTRIBUTING.md", "resources/README.md",
    "resources/schema.json", "resources/resources.json",
    "reports/availability.json", "reports/verifications.json",
    "scripts/check-availability.mjs", "scripts/sync-readme.mjs",
    "scripts/validate-data.mjs", "scripts/update-open-source-stats.mjs",
    ".github/workflows/check-availability.yml",
    ".github/workflows/issue-to-resource-pr.yml",
    ".github/workflows/validate-data.yml",
    ".github/workflows/update-open-source-stats.yml",
    ".github/workflows/weekly-release.yml",
]


def capture(relative):
    url = f"https://raw.githubusercontent.com/{REPOSITORY}/{COMMIT}/{relative}"
    request = urllib.request.Request(url, headers={"User-Agent": "zhuiju-product-research"})
    with urllib.request.urlopen(request, timeout=40) as response:
        data = response.read(2_000_001)
        if len(data) > 2_000_000:
            raise ValueError(f"Snapshot file exceeds 2 MB: {relative}")
    target = ROOT / "references" / "upstream" / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {"path": relative, "url": url, "bytes": len(data),
            "sha256": hashlib.sha256(data).hexdigest()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    with ThreadPoolExecutor(max_workers=5) as pool:
        files = list(pool.map(capture, PATHS))
    manifest = {"repository": f"https://github.com/{REPOSITORY}", "commit": COMMIT,
                "captured_at_utc": datetime.now(timezone.utc).isoformat(),
                "license": "CC-BY-4.0; see upstream/LICENSE and ../THIRD_PARTY.md",
                "files": files}
    path = ROOT / "references" / "upstream-manifest.json"
    path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"commit": COMMIT, "files": len(files),
                      "bytes": sum(item["bytes"] for item in files)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
