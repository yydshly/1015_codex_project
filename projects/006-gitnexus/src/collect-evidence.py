"""Run installed GitNexus against the isolated checkout-lab and retain real output.

Usage: python collect-evidence.py --node <node-24> --cli <installed-gitnexus/dist/cli/index.js> --lab <temporary-root>
See references/run-report.md for the pinned installation and platform binary setup.
The temporary root must already contain a Git-initialized copy of checkout-lab.
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
parser.add_argument("--cli", required=True)
parser.add_argument("--lab", required=True)
args = parser.parse_args()
project = Path(__file__).resolve().parents[1]
refs = project / "references"
refs.mkdir(exist_ok=True)
lab = Path(args.lab).resolve()
fixture = lab / "checkout-lab"
env = os.environ.copy()
env.update(GITNEXUS_HOME=str(lab / "home"), CI="1", SCARF_ANALYTICS="false", NO_COLOR="1")
commands = []

def sanitize(text):
    text = re.sub(r"\x1b\[[0-9;]*[A-Za-z]", "", text)
    for old, new in [(str(fixture), "<LAB>/checkout-lab"), (str(lab), "<LAB>"), (str(project), "<PROJECT>"), (str(Path.home()), "<USER_HOME>")]:
        text = text.replace(old.replace("\\", "\\\\"), new).replace(old, new).replace(old.replace("\\", "/"), new)
    return text

def invoke(name, cli_args):
    started = time.perf_counter()
    proc = subprocess.run([args.node, args.cli, *cli_args], cwd=fixture, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120)
    elapsed = round(time.perf_counter() - started, 3)
    stdout, stderr = sanitize(proc.stdout), sanitize(proc.stderr)
    (refs / f"{name}.stdout.txt").write_text(stdout, encoding="utf-8")
    (refs / f"{name}.stderr.txt").write_text(stderr, encoding="utf-8")
    display = "gitnexus " + " ".join("'" + value.replace("'", "''") + "'" for value in cli_args)
    command = {"name": name, "arguments": cli_args, "command": display, "exitCode": proc.returncode, "seconds": elapsed, "stdout": f"references/{name}.stdout.txt", "stderr": f"references/{name}.stderr.txt"}
    commands.append(command)
    try:
        result = json.loads(stdout)
    except json.JSONDecodeError:
        result = {"error": "CLI did not return JSON", "stdout": stdout, "stderr": stderr}
    (refs / f"{name}.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{name}: exit={proc.returncode}, {elapsed}s", flush=True)
    return result

queries = {
    "context": ["context", "calculateShipping", "--file", "services/shipping.ts", "--content"],
    "impact": ["impact", "calculateShipping", "--file", "services/shipping.ts", "--direction", "upstream", "--depth", "3"],
    "query": ["query", "shipping checkout order", "--limit", "5", "--content"],
    "trace": ["trace", "submitOrder", "saveOrder", "--from-file", "routes/order.ts", "--to-file", "storage/orders.ts"],
    "customer-context": ["context", "validate", "--file", "services/customer.ts"],
    "inventory-context": ["context", "validate", "--file", "services/inventory.ts"],
    "graph-nodes": ["cypher", "MATCH (n:Function) RETURN n.id AS id, n.name AS name, n.filePath AS filePath, n.startLine AS startLine, n.endLine AS endLine ORDER BY n.filePath, n.startLine", "--limit", "200"],
    "graph-edges": ["cypher", "MATCH (a:Function)-[r:CodeRelation {type: 'CALLS'}]->(b:Function) RETURN a.id AS source, b.id AS target, r.type AS type, r.confidence AS confidence ORDER BY a.id, b.id", "--limit", "200"],
    "graph-counts": ["cypher", "MATCH (n) RETURN labels(n) AS label, count(n) AS count ORDER BY count DESC", "--limit", "100"],
}
results = {name: invoke(name, command) for name, command in queries.items()}
(refs / "commands.json").write_text(json.dumps(commands, ensure_ascii=False, indent=2), encoding="utf-8")
(refs / "collected-results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
metadata = json.loads((fixture / ".gitnexus/gitnexus.json").read_text(encoding="utf-8-sig"))
(refs / "analyze-metadata.json").write_text(sanitize(json.dumps(metadata, ensure_ascii=False, indent=2)), encoding="utf-8")
verification = subprocess.run([args.node, "--experimental-strip-types", str(project / "src/checkout-lab/verify.ts")], capture_output=True, text=True, encoding="utf-8", check=True)
(refs / "business-checks.json").write_text(verification.stdout, encoding="utf-8")
if (lab / "package-lock.json").exists():
    (refs / "runtime-package-lock.json").write_text(sanitize((lab / "package-lock.json").read_text(encoding="utf-8")), encoding="utf-8")
print("Collected actual CLI output; inspect schemas before publishing evidence.json.")
