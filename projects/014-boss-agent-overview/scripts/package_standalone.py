"""Bundle inline CSS, code and illustrative data into a file-openable HTML."""
import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WEB = ROOT / "web"


def main():
    html = (WEB / "index.html").read_text(encoding="utf-8")
    styles = (WEB / "styles.css").read_text(encoding="utf-8")
    model = (WEB / "assets/model.mjs").read_text(encoding="utf-8").replace("export function", "function")
    app = (WEB / "app.js").read_text(encoding="utf-8")
    import_line = "import {shortlist,careerProfile} from './assets/model.mjs';\n"
    if not app.startswith(import_line):
        raise ValueError("Review the standalone bundle imports")
    app = app.removeprefix(import_line)
    embedded = {"welfare": json.loads((WEB / "assets/welfare-evidence.json").read_text(encoding="utf-8")),
                "careers": json.loads((WEB / "assets/career-samples.json").read_text(encoding="utf-8"))}
    for extension,mime in [("png","image/png"),("svg","image/svg+xml")]:
        encoded=base64.b64encode((WEB / f"assets/boss-agent-panorama.{extension}").read_bytes()).decode("ascii")
        embedded[f"guide_{extension}"]=f"data:{mime};base64,{encoded}"
    html=html.replace('src="assets/boss-agent-panorama.png"','')
    data = json.dumps(embedded, ensure_ascii=False).replace("</", "<\\/")
    html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>{styles}</style>")
    html = html.replace('<script type="module" src="app.js"></script>', '')
    # In a downloaded file, historical source evidence is linked to its upstream reference.
    html = html.replace('href="../008-boss-agent-cli/#lab"', 'href="https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/evals/README.md"')
    html = html.replace('查看原始实验页 ↗', '查看上游评测边界 ↗')
    html = html.replace('href="architecture.md"', 'href="https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/docs/platform-risk.md"')
    html = html.replace('技术分析文档 ↗', '上游技术与风险说明 ↗')
    html = html.replace('href="assets/', 'href="')
    scripts = f'<script id="offline-data" type="application/json">{data}</script><script type="module">{model}\n{app}</script>'
    html = html.replace('</body>', scripts + '</body>')
    if '<script type="module" src=' in html or '<link rel="stylesheet"' in html:
        raise AssertionError("Standalone bundle still has external runtime assets")
    output = WEB / "assets/standalone.html"
    output.write_text(html, encoding="utf-8")
    print(f"Standalone HTML: {output.stat().st_size} bytes; runtime code and demo data embedded.")


if __name__ == "__main__":
    main()
