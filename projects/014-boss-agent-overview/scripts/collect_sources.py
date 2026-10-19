"""Record a fixed public source snapshot, without accessing BOSS or user sessions."""
import ast
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
from pathlib import Path
import re
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
COMMIT = "4716ee1d211533db70ac7cc1ab2322eb269b43a0"
REPOSITORY = "https://github.com/can4hou6joeng4/boss-agent-cli"
FILES = ["README.md", "pyproject.toml", "LICENSE", "docs/capability-matrix.md", "docs/platform-risk.md",
         "src/boss_agent_cli/api/client.py", "src/boss_agent_cli/api/browser_client.py",
         "src/boss_agent_cli/search_filters.py", "src/boss_agent_cli/ai/service.py", "src/boss_agent_cli/api/cdp_risk_lock.py",
         "src/boss_agent_cli/api/_base_client.py", "src/boss_agent_cli/api/endpoints.py",
         "src/boss_agent_cli/auth/manager.py", "src/boss_agent_cli/crawler/transport.py"]


def fetch(path):
    request = urllib.request.Request(f"https://raw.githubusercontent.com/can4hou6joeng4/boss-agent-cli/{COMMIT}/{path}", headers={"User-Agent":"Codex-Repository-Research"})
    with urllib.request.urlopen(request, timeout=25) as response:
        text = response.read().decode("utf-8").replace("\r\n", "\n")
    return path, text


def selected_ast(text, names):
    result = {}
    for node in ast.parse(text).body:
        name = getattr(node, "name", None)
        if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            name = node.target.id
        if name in names:
            result[name] = ast.dump(node, include_attributes=False)
    return result


def main():
    with ThreadPoolExecutor(max_workers=5) as pool:
        sources = dict(pool.map(fetch, FILES))
    symbols = ["WELFARE_KEYWORDS", "resolve_welfare_keywords", "_check_welfare_in_text", "match_all_welfare"]
    previous = ROOT.parent / "008-boss-agent-cli"
    old = (previous / "src/upstream_welfare.py").read_text(encoding="utf-8")
    new = sources["src/boss_agent_cli/search_filters.py"]
    unchanged = selected_ast(old, symbols) == selected_ast(new, symbols)
    if not unchanged:
        raise AssertionError("Welfare logic changed; review the new implementation before reusing old evidence")
    report = {"checked_date":"2026-10-20", "repository":REPOSITORY, "commit":COMMIT,
              "version":re.search(r'^version = "([^"]+)"', sources["pyproject.toml"], re.M).group(1),
              "files":[{"path":path,"url":f"{REPOSITORY}/blob/{COMMIT}/{path}","sha256_utf8_lf":hashlib.sha256(text.encode()).hexdigest(),"lines":len(text.splitlines())} for path,text in sources.items()],
              "previous_snapshot":"7f46ba37c654d5f7675bb1328158030d7604847c", "welfare_symbols_ast_unchanged":unchanged,
              "historical_test_evidence":"../008-boss-agent-cli/references/core-tests.json",
              "note":"59 upstream tests belong to the 2026-10-16 snapshot. This check confirms only the four selected welfare symbols are unchanged; no live platform testing."}
    (ROOT / "references").mkdir(exist_ok=True)
    (ROOT / "web/assets").mkdir(parents=True, exist_ok=True)
    output = json.dumps(report,ensure_ascii=False,indent=2) + "\n"
    (ROOT / "references/sources.json").write_text(output,encoding="utf-8")
    (ROOT / "web/assets/sources.json").write_text(output,encoding="utf-8")
    (ROOT / "web/assets/boss-agent-cli-MIT.txt").write_text(sources["LICENSE"],encoding="utf-8")
    evidence = json.loads((previous / "references/replay.json").read_text(encoding="utf-8"))
    (ROOT / "web/assets/welfare-evidence.json").write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"commit":COMMIT,"version":report["version"],"files_checked":len(sources),"welfare_logic_unchanged":unchanged},ensure_ascii=False))
    for path in ["src/boss_agent_cli/api/client.py", "src/boss_agent_cli/ai/service.py"]:
        lines = sources[path].splitlines()
        print(path)
        for index,line in enumerate(lines):
            if any(term in line for term in ["def search_jobs", "def apply(", "def _browser_request", 'chat/completions']):
                print("\n".join(lines[index:index+13]))


if __name__ == "__main__":
    main()
