"""Capture a small, immutable, MIT-licensed Octop source snapshot for this study."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
REPO = "TencentCloud/Octop"
FILES = [
    "README.md", "LICENSE", "pyproject.toml", "docs/architecture.md",
    "docs/expert-teams.md", "docs/acp.md", "docs/connectors.md",
    "src/octop/infra/gateway/process/processor.py",
    "src/octop/infra/cron/tools.py", "src/octop/infra/knowledge/tools.py",
    "src/octop/infra/knowledge/parse.py",
    "src/octop/infra/agents/providers/harness_factory.py",
    "src/octop/infra/agents/teams/jobs.py",
]

def get(url):
    request = Request(url, headers={"User-Agent": "Octop-Research-011", "Accept": "application/vnd.github+json"})
    with urlopen(request, timeout=40) as response:
        return response.read()

def main():
    head = json.loads(get(f"https://api.github.com/repos/{REPO}/commits/main"))
    commit = head["sha"]
    destination = ROOT / "references" / "upstream"
    def capture(path):
        payload = get(f"https://raw.githubusercontent.com/{REPO}/{commit}/{path}")
        local = destination / path
        local.parent.mkdir(parents=True, exist_ok=True)
        local.write_bytes(payload)
        return {"path": path, "bytes": len(payload), "sha256": sha256(payload).hexdigest(),
                "url": f"https://github.com/{REPO}/blob/{commit}/{path}"}
    with ThreadPoolExecutor(max_workers=5) as pool:
        files = list(pool.map(capture, FILES))
    manifest = {"repository": f"https://github.com/{REPO}", "commit": commit,
                "commit_date": head["commit"]["committer"]["date"],
                "checked_on": "2026-10-20", "captured_at": datetime.now(timezone.utc).isoformat(),
                "scope": "Documentation and selected source inspection; no Octop instance or model API run.",
                "license": "MIT; original LICENSE retained alongside the snapshot.", "files": files}
    (ROOT / "references" / "upstream-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"commit": commit, "files": len(files), "bytes": sum(f["bytes"] for f in files)}))

if __name__ == "__main__":
    main()
