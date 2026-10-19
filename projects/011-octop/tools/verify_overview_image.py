"""Verify the poster's contents, native sizes, exact web copies and image handoff."""
from hashlib import sha256
import json
from pathlib import Path
import xml.etree.ElementTree as ET

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
name="octop-understanding-overview-20261020"
checks=[]

def check(label,passed):
    checks.append({"name":label,"passed":bool(passed)})
    if not passed:
        raise AssertionError(label)

def main():
    svg=ET.parse(ROOT/"assets"/(name+".svg")).getroot()
    content=" ".join(svg.itertext())
    image=Image.open(ROOT/"assets"/(name+".png"))
    check("Native PNG dimensions match SVG",image.size==(int(svg.attrib["width"]),int(svg.attrib["height"])))
    check("Six requested subject areas present",all(t in content for t in ["本质与原理","能力与效果","使用场景","可扩展方式","同类产品对比","我们的思考"]))
    check("Four compared products present",all(t in content for t in ["Octop","Codex","dots","Grok Bot"]))
    check("Group chat and execution boundary explicit",all(t in content for t in ["群聊是入口之一","工具执行","MCP","ACP","Beta","规划"]))
    check("Export has no canvas text overflow",not json.loads((ROOT/"references/understanding-overview-generation.json").read_text(encoding="utf-8"))["layout_overflows"])
    for extension in ["png","svg"]:
        check("Exact website copy: "+extension,sha256((ROOT/"assets"/(name+"."+extension)).read_bytes()).digest()==sha256((ROOT/"web/assets"/(name+"."+extension)).read_bytes()).digest())
    errors=[]
    viewports=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True)
        page=browser.new_page(viewport={"width":1440,"height":1000})
        page.on("pageerror",lambda error:errors.append(str(error)))
        page.goto((ROOT/"web/index.html").as_uri(),wait_until="load")
        check("Existing research content still renders",page.locator(".cap-card").count()==8 and page.locator(".source-card").count()==18)
        check("Hero, summary and download links use the full original PNG",page.locator(f'a[href="assets/{name}.png"]').count()==4)
        with page.expect_popup() as popup:
            page.locator(".hero-actions").get_by_role("link",name="一图读懂").click()
        poster=popup.value
        poster.wait_for_load_state("load")
        dims=poster.locator("img").evaluate("image => [image.naturalWidth,image.naturalHeight]")
        check("Poster opens at original resolution",dims==list(image.size))
        poster.close()
        for width in [1440,390,320]:
            page.set_viewport_size({"width":width,"height":900})
            dimensions=page.evaluate("({viewport:innerWidth,document:document.documentElement.scrollWidth})")
            viewports.append(dimensions)
            check("No overflow after adding poster link: "+str(width),dimensions["document"]<=width)
        check("No browser errors",not errors)
        browser.close()
    result={"date":"2026-10-20","passed":all(item["passed"] for item in checks),"checks":checks,"viewports":viewports,
            "dimensions":list(image.size),"svg_bytes":(ROOT/"assets"/(name+".svg")).stat().st_size,
            "png_bytes":(ROOT/"assets"/(name+".png")).stat().st_size,"scope":"Poster and its local website entry; no Octop runtime execution."}
    (ROOT/"references/understanding-overview-verification.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"passed":result["passed"],"checks":len(checks),"dimensions":list(image.size)}))

if __name__=="__main__":
    main()
