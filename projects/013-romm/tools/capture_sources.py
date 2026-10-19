"""Capture a small, pinned upstream reading set without installing RomM."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
COMMIT = "6fae8185f81dd4897940e76045bc9834cfb798d1"
REPO = "https://github.com/rommapp/romm"
FILES = ["README.md", "LICENSE", "pyproject.toml", "frontend/package.json"]
DOCS = [
    ("faq", "about/faqs/", "不附带游戏与固件；自部署定位与维护前提"),
    ("metadata", "getting-started/metadata-providers/", "文件名与哈希匹配、多来源资料及优先级"),
    ("scanning", "administration/scanning-and-watcher/", "手动、定时与文件变动扫描"),
    ("architecture", "developers/architecture/", "前后端、数据库、任务、文件与模拟器的分工"),
    ("platforms", "platforms/supported-platforms/", "平台支持包含目录识别与资料覆盖；可玩范围另列"),
    ("custom-platforms", "platforms/custom-platforms/", "可收录自定义平台；不自动获得资料覆盖，管理与可玩支持分开理解"),
    ("browser-play", "using/in-browser-play/emulatorjs/", "EmulatorJS、WebAssembly 与终端性能要求"),
    ("saves", "using/saves-and-states/", "存档同步与即时存档核心兼容性"),
    ("streaming", "using/emulator-streaming/", "可选的服务器模拟器与浏览器串流"),
]


def fetch(url):
    request = Request(url, headers={"User-Agent": "GitHub-Research-Lab/013-romm"})
    with urlopen(request, timeout=45) as response:
        return response.read()


def capture_file(path):
    url = f"https://raw.githubusercontent.com/rommapp/romm/{COMMIT}/{path}"
    content = fetch(url)
    destination = ROOT / "references/upstream" / path
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(content)
    return {
        "path": path,
        "url": f"{REPO}/blob/{COMMIT}/{path}",
        "snapshot": destination.relative_to(ROOT).as_posix(),
        "bytes": len(content),
        "sha256": hashlib.sha256(content).hexdigest(),
    }


def capture_doc(item):
    key, path, supports = item
    url = "https://docs.romm.app/latest/" + path
    content = fetch(url)
    return {"id": key, "url": url, "supports": supports,
            "html_sha256_at_access": hashlib.sha256(content).hexdigest(),
            "version_scope": "官方 latest 文档为动态页面；不声称与固定源码提交完全同版"}


def main():
    with ThreadPoolExecutor(max_workers=4) as pool:
        files = list(pool.map(capture_file, FILES))
        docs = list(pool.map(capture_doc, DOCS))
    data = {
        "research_date": "2026-10-20",
        "accessed_at_utc": datetime.now(timezone.utc).isoformat(),
        "repository": REPO,
        "commit": COMMIT,
        "license": "AGPL-3.0-only",
        "upstream_snapshots": files,
        "official_documentation": docs,
        "interpretations": [
            "针对我们希望直接获得游戏内容的需求，当前直接价值有限、研究优先级较低。",
            "大量已有收藏、多设备或多人使用时，管理和同步的整合价值更明显。",
            "我们开发一批游戏时，可复用作品收录、资料与访问管理；直接运行和存档同步需按发布格式、模拟器或客户端验证。",
            "价值判断属于本研究的场景判断，不代表项目对所有人价值低。",
            "基础作品管理可评估复用现有能力；品牌专题与业务发布门户是二次开发设想。",
        ],
        "validation_scope": "官方文档与四份固定源码资料核对；未运行 RomM、游戏、模拟器、存档同步或串流。",
    }
    target = ROOT / "references/sources.json"
    target.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(json.dumps({"commit": COMMIT, "snapshots": len(files), "official_docs": len(docs)}))


if __name__ == "__main__":
    main()
