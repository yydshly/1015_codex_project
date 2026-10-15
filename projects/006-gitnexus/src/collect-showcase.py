"""Retain additional real CLI outputs for the capability showcase.

Uses an already indexed, isolated checkout-lab. Temporarily changes its free-
shipping threshold for detect-changes and restores the exact original bytes.
Never indexes or modifies the research repository's own source fixture.
"""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import time

parser = argparse.ArgumentParser()
parser.add_argument("--node", required=True)
parser.add_argument("--lab", required=True)
args = parser.parse_args()
project = Path(__file__).resolve().parents[1]
refs = project / "references"
lab = Path(args.lab).resolve()
fixture = lab / "checkout-lab"
cli = lab / "node_modules/gitnexus/dist/cli/index.js"
env = dict(os.environ, GITNEXUS_HOME=str(lab / "home"), CI="1", SCARF_ANALYTICS="false", NO_COLOR="1")
commands = []


def sanitize(value):
    value = re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", value)
    for path, replacement in [(fixture, "<LAB>/checkout-lab"), (lab, "<LAB>"), (Path.home(), "<USER_HOME>")]:
        for spelling in (str(path).replace("\\", "\\\\"), str(path), str(path).replace("\\", "/")):
            value = value.replace(spelling, replacement)
    return value


def invoke(name, arguments):
    start = time.perf_counter()
    result = subprocess.run([args.node, str(cli), *arguments], cwd=fixture, env=env,
                            capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    stdout, stderr = sanitize(result.stdout), sanitize(result.stderr)
    (refs / f"{name}.stdout.txt").write_text(stdout, encoding="utf-8")
    (refs / f"{name}.stderr.txt").write_text(stderr, encoding="utf-8")
    commands.append({"name": name, "arguments": arguments, "exitCode": result.returncode,
                     "seconds": round(time.perf_counter() - start, 3)})
    assert result.returncode == 0, stderr
    # detect-changes intentionally emits a human-readable CLI report in v1.6.12.
    # Retain that report verbatim rather than presenting invented backend JSON.
    try:
        data = json.loads(stdout)
    except json.JSONDecodeError:
        assert name == "showcase-changes" and "Changed symbols:" in stdout
        data = {"format": "cli-text", "text": stdout}
    assert not data.get("error"), data
    (refs / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{name}: exit=0", flush=True)
    return data


queries = {
    "showcase-communities": "MATCH (c:Community) RETURN c.id AS id, c.label AS label, c.heuristicLabel AS heuristicLabel, c.symbolCount AS symbolCount, c.cohesion AS cohesion ORDER BY c.id",
    "showcase-memberships": "MATCH (n)-[r:CodeRelation]->(c:Community) WHERE r.type = 'MEMBER_OF' RETURN n.id AS id, n.name AS name, n.filePath AS filePath, c.id AS communityId ORDER BY c.id, n.id",
    "showcase-processes": "MATCH (p:Process) RETURN p.id AS id, p.label AS label, p.heuristicLabel AS heuristicLabel, p.stepCount AS stepCount, p.processType AS processType ORDER BY p.id",
    "showcase-steps": "MATCH (n)-[r:CodeRelation]->(p:Process) WHERE r.type = 'STEP_IN_PROCESS' RETURN n.id AS id, n.name AS name, n.filePath AS filePath, p.id AS processId, r.step AS step ORDER BY p.id, r.step",
    "showcase-relation-types": "MATCH ()-[r:CodeRelation]->() RETURN r.type AS type, count(r) AS count ORDER BY count DESC",
}
for name, query in queries.items():
    invoke(name, ["cypher", query, "--limit", "200"])

shipping = fixture / "services/shipping.ts"
baseline_diff = subprocess.run(["git", "diff", "--name-only"], cwd=fixture,
                               capture_output=True, text=True, check=True).stdout
assert not baseline_diff.strip(), "Use a clean isolated fixture so the experiment covers only its own edit."
original = shipping.read_bytes()
assert b"subtotal >= 10000" in original
try:
    shipping.write_bytes(original.replace(b"subtotal >= 10000", b"subtotal >= 12000"))
    diff = subprocess.run(["git", "diff", "--", "services/shipping.ts"], cwd=fixture,
                          capture_output=True, text=True, encoding="utf-8", check=True).stdout
    (refs / "showcase-change.diff").write_text(diff, encoding="utf-8")
    invoke("showcase-changes", ["detect-changes", "--scope", "unstaged"])
finally:
    shipping.write_bytes(original)
assert shipping.read_bytes() == original
invoke("showcase-check", ["check", "--cycles", "--json"])
(refs / "showcase-commands.json").write_text(json.dumps(commands, ensure_ascii=False, indent=2), encoding="utf-8")
print("Isolated fixture restored; no index update or source rewrite published.")
