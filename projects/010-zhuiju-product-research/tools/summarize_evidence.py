"""Recompute local snapshot statistics and index historical project 007 evidence."""

from collections import Counter
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT.parent / "007-zhuiju-source-demo"


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def main():
    manifest = read(ROOT / "references/upstream-manifest.json")
    for item in manifest["files"]:
        data = (ROOT / "references/upstream" / item["path"]).read_bytes()
        if hashlib.sha256(data).hexdigest() != item["sha256"]:
            raise ValueError(f"Upstream snapshot hash mismatch: {item['path']}")
    resources = read(ROOT / "references/upstream/resources/resources.json")["resources"]
    availability = read(ROOT / "references/upstream/reports/availability.json")
    source_scan = read(DEMO / "assets/source-scan.json")
    api_probes = read(DEMO / "assets/api-probes.json")
    live = read(DEMO / "assets/live-verification.json")
    browser = read(DEMO / "assets/browser-verification.json")
    evidence_files = ["README.md", "notes.md", "source.json", "server.py", "web/app.js",
                      "tests/test_adapter.py", "assets/source-scan.json", "assets/api-probes.json",
                      "assets/playback-samples.json", "assets/live-verification.json",
                      "assets/browser-verification.json", "assets/ffprobe.json",
                      "assets/demo-playback-verified.jpg"]
    evidence = []
    for relative in evidence_files:
        path = DEMO / relative
        data = path.read_bytes()
        evidence.append({"project_relative_path": "../007-zhuiju-source-demo/" + relative,
                         "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    summary = {
        "compiled_at_utc": datetime.now(timezone.utc).isoformat(),
        "research_date_asia_shanghai": "2026-10-16",
        "upstream_commit": manifest["commit"],
        "upstream_snapshot_hashes_verified": len(manifest["files"]),
        "catalog": {"records": len(resources), "featured": sum(bool(x["featured"]) for x in resources),
                    "categories": dict(Counter(x["category"] for x in resources)),
                    "verification_status": dict(Counter(x["verification"]["status"] for x in resources)),
                    "submitted_by": dict(Counter(x["source"]["submitted_by"] for x in resources))},
        "homepage_availability": {"generated_at": availability["generated_at"],
                                  "checked_records": len(availability["results"]),
                                  "statuses": dict(Counter(x["status"] for x in availability["results"])),
                                  "scope": "Historical upstream HTTP checks, not video playback tests"},
        "historical_demo": {"project": "007-zhuiju-source-demo", "config_read_records": len(source_scan["results"]),
                            "http_api_call_records": len(api_probes["results"]),
                            "live_report_at": live["verified_at"], "checks": len(live["checks"]),
                            "passed": sum(x["ok"] for x in live["checks"]),
                            "browser_final_revision": browser["final_revision"],
                            "new_live_playback_test_in_this_project": False},
        "evidence_files": evidence,
        "limitations": ["Source reports are historical and may become stale.",
                        "No full-episode, all-catalog, multi-region, concurrency, commercial-rights or profit validation.",
                        "Filmhub onboarding, pricing and agreements were not obtained."]
    }
    target = ROOT / "references/evidence-summary.json"
    target.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"catalog_records": len(resources), "featured": summary["catalog"]["featured"],
                      "upstream_hashes_verified": len(manifest["files"]), "historical_checks": len(live["checks"]),
                      "historical_passed": summary["historical_demo"]["passed"], "evidence_files": len(evidence)}))


if __name__ == "__main__":
    main()
