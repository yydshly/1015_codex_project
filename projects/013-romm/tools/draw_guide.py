"""Create the research guide as editable SVG and a Chromium-rendered PNG.

The graphic is original typesetting, not an upstream screenshot or runtime proof.
Only the image-generation utility needs Pillow and Playwright; RomM is not run.
"""
import argparse
from functools import lru_cache
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape

from PIL import ImageFont
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
W, H, M = 1920, 3036, 80
CW = W - 2 * M
REGULAR = Path("C:/Windows/Fonts/msyh.ttc")
BOLD = Path("C:/Windows/Fonts/msyhbd.ttc")
P = {"paper": "#f4f5ee", "white": "#fffef9", "ink": "#173b37",
     "body": "#48615a", "muted": "#6b8075", "line": "#ced9cc",
     "green": "#2c775d", "mint": "#e1eddd", "dark": "#153d37",
     "light": "#d7e8cf", "amber": "#8b5b2b", "amberbg": "#f3e5cc",
     "blue": "#376382", "bluebg": "#e2ecf2"}
ELEMENTS = []
TEXT = []


@lru_cache(maxsize=64)
def font(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold else REGULAR), size)


def wrap(value, width, size, bold=False):
    result = []
    for paragraph in value.split("\n"):
        line = ""
        for token in re.findall(r"[A-Za-z0-9./+_-]+|\s+|[^A-Za-z0-9./+_\s-]", paragraph):
            if font(size, bold).getlength(line + token) > width and line.strip():
                result.append(line.strip())
                line = ""
            if font(size, bold).getlength(token) > width:
                raise ValueError("Unbreakable token exceeds its text box: " + token)
            line += token
        result.append(line.strip())
    return result


def rect(x, y, width, height, fill, stroke=None, radius=14):
    ELEMENTS.append(f'<rect x="{x}" y="{y}" width="{width}" height="{height}" '
                    f'rx="{radius}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="2"/>')


def text(x, y, value, size=28, color=None, bold=False, anchor="start"):
    width = font(size, bold).getlength(value)
    left = x - width if anchor == "end" else x - width / 2 if anchor == "middle" else x
    if left < M - 2 or left + width > W - M + 2 or y < 0 or y + size * 1.4 > H:
        raise ValueError("Text exceeds the canvas margin: " + value)
    TEXT.append({"text": value, "left": left, "top": y, "width": width, "size": size})
    ELEMENTS.append(f'<text x="{x}" y="{y + size}" font-size="{size}" '
                    f'fill="{color or P["body"]}" font-weight="{700 if bold else 400}" '
                    f'text-anchor="{anchor}" font-family="Microsoft YaHei, sans-serif">{escape(value)}</text>')


def para(x, y, value, width, size=28, lh=43, color=None, bold=False, bottom=None):
    lines = wrap(value, width, size, bold)
    if bottom is not None and y + (len(lines) - 1) * lh + size * 1.4 > bottom:
        raise ValueError("Text exceeds the containing panel: " + value)
    for i, line in enumerate(lines):
        text(x, y + i * lh, line, size, color, bold)


def path(d, color=None, sw=3, arrow=False):
    marker = ' marker-end="url(#arrow)"' if arrow else ""
    ELEMENTS.append(f'<path d="{d}" fill="none" stroke="{color or P["green"]}" '
                    f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"{marker}/>')


def heading(y, number, title, aside):
    text(M, y, number, 43, P["green"], True)
    text(M + 90, y + 2, title, 40, P["ink"], True)
    text(W - M, y + 17, aside, 23, P["muted"], anchor="end")
    path(f"M{M} {y + 70}H{W-M}", P["line"], 2)


def chip(x, y, label):
    width = font(25).getlength(label) + 42
    rect(x, y, width, 50, P["amberbg"], radius=25)
    text(x + 21, y + 8, label, 25, P["amber"])
    return width


def draw():
    text(M, 52, "RESEARCH 013 / ROMM", 25, P["green"], True)
    text(W-M, 52, "理解归纳 · 2026.10.20", 24, P["muted"], anchor="end")
    text(M, 112, "RomM 能力与价值引导图", 84, P["ink"], True)
    text(M, 224, "把自研或已有游戏组织成作品库、统一入口与兼容进度管理", 33)
    rect(M, 306, CW, 172, P["dark"], radius=18)
    text(M+32, 329, "游戏内容由你提供，RomM 负责组织与使用。", 45, "#f1f3df", True)
    para(M+32, 402, "判断：获取现成内容的价值有限；已有一批自研游戏时，组织与使用的价值就成立。",
         CW-64, 29, 43, P["light"], bottom=470)
    x = M
    for label in ["不附带游戏与 BIOS", "不自动生成游戏内容", "无通用性能或网络加速"]:
        x += chip(x, 502, label) + 18

    heading(584, "01", "原理：内容、平台与模拟器如何分工？", "自备内容 → 识别 → 整理 → 游玩")
    node_w = (CW - 3 * 32) / 4
    nodes = [
        ("你提供游戏", "自研或已有游戏文件\n运行需核对格式与核心", P["amberbg"], P["amber"]),
        ("扫描与识别", "按平台、文件名\n及哈希匹配游戏", P["white"], P["green"]),
        ("建立游戏库", "补封面、简介、截图\n分类、搜索与收藏", P["white"], P["green"]),
        ("启动与保存", "交给兼容模拟器运行\n管理个人存档与进度", P["mint"], P["green"]),
    ]
    for i, (title, body, fill, accent) in enumerate(nodes):
        nx = M + i * (node_w + 32)
        rect(nx, 684, node_w, 156, fill, P["line"])
        text(nx+24, 700, title, 32, accent, True)
        para(nx+24, 758, body, node_w-48, 26, 37, bottom=835)
        if i < 3:
            path(f"M{nx+node_w+5} 762H{nx+node_w+25}", arrow=True)
    rect(M, 866, CW, 60, P["bluebg"], radius=10)
    text(M+24, 879, "外部资料来源：IGDB / ScreenScraper / Hasheous 等 → 补充资料，不提供游戏本体。", 27, P["blue"])
    for x, title, body in [
        (M, "浏览器运行 · 已有集成", "模拟器核心 → WebAssembly → 在用户设备执行"),
        (M+(CW+24)/2, "服务器串流 · 可选部署", "服务器运行模拟器 → 串流音视频 → 浏览器操作"),
    ]:
        width = (CW-24)/2
        rect(x, 954, width, 132, P["white"], P["line"])
        text(x+24, 972, title, 30, P["ink"], True)
        para(x+24, 1028, body, width-48, 25, 38, bottom=1082)

    heading(1132, "02", "已有能力，能带来什么效果？", "效果依游戏、核心、资料与客户端而定")
    caps = [
        ("资料与游戏库", "扫描、匹配与分类\n散乱文件变成封面库\n支持多碟、改版等整理"),
        ("统一游玩入口", "浏览器直接启动\n也可接入原生客户端\n运行由具体模拟器承担"),
        ("存档与进度", "按用户保存游戏进度\n兼容设备之间同步\n即时存档受核心限制"),
        ("用户与生态", "多用户与访问权限\n对接掌机、PC 与成就\n可配置补丁与汉化流程"),
    ]
    for i, (title, body) in enumerate(caps):
        x = M + i * (node_w + 32)
        rect(x, 1230, node_w, 220, P["white"], P["line"])
        text(x+24, 1254, title, 32, P["ink"], True)
        para(x+24, 1315, body, node_w-48, 26, 38, bottom=1442)

    heading(1520, "03", "价值与意义：对谁有用，对我们呢？", "场景判断 · 不等于项目普遍无价值")
    value_w = (CW-48)/3
    values = [
        ("想直接获得游戏内容", "当前需求：价值有限", "安装后仍需自己提供游戏；\n它没有解决我们的内容缺口。", P["amberbg"], P["amber"]),
        ("只有少量游戏", "管理收益：通常较小", "直接用模拟器往往更简单；\n部署、更新与备份仍要投入。", P["white"], P["body"]),
        ("已有收藏 / 一批自研游戏", "组织已有内容：有价值", "作品库与统一入口可复用；\n多设备、多人使用时收益更明显。", P["mint"], P["green"]),
    ]
    for i, (title, verdict, body, fill, accent) in enumerate(values):
        x = M + i*(value_w+24)
        rect(x, 1620, value_w, 254, fill, P["line"])
        text(x+26, 1643, title, 30, P["ink"], True)
        text(x+26, 1700, verdict, 28, accent, True)
        para(x+26, 1762, body, value_w-52, 26, 40, bottom=1865)
    rect(M, 1902, CW, 112, P["dark"], radius=14)
    text(M+28, 1920, "意义：把分散的游戏文件、资料、模拟器和存档，组织成可持续使用的私人游戏库。", 29, "#eef3dd", True)
    text(M+28, 1968, "值得借鉴：多来源资料融合、文件与索引分离、统一入口、按用户与游戏管理进度。", 26, P["light"])

    heading(2072, "04", "可扩展效果：从自研作品库到多设备使用", "收录与运行分别核对；定制门户需另开发")
    x0, x1, x2, end = M, 430, 1110, W-M
    rect(M, 2172, CW, 68, P["mint"], radius=9)
    for x, label in [(x0+24, "扩展方向"), (x1+24, "可见效果 / 状态"), (x2+24, "前提与新增工作")]:
        text(x, 2188, label, 27, P["ink"], True)
    rows = [
        ("NAS 家庭游戏馆", "集中收藏、账号与访问权限\n已有能力组合", "自备内容 + 部署与备份"),
        ("掌机 / PC 连续游玩", "同一游戏库，兼容进度接力\n已有客户端整合", "客户端配置 + 存档格式兼容"),
        ("服务器远程游玩", "服务器运行，浏览器接收画面\n可选串流部署", "额外容器 + 主机性能 + 低延迟"),
        ("自研游戏作品库", "组织自研作品；管理能力可复用\n能否直接运行取决于格式适配", "自研文件 + 自备资料 + 运行兼容"),
    ]
    for i, row in enumerate(rows):
        y = 2240 + i * 98
        rect(M, y, CW, 98, P["white"] if i%2==0 else "#eef1e8", radius=0)
        text(x0+24, y+28, row[0], 27, P["ink"], True)
        para(x1+24, y+10, row[1], x2-x1-48, 26, 35, bottom=y+94)
        para(x2+24, y+28, row[2], end-x2-48, 25, 37, bottom=y+94)
        path(f"M{M} {y+98}H{W-M}", P["line"], 1)

    rect(M, 2676, CW, 174, P["amberbg"], radius=14)
    text(M+26, 2694, "三个边界，避免误读", 30, P["amber"], True)
    text(M+26, 2745, "约 400 个平台主要指识别 / 资料覆盖；浏览器可玩范围需要单独核对。", 27, P["amber"])
    text(M+26, 2788, "同步不保证跨核心即时存档通用；快进取决于模拟器；本项目不提供通用性能加速。", 27, P["amber"])
    path(f"M{M} 2890H{W-M}", P["line"], 2)
    text(M, 2910, "核对：README / 官方文档 / 固定依赖文件 · 未部署 RomM，未实测游戏、同步、帧率或串流。", 24, P["muted"])
    text(M, 2951, "rommapp/romm @ 6fae818 · AGPL-3.0-only · 原创研究示意，非官方截图 · 依据见 references/sources.json", 23, P["muted"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--qa-dir", type=Path)
    args = parser.parse_args()
    draw()
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">
<title id="title">RomM 能力与价值引导图</title>
<desc id="desc">RomM 不附带游戏；整合已有游戏的识别、资料、启动、模拟器游玩和兼容存档同步。我们开发一批游戏时，可以复用它组织作品；直接运行取决于格式和适配。针对直接获取游戏内容的需求价值有限，大量收藏、多设备和多人使用时有整合价值。图中区分现有管理、可选部署和运行适配，并列出边界。</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="{P['green']}" stroke-width="1.5"/></marker></defs>
<rect width="{W}" height="{H}" fill="{P['paper']}"/>
''' + "\n".join(ELEMENTS) + "</svg>"
    ET.fromstring(svg)
    target = ROOT / "assets/romm-understanding-20261020.svg"
    target.write_text(svg, encoding="utf-8", newline="\n")
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        page.set_content('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}svg{display:block}</style></head><body>'+svg+'</body></html>', wait_until="load")
        page.evaluate("document.fonts.ready")
        # Check Chromium's actual glyph bounds, in addition to Pillow's metrics.
        boxes = page.locator("svg text").evaluate_all("items => items.map(n => {const b=n.getBBox();return {text:n.textContent,x:b.x,y:b.y,w:b.width,h:b.height}})")
        overflows = [b for b in boxes if b["x"] < M-3 or b["x"]+b["w"] > W-M+3 or b["y"] < 0 or b["y"]+b["h"] > H]
        if overflows:
            raise ValueError("Chromium text overflow: " + json.dumps(overflows, ensure_ascii=False))
        page.screenshot(path=str(target.with_suffix(".png")), timeout=60000)
        if args.qa_dir:
            args.qa_dir.mkdir(parents=True, exist_ok=True)
            for name, y, height in [("top", 0, 1110), ("value", 1110, 950), ("extensions", 2055, 981)]:
                page.screenshot(path=str(args.qa_dir/(name+".png")), clip={"x":0,"y":y,"width":W,"height":height})
        browser.close()
    png = target.with_suffix(".png")
    report = {"width":W,"height":H,"text_lines":len(TEXT),"layout_overflows":[],
              "svg_sha256":hashlib.sha256(target.read_bytes()).hexdigest(),
              "png_sha256":hashlib.sha256(png.read_bytes()).hexdigest(),
              "png_bytes":png.stat().st_size,
              "method":"Original native SVG; Pillow font metrics; Chromium PNG rendering and glyph-bounds checks.",
              "scope":"Original research infographic, not a screenshot or verification of RomM runtime.",
              "visual_review":"Pending manual review of rendered sections."}
    (ROOT/"references/guide-generation.json").write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8", newline="\n")
    print(json.dumps({"width":W,"height":H,"text_lines":len(TEXT),"png_bytes":png.stat().st_size}))


if __name__ == "__main__":
    main()
