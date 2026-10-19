"""Record small, reproducible provenance records; never run upstream programs."""

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path
import urllib.request

PROJECT = Path(__file__).resolve().parents[1]
REPOSITORIES = {
    "tracy": "wolfpld/tracy",
    "profiler-md": "TomerAberbach/profiler-md",
    "agr": "JoaquinMulet/Artificial-General-Research",
    "paracodex": "Scientific-Computing-Lab/ParaCodex",
    "atrex": "alibaba/atrex-kernel-agent",
}


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "Tracy-Research-009"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def record(item):
    key, repository = item
    result = {"key": key, "repository": repository, "url": f"https://github.com/{repository}"}
    try:
        metadata = json.loads(fetch(f"https://api.github.com/repos/{repository}"))
        branch = metadata["default_branch"]
        commit = json.loads(fetch(f"https://api.github.com/repos/{repository}/commits/{branch}"))
        result.update({
            "branch": branch,
            "commit": commit["sha"],
            "commit_url": commit["html_url"],
            "commit_date": commit["commit"]["committer"]["date"],
            "license": (metadata.get("license") or {}).get("spdx_id"),
        })
        if key == "tracy":
            try:
                release = json.loads(fetch(f"https://api.github.com/repos/{repository}/releases/latest"))
                result["release"] = release["tag_name"]
                result["release_url"] = release["html_url"]
            except Exception as error:
                result["release_error"] = str(error)
            license_text = fetch(f"https://raw.githubusercontent.com/{repository}/{commit['sha']}/LICENSE")
            (PROJECT / "licenses").mkdir(exist_ok=True)
            (PROJECT / "licenses" / "tracy-BSD-3-Clause.txt").write_text(license_text, encoding="utf-8")
            (PROJECT / "references").mkdir(exist_ok=True)
            (PROJECT / "references" / "tracy-BSD-3-Clause.txt").write_text(license_text, encoding="utf-8")
    except Exception as error:
        result["error"] = str(error)
    return result


def main():
    with ThreadPoolExecutor(max_workers=5) as pool:
        repositories = list(pool.map(record, REPOSITORIES.items()))
    data = {
        "checked_at": datetime.now(timezone.utc).isoformat(),
        "scope": "Repository metadata and documentation only; no upstream profiler or AI optimization was executed.",
        "repositories": repositories,
    }
    (PROJECT / "references").mkdir(exist_ok=True)
    (PROJECT / "references" / "upstream.json").write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    (PROJECT / "web" / "assets").mkdir(exist_ok=True)
    (PROJECT / "web" / "assets" / "upstream.js").write_text(
        "window.UPSTREAM_RESEARCH = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    for item in repositories:
        print(f"{item['key']}: {item.get('commit', item.get('error', 'unavailable'))}")


if __name__ == "__main__":
    main()
