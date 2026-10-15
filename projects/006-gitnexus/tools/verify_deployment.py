"""Check the published Pages entry, evidence, documents and same-origin assets."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from hashlib import sha256
from pathlib import Path
from urllib.request import Request, urlopen
import json

PROJECT = Path(__file__).resolve().parents[1]
BASE = "https://yydshly.github.io/1015_codex_project/projects/006-gitnexus/"
PATHS = ["", "styles.css", "app.js", "assets/evidence.json", "notes.md", "references/run-report.md", "references/sources.json", "references/context.json", "references/impact.json", "references/trace.json", "references/query.json", "references/query-before-repair.json", "references/UPSTREAM_LICENSE.txt", "assets/comparison.css", "assets/comparison.js", "comparison.md"]


def fetch(path):
    with urlopen(Request(BASE + path, headers={"User-Agent":"Research-Lab-Verification"}), timeout=25) as response:
        body = response.read()
        return {"path":path or "index.html", "status":response.status, "bytes":len(body), "sha256":sha256(body).hexdigest()}, body


def main():
    responses = list(ThreadPoolExecutor(max_workers=5).map(fetch, PATHS))
    assert all(result[0]["status"] == 200 for result in responses)
    evidence = json.loads(responses[3][1])
    assert evidence["status"] == "verified" and evidence["searchStatus"] == "verified"
    assert evidence["metrics"]["nodes"] == 71 and len(evidence["edges"]) == 11
    for i, source in [(0,"index.html"),(1,"styles.css"),(2,"app.js"),(3,"assets/evidence.json"),(13,"assets/comparison.css"),(14,"assets/comparison.js")]:
        # Git normalizes the Windows working copy's CRLF before Pages builds it.
        assert responses[i][1].replace(b"\r\n",b"\n") == (PROJECT / "web" / source).read_bytes().replace(b"\r\n",b"\n"), source
    assert evidence == json.loads((PROJECT / "web/assets/evidence.json").read_text(encoding="utf-8"))
    result = {"status":"passed", "checkedAt":datetime.now().astimezone().isoformat(), "url":BASE, "responses":[row[0] for row in responses], "runtimeEvidenceMatches":True, "textAssetsMatchAfterNewlineNormalization":True, "graphNodes":71, "graphEdges":131, "businessCalls":11, "upstreamChecks":len(evidence["checks"])}
    (PROJECT / "assets/deployed-verification.json").write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps({"status":result["status"],"url":BASE,"httpChecks":len(responses),"runtimeEvidenceMatches":True},ensure_ascii=False))


if __name__ == "__main__":
    main()
