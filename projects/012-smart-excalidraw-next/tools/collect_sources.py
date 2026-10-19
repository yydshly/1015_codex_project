"""Save a small, pinned set of primary sources for this research page."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen, Request
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
SHA = "fd139925b01ab34203510d6afa560aa56fcc3201"
FILES = ["README.md", "package.json", "lib/constants.js", "lib/prompts.js", "lib/optimizeArrows.js", "lib/llm-client.js", "lib/history-manager.js", "components/Chat.jsx", "components/ExcalidrawCanvas.jsx", "app/page.js", "app/api/generate/route.js"]

def collect(path):
    url = f"https://raw.githubusercontent.com/liujuntao123/smart-excalidraw-next/{SHA}/{path}"
    with urlopen(Request(url, headers={"User-Agent": "research-012"}), timeout=45) as response:
        data = response.read()
    target = ROOT / "references" / "upstream" / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {"path": path, "url": url, "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data)}

if __name__ == "__main__":
    with ThreadPoolExecutor(max_workers=5) as pool:
        sources = list(pool.map(collect, FILES))
    manifest = {"repository": "https://github.com/liujuntao123/smart-excalidraw-next", "commit": SHA, "checked_on": "2026-10-20", "files": sources}
    (ROOT / "references" / "sources.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(sources)} pinned sources at {SHA}")
