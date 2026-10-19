"""Extract a small, attributable, dependency-free slice of the pinned upstream."""

import argparse
import ast
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
COMMIT = "7f46ba37c654d5f7675bb1328158030d7604847c"
REPO = "https://github.com/can4hou6joeng4/boss-agent-cli"
SLICES = {
    "src/boss_agent_cli/search_filters.py": (
        "upstream_welfare.py", "",
        ["WELFARE_KEYWORDS", "resolve_welfare_keywords", "_check_welfare_in_text", "match_all_welfare"],
    ),
    "src/boss_agent_cli/api/cdp_risk_lock.py": (
        "upstream_risk_lock.py", "import hashlib\nfrom dataclasses import dataclass\n",
        ["ABSENT_STOKEN", "hash_stoken", "RiskLock"],
    ),
}


def extract(upstream):
    actual = subprocess.check_output(["git", "-C", str(upstream), "rev-parse", "HEAD"], text=True).strip()
    if actual != COMMIT:
        raise ValueError(f"Expected {COMMIT}; got {actual}")
    if subprocess.check_output(["git", "-C", str(upstream), "diff", "HEAD", "--", *SLICES], text=True).strip():
        raise ValueError("Upstream source files have local changes")
    (ROOT / "src").mkdir(exist_ok=True)
    (ROOT / "licenses").mkdir(exist_ok=True)
    (ROOT / "references").mkdir(exist_ok=True)
    records = []
    for relative, (output, imports, names) in SLICES.items():
        source = (upstream / relative).read_text(encoding="utf-8")
        lines = source.splitlines(keepends=True)
        parts, spans = [], []
        for node in ast.parse(source).body:
            name = getattr(node, "name", None)
            if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
                name = node.target.id
            if isinstance(node, ast.Assign) and isinstance(node.targets[0], ast.Name):
                name = node.targets[0].id
            if name not in names:
                continue
            start = min([node.lineno] + [decorator.lineno for decorator in getattr(node, "decorator_list", [])])
            parts.append("".join(lines[start - 1:node.end_lineno]).rstrip())
            spans.append({"symbol": name, "start": start, "end": node.end_lineno})
        if {item["symbol"] for item in spans} != set(names):
            raise ValueError(f"Missing requested symbols in {relative}")
        header = (
            "# Extracted verbatim from boss-agent-cli, Copyright (c) 2026 can4hou6joeng4.\n"
            "# MIT License: ../licenses/boss-agent-cli-MIT.txt\n"
            f"# Source: {REPO}/blob/{COMMIT}/{relative}\n"
            "# Only standalone symbols are retained; imports below are extraction scaffolding.\n\n"
        )
        target = ROOT / "src" / output
        target.write_text(header + imports + "\n\n".join(parts) + "\n", encoding="utf-8", newline="\n")
        records.append({
            "path": relative, "sha256_utf8_lf": hashlib.sha256(source.encode()).hexdigest(),
            "url": f"{REPO}/blob/{COMMIT}/{relative}", "symbols": spans,
            "local": f"src/{output}", "local_sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
        })
    license_text = (upstream / "LICENSE").read_text(encoding="utf-8")
    (ROOT / "licenses/boss-agent-cli-MIT.txt").write_text(license_text, encoding="utf-8", newline="\n")
    manifest = {"repository": REPO, "commit": COMMIT, "version": "3.0.0", "research_date": "2026-10-15", "extraction": records}
    (ROOT / "references/source-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Extracted {sum(len(r['symbols']) for r in records)} upstream symbols from {COMMIT[:7]}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("upstream", type=Path)
    extract(parser.parse_args().upstream.resolve())
