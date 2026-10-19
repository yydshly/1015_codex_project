"""Replay actual upstream pure functions on synthetic inputs; no network or login."""

import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))
from upstream_welfare import WELFARE_KEYWORDS, match_all_welfare, resolve_welfare_keywords
from upstream_risk_lock import RiskLock, hash_stoken


def main():
    manifest = json.loads((ROOT / "references/source-manifest.json").read_text(encoding="utf-8"))
    for record in manifest["extraction"]:
        actual = hashlib.sha256((ROOT / record["local"]).read_bytes()).hexdigest()
        if actual != record["local_sha256"]:
            raise AssertionError(f"Extracted source changed: {record['local']}")
    fixtures = json.loads((ROOT / "src/fixtures.json").read_text(encoding="utf-8"))
    probes = []
    for probe in fixtures["probes"]:
        conditions = [(name, resolve_welfare_keywords(name)) for name in probe["conditions"]]
        matches = match_all_welfare(conditions, probe["tags"], probe["text"])
        hit = bool(matches)
        probes.append({**probe, "matches": matches, "actual": hit, "agrees_with_annotation": hit == probe["expected_semantics"]})
    same = hash_stoken("synthetic-session-A")
    changed = hash_stoken("synthetic-session-B")
    lock = RiskLock(same, 0)
    lock_checks = [
        {"case": "same-token", "actual": lock.matches(same), "expected": True},
        {"case": "changed-token", "actual": lock.matches(changed), "expected": False},
        {"case": "unknown-current-token", "actual": lock.matches(None), "expected": True},
        {"case": "corrupt-lock", "actual": RiskLock(None, 0, corrupt=True).matches(changed), "expected": True},
    ]
    assert all(item["actual"] == item["expected"] for item in lock_checks)
    search_combinations = []
    for city in ["杭州", "上海", ""]:
        for labels in [[], ["双休"], ["五险一金"], ["双休", "五险一金"]]:
            conditions = [(name, resolve_welfare_keywords(name)) for name in labels]
            ids = [job["id"] for job in fixtures["jobs"] if (not city or city == job["city"]) and (not labels or match_all_welfare(conditions, job["tags"], job["description"]))]
            search_combinations.append({"city": city, "conditions": labels, "expected_ids": ids})
    report = {
        "research_date": "2026-10-16", "commit": manifest["commit"], "mode": "offline-actual-upstream-functions",
        "live_platform_requests": 0, "llm_requests": 0, "fixture_origin": fixtures["provenance"],
        "welfare_keywords": WELFARE_KEYWORDS, "jobs": fixtures["jobs"], "probes": probes,
        "risk_lock_checks": lock_checks, "search_combinations": search_combinations,
        "summary": {"probes": len(probes), "semantic_agreements": sum(p["agrees_with_annotation"] for p in probes),
                    "known_mismatches": sum(not p["agrees_with_annotation"] for p in probes), "risk_lock_checks_passed": len(lock_checks)},
        "limitations": ["合成案例有意包含反例，不代表真实岗位准确率。", "RiskLock 只验证本地判断，无法证明 BOSS 服务端解除限制。", "未验证登录、真实搜索、触达、浏览器链路或大模型质量。"],
    }
    content = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    (ROOT / "references/replay.json").write_text(content, encoding="utf-8")
    (ROOT / "web/assets").mkdir(parents=True, exist_ok=True)
    (ROOT / "web/assets/evidence.json").write_text(content, encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False))
    print("4 upstream risk-lock checks passed; platform requests=0; LLM requests=0")


if __name__ == "__main__":
    main()
