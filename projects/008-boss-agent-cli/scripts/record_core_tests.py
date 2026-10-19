"""Rerun a bounded offline subset of the pinned upstream tests."""
import argparse
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
COMMIT = "7f46ba37c654d5f7675bb1328158030d7604847c"
TESTS = ["tests/test_search_filters.py", "tests/test_search_pipeline.py", "tests/test_match_score.py", "tests/test_eval_harness.py"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("upstream", type=Path)
    upstream = parser.parse_args().upstream.resolve()
    sha = subprocess.check_output(["git", "-C", str(upstream), "rev-parse", "HEAD"], text=True).strip()
    if sha != COMMIT:
        raise ValueError("Upstream commit does not match the research snapshot")
    temp_parent = Path(tempfile.mkdtemp(prefix="boss-research-tests-"))
    base = (temp_parent / "cases").resolve()
    if not base.is_relative_to(temp_parent.resolve()) or base.exists():
        raise ValueError("Expected a new isolated pytest temporary directory")
    command = [sys.executable, "-m", "pytest", *TESTS, "-q", "--tb=short", "--basetemp", str(base)]
    result = subprocess.run(command, cwd=upstream, capture_output=True, text=True, encoding="utf-8", env={**os.environ, "PYTHONUTF8": "1"}, timeout=90)
    transcript = (result.stdout + result.stderr).replace(str(upstream), "<upstream>").replace(str(temp_parent), "<isolated-temp>")
    (ROOT / "references/core-tests.txt").write_text(transcript, encoding="utf-8")
    match = re.search(r"(\d+) passed", transcript)
    report = {"commit": sha, "python": sys.version.split()[0], "date": "2026-10-16", "tests": TESTS,
              "exit_code": result.returncode, "passed": int(match.group(1)) if match else 0,
              "mode": "offline-mocked-platform", "live_platform_tested": False,
              "scope": "过滤、评分、搜索管线和 fixture 评测器；未覆盖完整 CLI、浏览器和真实平台。"}
    content = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    (ROOT / "references/core-tests.json").write_text(content, encoding="utf-8")
    (ROOT / "web/assets/core-tests.json").write_text(content, encoding="utf-8")
    print(transcript)
    raise SystemExit(result.returncode)


if __name__ == "__main__":
    main()
