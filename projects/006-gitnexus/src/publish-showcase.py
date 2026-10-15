"""Project retained real Cypher/CLI output into the capability exhibit."""
import json
from pathlib import Path
import re

project = Path(__file__).resolve().parents[1]
refs = project / "references"


def read(name):
    return json.loads((refs / f"{name}.json").read_text(encoding="utf-8-sig"))


def rows(name):
    lines = read(name)["markdown"].splitlines()
    headers = [value.strip() for value in lines[0].strip("|").split("|")]
    return [dict(zip(headers, [value.strip() for value in line.strip("|").split("|")]))
            for line in lines[2:] if line.startswith("|")]


communities = rows("showcase-communities")
members = rows("showcase-memberships")
processes = rows("showcase-processes")
steps = rows("showcase-steps")
for community in communities:
    community["symbolCount"] = int(community["symbolCount"])
    community["cohesion"] = float(community["cohesion"])
    community["members"] = [member for member in members if member["communityId"] == community["id"]]
    assert len(community["members"]) == community["symbolCount"]
for process in processes:
    process["stepCount"] = int(process["stepCount"])
    process["steps"] = [dict(step, step=int(step["step"])) for step in steps if step["processId"] == process["id"]]
    assert [step["step"] for step in process["steps"]] == list(range(1, process["stepCount"] + 1))
node_types = [dict(row, count=int(row["count"])) for row in rows("graph-counts")]
relation_types = [dict(row, count=int(row["count"])) for row in rows("showcase-relation-types")]
text = read("showcase-changes")["text"]
counts = re.search(r"Changes: (\d+) files, (\d+) symbols", text)
affected = re.search(r"Affected processes: (\d+)", text)
risk = re.search(r"Risk level: (\w+)", text)
assert counts and affected and risk
assert "calculateShipping" in text and "SubmitOrder → CalculateShipping" in text
data = {
    "status": "verified", "version": "1.6.12", "sample": "checkout-lab",
    "provenance": "Additional read-only Cypher queries and CLI checks on the existing isolated index. Layout and Chinese explanations belong to this exhibit.",
    "nodeTypes": node_types, "relationTypes": relation_types,
    "communities": communities, "processes": processes,
    "changes": {
        "changedFiles": int(counts[1]), "changedSymbols": int(counts[2]),
        "affectedProcesses": int(affected[1]), "risk": risk[1],
        "symbol": "calculateShipping", "filePath": "services/shipping.ts",
        "processId": "proc_3_submitorder", "rawFormat": "cli-text", "rawText": text,
        "diff": (refs / "showcase-change.diff").read_text(encoding="utf-8"),
        "fixtureRestored": True,
    },
    "check": read("showcase-check"), "commands": read("showcase-commands"),
    "raw": [f"references/{name}.json" for name in (
        "showcase-communities", "showcase-memberships", "showcase-processes", "showcase-steps",
        "showcase-relation-types", "showcase-changes", "showcase-check")],
}
assert sum(row["count"] for row in node_types) == 71
assert sum(row["count"] for row in relation_types) == 131
assert len(communities) == len(processes) == 4
assert data["changes"]["changedSymbols"] == data["changes"]["affectedProcesses"] == 1
(project / "web/assets/showcase.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print("Published 4 real communities, 4 process traces, 1 diff analysis and structural check.")
