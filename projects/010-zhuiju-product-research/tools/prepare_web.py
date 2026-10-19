"""Bundle the authored research, evidence, and local images for a static web page."""

import html
import json
from pathlib import Path
import re
import shutil
from urllib.parse import unquote, urlsplit

import markdown


ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT.parent / "007-zhuiju-source-demo"
ASSETS = ROOT / "web/assets"
DOCUMENTS = [
    ("overview", "研究总览", ROOT / "README.md"),
    ("capabilities", "能力、效果与参考价值", ROOT / "capabilities.md"),
    ("architecture", "原理与实现架构", ROOT / "architecture.md"),
    ("sources", "片源发现与获取", ROOT / "source-acquisition.md"),
    ("distribution", "存储、分发与成本", ROOT / "distribution-and-cost.md"),
    ("filmhub", "Filmhub 合作专题", ROOT / "filmhub.md"),
    ("product", "产品与盈利验证计划", ROOT / "product-plan.md"),
    ("notes", "研究方法与复现", ROOT / "notes.md"),
    ("references", "证据与来源索引", ROOT / "references/README.md"),
    ("licenses", "来源与许可", ROOT / "THIRD_PARTY.md"),
    ("demo", "007 实测与运行说明", DEMO / "README.md"),
]


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / "assets/cover.svg", ASSETS / "research-map.svg")
    shutil.copy2(DEMO / "assets/demo-playback-verified.jpg", ASSETS / "playback-evidence.jpg")
    doc_ids = {path.resolve(): key for key, _, path in DOCUMENTS}
    copied = set()

    def rewrite_link(match, source):
        value = html.unescape(match.group(1))
        parsed = urlsplit(value)
        if parsed.scheme or not parsed.path:
            return match.group(0)
        target = (source.parent / unquote(parsed.path)).resolve()
        if target == (ROOT / "web/index.html").resolve():
            return 'href="index.html"'
        if target in doc_ids:
            key = doc_ids[target]
            return f'href="#read/{key}" data-doc="{key}"'
        if not target.is_file():
            raise FileNotFoundError(f"Unresolved local reference: {source.name}: {value}")
        if target.is_relative_to(ROOT):
            relative = Path("010") / target.relative_to(ROOT)
        elif target.is_relative_to(DEMO):
            relative = Path("007") / target.relative_to(DEMO)
        else:
            raise ValueError(f"Unexpected attachment outside research projects: {target}")
        destination = ASSETS / "files" / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(target, destination)
        copied.add(destination.relative_to(ROOT / "web").as_posix())
        suffix = ("#" + parsed.fragment) if parsed.fragment else ""
        attribute = match.group(0).split("=", 1)[0]
        return f'{attribute}="assets/files/{relative.as_posix()}{suffix}"'

    documents = {}
    for key, title, path in DOCUMENTS:
        body = markdown.markdown(path.read_text(encoding="utf-8"), extensions=["tables", "fenced_code", "sane_lists"])
        body = re.sub(r'(?:href|src)="([^"]+)"', lambda match: rewrite_link(match, path), body)
        body = re.sub(r'href="(https?://[^"]+)"', r'href="\1" target="_blank" rel="noopener noreferrer"', body)
        documents[key] = {"title": title, "html": body, "source_path": str(path.relative_to(ROOT.parent)).replace("\\", "/")}
    data = {
        "page_date": "2026-10-19", "research_date": "2026-10-16", "playback_date": "2026-10-15",
        "documents": documents,
        "evidence": json.loads((ROOT / "references/evidence-summary.json").read_text(encoding="utf-8")),
        "sources": json.loads((ROOT / "references/sources.json").read_text(encoding="utf-8"))["sources"],
    }
    (ASSETS / "research-data.js").write_text("window.RESEARCH_DATA = " + json.dumps(data, ensure_ascii=False) + ";\n", encoding="utf-8")
    report = {"page_date": "2026-10-19", "documents": len(documents), "sources": len(data["sources"]),
              "attachments": sorted(copied), "historical_data_reused": True, "packaging_runs_live_playback_test": False,
              "live_demo": {"requires_local_server": True, "entry_hash": "#live-demo", "reuses_project": "007-zhuiju-source-demo"}}
    (ROOT / "references/web-package.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"documents": len(documents), "sources": len(data["sources"]), "attachments": len(copied)}))


if __name__ == "__main__":
    main()
