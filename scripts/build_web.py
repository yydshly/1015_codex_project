"""Assemble only production static assets into the repository's Pages layout."""

from html import escape
from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"
PRODUCTION_FILES = ("index.html", "styles.css", "app.js", "models.js", "poster.jpg", "overview.html", "overview.css", "overview.js")


def main():
    catalog = json.loads((ROOT / "projects.json").read_text(encoding="utf-8"))
    # This script owns only this generated directory; never remove an arbitrary path.
    if OUTPUT.resolve().parent != ROOT.resolve() or OUTPUT.name != "_site":
        raise ValueError("构建目录必须是仓库根目录下的 _site")
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    (OUTPUT / ".nojekyll").touch()
    cards = []
    for project in sorted(catalog["projects"], key=lambda entry: entry["id"]):
        directory = f"{project['id']:03d}-{project['slug']}"
        source = ROOT / "projects" / directory
        web = source / "web"
        if not (web / "index.html").is_file():
            continue
        destination = OUTPUT / "projects" / directory
        destination.mkdir(parents=True)
        for filename in PRODUCTION_FILES:
            if (web / filename).is_file():
                shutil.copy2(web / filename, destination / filename)
                if filename == "overview.html":
                    overview = (destination / filename).read_text(encoding="utf-8")
                    for document in ("capabilities.md", "THIRD_PARTY.md"):
                        overview = overview.replace(f'href="../{document}"', f'href="{document}"')
                    (destination / filename).write_text(overview, encoding="utf-8")
        if (web / "vendor").is_dir():
            shutil.copytree(web / "vendor", destination / "vendor")
        if (web / "assets").is_dir():
            shutil.copytree(web / "assets", destination / "assets")
        if (web / "elleh").is_dir():
            shutil.copytree(web / "elleh", destination / "elleh")
        for name in ("THIRD_PARTY.md", "capabilities.md", "architecture.md", "comparison.md", "extensions.md", "notes.md"):
            if (source / name).is_file():
                content = (source / name).read_text(encoding="utf-8")
                content = content.replace("web/vendor/", "vendor/")
                content = content.replace("web/assets/", "assets/")
                (destination / name).write_text(content, encoding="utf-8")
        if (source / "references").is_dir():
            shutil.copytree(source / "references", destination / "references")
        asset_dir = OUTPUT / "assets" / directory
        asset_dir.mkdir(parents=True)
        cover = source / project["cover"]
        shutil.copy2(cover, asset_dir / cover.name)
        entry = "overview.html" if (web / "overview.html").is_file() else ""
        entry_label = "阅读研究总览 →" if entry else "打开互动演示 →"
        cards.append(
            f'<a class="card" href="projects/{escape(directory)}/{entry}">'
            f'<img src="assets/{escape(directory)}/{escape(cover.name)}" alt="{escape(project["name"])} 研究引导图">'
            f'<div><span>RESEARCH / {project["id"]:03d}</span><h2>{escape(project["name"])}</h2>'
            f'<p>{escape(project["summary"])}</p><strong>{entry_label}</strong></div></a>'
        )
    content = '''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>GitHub Research Lab · 项目演示</title><style>
    *{box-sizing:border-box}body{background:#f3f6ef;color:#1c3931;font:15px "Segoe UI","Microsoft YaHei",sans-serif;margin:0;padding:60px 24px}main{max-width:1050px;margin:auto}header>span,.card span{font-size:11px;letter-spacing:2px;color:#688268}h1{font-size:38px;margin:17px 0}header p{color:#7b8d7b;line-height:1.8;margin-bottom:38px}.card{display:grid;grid-template-columns:1.2fr 1fr;border:1px solid #d9e4d6;border-radius:14px;overflow:hidden;background:#fff;color:inherit;text-decoration:none}.card img{width:100%;height:100%;max-height:340px;object-fit:cover;object-position:top}.card>div{padding:32px}.card h2{font-size:22px;line-height:1.5}.card p{font-size:13px;line-height:1.9;color:#788b78}.card strong{display:block;margin-top:30px;color:#3d7952;font-size:13px}footer{font-size:12px;color:#81907b;margin-top:35px}@media(max-width:680px){body{padding:35px 18px}h1{font-size:29px}.card{grid-template-columns:1fr}.card img{max-height:250px}.card>div{padding:24px}}
    </style></head><body><main><header><span>GITHUB RESEARCH LAB</span><h1>发现原理，亲手验证。</h1><p>每一个研究项目，都有一个可以亲手操作的入口。</p></header>'''
    content += '<style>.card+.card{margin-top:24px}</style>'
    content += "".join(cards) or "<p>暂无已构建的 Web 演示。</p>"
    content += '<footer>来源与研究记录保存在对应子项目中。<a href="https://github.com/yydshly/1015_codex_project">查看研究仓库 ↗</a></footer></main></body></html>'
    (OUTPUT / "index.html").write_text(content, encoding="utf-8")
    print(f"已构建 {len(cards)} 个 Web 演示到 _site/，可直接部署至 GitHub Pages。")


if __name__ == "__main__":
    main()
