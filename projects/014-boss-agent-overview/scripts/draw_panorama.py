"""Render the research panorama as editable SVG and high resolution PNG.

All text and diagram elements are authored here; no upstream image is reused.
Requires Pillow and the Windows Microsoft YaHei fonts, with no root app dependency.
"""
from functools import lru_cache
from html import escape
import json
import math
from pathlib import Path
import re
import shutil

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
WIDTH, MARGIN, GAP = 1800, 64, 20
CONTENT = WIDTH - MARGIN * 2
FONT = Path("C:/Windows/Fonts/msyh.ttc")
BOLD = Path("C:/Windows/Fonts/msyhbd.ttc")
BASE = "https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/"
C = {"bg":"#F3F5EF", "paper":"#FEFFFB", "ink":"#163E37", "muted":"#526B61",
     "teal":"#0D7567", "dark":"#143E36", "mint":"#E5EEE3", "line":"#CEDBCF",
     "gold":"#91532C", "sand":"#F5EBDD", "risk":"#FCF7ED", "white":"#F6FAEE"}


@lru_cache(maxsize=100)
def font(size, bold=False, scale=1):
    return ImageFont.truetype(str(BOLD if bold else FONT), round(size * scale))


class Scene:
    def __init__(self):
        self.ops, self.text_bounds, self.sections = [], [], []

    def rect(self, x, y, w, h, fill, stroke=None, radius=12):
        self.ops.append(("rect", x, y, w, h, fill, stroke, radius))

    def line(self, x1, y1, x2, y2, color=None, width=2):
        self.ops.append(("line", x1, y1, x2, y2, color or C["line"], width))

    def arrow(self, x1, y1, x2, y2, color=None):
        color = color or C["teal"]
        self.line(x1, y1, x2, y2, color, 2.5)
        a = math.atan2(y2-y1, x2-x1)
        points = [(x2,y2), (x2-10*math.cos(a-.45),y2-10*math.sin(a-.45)),
                  (x2-10*math.cos(a+.45),y2-10*math.sin(a+.45))]
        self.ops.append(("poly", points, color))

    def text(self, x, baseline, value, size=24, bold=False, color=None, url=None):
        color = color or C["ink"]
        self.ops.append(("text", x, baseline, value, size, bold, color, url))
        box = font(size,bold).getbbox(value,anchor="ls")
        self.text_bounds.append((x+box[0],baseline+box[1],x+box[2],baseline+box[3],value))

    def wrap(self, value, width, size=24, bold=False):
        lines, tokens = [], []
        for token in re.findall(r"[A-Za-z0-9_./-]+|[^A-Za-z0-9_./-]",value):
            if token == "\n":
                lines.append(''.join(tokens).rstrip()); tokens = []; continue
            if not tokens and token.isspace():
                continue
            if tokens and font(size,bold).getlength(''.join(tokens)+token) > width:
                # Keep Latin identifiers whole and punctuation with its preceding phrase.
                carry=[]
                if token in '，。；：、！？）】》」』”%':
                    carry=[tokens.pop()]
                elif tokens[-1] in '（【《「『“':
                    carry=[tokens.pop()]
                lines.append(''.join(tokens).rstrip())
                tokens=carry+[token.lstrip()]
            else:
                tokens.append(token)
        if tokens:
            lines.append(''.join(tokens).rstrip())
        return lines

    def equal_height(self, y, height):
        for i,op in enumerate(self.ops):
            if op[0] == 'rect' and op[2] == y:
                self.ops[i]=(*op[:4],height,*op[5:])

    def block(self, x, y, width, value, size=24, bold=False, color=None, leading=1.52):
        lines = self.wrap(value,width,size,bold)
        for i,line in enumerate(lines):
            self.text(x,y+size+i*size*leading,line,size,bold,color)
        return y+len(lines)*size*leading

    def section(self, y, number, title, note):
        self.sections.append({"number":number,"title":title,"y":y})
        self.rect(MARGIN,y+2,44,42,C["teal"],radius=7)
        self.text(MARGIN+8,y+31,number,23,True,C["white"])
        self.text(MARGIN+61,y+34,title,34,True)
        return self.block(MARGIN+61,y+52,CONTENT-61,note,22,color=C["muted"])+23

    def card(self,x,y,w,title,items,kind="existing",minimum=0):
        mark = C["gold"] if kind == "extension" else C["teal"]
        start = len(self.ops)
        self.text(x+26,y+44,title,29,True)
        cy = y+67
        for label,body in items:
            cy = self.block(x+26,cy,w-52,label,23,True,color=mark)+5
            cy = self.block(x+26,cy,w-52,body,23,color=C["muted"])+15
        height = max(cy-y+10,minimum)
        self.ops.insert(start,("rect",x,y,w,height,C["paper"],C["line"],12))
        return height

    def save(self, height):
        svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{height}" viewBox="0 0 {WIDTH} {height}" role="img" aria-labelledby="title desc">',
               '<title id="title">BOSS Agent CLI 全景理解：能力、原理、风险、场景与意义</title>',
               '<desc id="desc">基于固定版本 3.0.0 / 4716ee1 的中文研究长图。区分源库已有功能、本研究合成原型与尚需开发的职业探索场景，并展示三种平台访问路径、本地处理、可选模型 API 和证据边界。</desc>',
               f'<rect width="{WIDTH}" height="{height}" fill="{C["bg"]}"/>',
               '<g font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif">']
        scale = 2
        bitmap = Image.new("RGB",(WIDTH*scale,height*scale),C["bg"])
        draw = ImageDraw.Draw(bitmap)
        for op in self.ops:
            if op[0] == "rect":
                _,x,y,w,h,fill,stroke,r = op
                svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke or "none"}"/>')
                draw.rounded_rectangle((round(x*scale),round(y*scale),round((x+w)*scale),round((y+h)*scale)),round(r*scale),fill=fill,outline=stroke,width=scale)
            elif op[0] == "line":
                _,x1,y1,x2,y2,color,w = op
                svg.append(f'<path d="M{x1},{y1} L{x2},{y2}" fill="none" stroke="{color}" stroke-width="{w}"/>')
                draw.line((round(x1*scale),round(y1*scale),round(x2*scale),round(y2*scale)),fill=color,width=round(w*scale))
            elif op[0] == "poly":
                _,points,color = op
                svg.append(f'<polygon points="{" ".join(f"{x},{y}" for x,y in points)}" fill="{color}"/>')
                draw.polygon([(round(x*scale),round(y*scale)) for x,y in points],fill=color)
            elif op[0] == "text":
                _,x,y,value,size,bold,color,url = op
                item=f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{escape(value)}</text>'
                svg.append(f'<a href="{escape(url,quote=True)}">{item}</a>' if url else item)
                draw.text((round(x*scale),round(y*scale)),value,font=font(size,bold,scale),fill=color,anchor="ls")
        svg += ['</g>','</svg>']
        assets = ROOT / "assets"
        assets.mkdir(exist_ok=True)
        prefix = assets / "boss-agent-panorama"
        prefix.with_suffix(".svg").write_text("\n".join(svg)+"\n",encoding="utf-8")
        bitmap.save(prefix.with_suffix(".png"),optimize=True,dpi=(192,192))
        failures = [item for item in self.text_bounds if item[0]<MARGIN-1 or item[2]>WIDTH-MARGIN+1 or item[1]<0 or item[3]>height-MARGIN+5]
        if failures:
            raise AssertionError(f"Text outside the page safe area: {failures}")
        for ext in ("svg","png"):
            shutil.copy2(prefix.with_suffix('.'+ext),ROOT / "web/assets" / f"boss-agent-panorama.{ext}")
        # Inspection renders are sections of the authored scene, not separate deliverables.
        qa = ROOT / "references/panorama-preview"
        qa.mkdir(exist_ok=True)
        for section in self.sections:
            number=section["number"]
            if number in {"02","04","05"}:
                i=self.sections.index(section)
                bottom=self.sections[i+1]["y"] if i+1<len(self.sections) else height
                bitmap.crop((0,round(section["y"]*scale),WIDTH*scale,round(bottom*scale))).resize((WIDTH,round(bottom-section["y"]))).save(qa / f"section-{number}.png")
        report={"date":"2026-10-20","snapshot":"4716ee1d211533db70ac7cc1ab2322eb269b43a0","version":"3.0.0",
                "svg_dimensions":[WIDTH,height],"png_dimensions":list(bitmap.size),"text_lines":len(self.text_bounds),
                "text_safe_area_failures":len(failures),"sections":self.sections,
                "files":[f"assets/boss-agent-panorama.{ext}" for ext in ("svg","png")],
                "evidence":"Source inspection, local research experiments and explicitly labelled extensions; no live BOSS or model requests."}
        (ROOT / "references/panorama-render.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print(json.dumps({"dimensions":list(bitmap.size),"sections":len(self.sections),"text_lines":len(self.text_bounds),"safe_area_failures":len(failures)},ensure_ascii=False))


def main():
    s = Scene()
    s.text(MARGIN,63,"013 / OPEN-SOURCE RESEARCH     ·     2026.10.20",21,True,C["teal"])
    s.text(MARGIN,147,"BOSS Agent CLI 全景理解",66,True)
    s.text(MARGIN,201,"从招聘操作到职业探索：能力、访问路径、风险、场景与意义",30,color=C["muted"])
    s.text(MARGIN,247,"固定研究快照：v3.0.0 / 4716ee1     ·     当前实际平台：BOSS 直聘",22,color=C["muted"])
    s.rect(MARGIN,279,CONTENT,139,C["dark"],radius=14)
    s.text(MARGIN+28,329,"我们的核心理解：把招聘平台上的操作，组织成 Agent 可调用的业务工具。",31,True,C["white"])
    s.block(MARGIN+28,350,CONTENT-56,"登录会话与网页接口提供数据入口；本地规则和状态管理组织流程；可选模型辅助分析；职业探索产品在此基础上继续建设。",24,color="#C9DECC")
    y=449
    s.text(MARGIN,y+22,"阅读标记",21,True)
    s.text(MARGIN+136,y+22,"● 源库已有：源码 / 文档可见",21,True,C["teal"])
    s.text(MARGIN+656,y+22,"◆ 扩展方向：本研究原型 / 仍需开发",21,True,C["gold"])
    s.text(MARGIN+1270,y+22,"○ 证据边界：尚未实测",21,color=C["muted"])
    y += 63

    y=s.section(y,"01","能力版图：求职者、招聘者与 Agent 三个入口","已有能力指固定快照中的实现与文档，不代表本研究已验证每项真实账号操作。 [S1–S2]")
    w=(CONTENT-2*GAP)/3
    capabilities=[
      ("求职者｜发现、整理与跟进",[
        ("发现与筛选","关键词、城市、薪资、经验与学历；搜索、推荐、详情；福利 AND 与 HR 活跃度过滤。"),
        ("候选与进度","缓存、候选池、标签备注、离线比较、搜索预设；进度、跟进、日报与增量观察。"),
        ("沟通与行动","会话、消息、面试、交换信息；打招呼与投递沟通。apply 最小实现复用立即沟通。")]),
      ("招聘者｜候选人、简历与职位",[
        ("发现与资料","候选人搜索、推荐、投递申请、在线简历；需要招聘者会话与对应权限。"),
        ("沟通与附件","会话、历史消息、最近摘要、回复与交换信息；请求、同意和下载已收附件简历。"),
        ("招聘工作管理","职位查询、上线与下线、首次招呼；资料访问与写操作受平台权限和操作边界约束。")]),
      ("Agent / 开发者｜调用与恢复",[
        ("统一调用契约","CLI、Python API、MCP 共用业务层；schema 暴露参数、能力可用性与风险信息。"),
        ("结构化与可恢复","JSON 数据、分页、错误与后续提示；SQLite 状态、预算、run ID、断点与停止控制。"),
        ("可选模型分析","JD 匹配、简历润色与定向优化、回复草稿、沟通建议及面试准备；需另配模型服务。")])]
    heights=[]
    for i,(title,items) in enumerate(capabilities):
        heights.append(s.card(MARGIN+i*(w+GAP),y,w,title,items))
    s.equal_height(y,max(heights))
    y += max(heights)+17
    s.rect(MARGIN,y,CONTENT,61,C["mint"],radius=7)
    s.text(MARGIN+22,y+39,"基础搜索 / 词表规则无需大模型；本地离线操作不必访问平台；刷新、补查详情和真实动作会增加平台请求。",24)
    y += 104

    y=s.section(y,"02","技术原理：API 是数据入口，浏览器是请求环境","主取数结果是内部网页接口 JSON。浏览器 fetch、网络监听与 DOM 文本提取，需要分开理解。 [S3–S6]")
    s.rect(MARGIN,y,CONTENT,82,C["dark"],radius=10)
    s.text(MARGIN+24,y+33,"用户目标 → CLI / MCP / Python API → 会话与通道路由",27,True,C["white"])
    s.text(MARGIN+24,y+66,"AuthManager / 页面会话：Cookie + __zp_stoken__ 等页面令牌 + 账号角色权限",23,False,"#C9DECC")
    y += 110
    route_top=y
    routes=[
      ("A｜HTTP 直连",[("httpx + 保存的凭据","允许 HTTP 的会话中，直接向网页内部接口发请求；不需要逐条提取 DOM 卡片。"),("典型路径","详情 / 卡片等适用操作；是否走 HTTP 还取决于配置与已连接的浏览器会话。")]),
      ("B｜浏览器内 fetch",[("CDP / Patchright + 页面","在 BOSS 页面环境请求同源接口并取 JSON；正常搜索与推荐直接进入浏览器请求方法。"),("典型路径","搜索、推荐与适用的沟通操作。显式 existing-browser 来源有只读复用边界。")]),
      ("C｜页面驱动 + 网络监听",[("DrissionPage 专用 crawl","独立 profile；导航与滚动加载后，监听 joblist.json 响应。DOM / 页面状态辅助检查。"),("普通监听失败时","可退到同一页面内 fetch；详情也页面内 fetch，不把浏览器凭据拷给 httpx 回退。")])]
    route_h=[]
    for i,(title,items) in enumerate(routes):
        route_h.append(s.card(MARGIN+i*(w+GAP),y,w,title,items))
    s.equal_height(y,max(route_h))
    route_h=[max(route_h)]*3
    for i in range(3):
        cx=MARGIN+i*(w+GAP)+w/2
        s.arrow(cx,route_top-23,cx,route_top-6)
    y += max(route_h)+38
    for i in range(3):
        cx=MARGIN+i*(w+GAP)+w/2
        s.arrow(cx,route_top+route_h[i]+5,cx,y-9)
    s.rect(MARGIN,y,CONTENT,79,C["mint"],radius=9)
    s.text(MARGIN+24,y+34,"BOSS 网页内部 /wapi/… 接口 → 服务端身份、权限、频率与环境校验 → JSON",28,True)
    s.text(MARGIN+24,y+64,"所查源码未显示官方开放平台授权接入；工具层 CLI / MCP 接口不扩大平台数据权限。",22,color=C["muted"])
    y += 104
    notes=[
      "通道路由：显式 CDP、非 auto 浏览器来源或已接入 CDP 的会话会进入 browser-only，适用平台请求保留在浏览器；缺少实现可报错。",
      "回退边界：job_card 在允许 HTTP 时优先 httpx，普通异常可回退浏览器；风险停止异常直接抛出。浏览器路径不继承整套 HTTP 刷新重试。",
      "页面边界：部分招聘者流程访问现有聊天页 JS 运行时；existing-browser 只复用已有目标页，不代表授权发送、投递或启动新登录。"
    ]
    left_w=(CONTENT-GAP)*.63
    right_x=MARGIN+left_w+GAP
    s.arrow(MARGIN+left_w/2,y-20,MARGIN+left_w/2,y-5)
    s.rect(MARGIN,y,left_w,172,C["paper"],C["line"])
    s.text(MARGIN+25,y+41,"本地业务层｜把原始数据组织成可用结果",28,True)
    s.block(MARGIN+25,y+64,left_w-50,"字段适配 → 标签 / 描述规则 → AND 筛选与排序\nSQLite：缓存、候选池、任务状态、预算、断点\n本地规则不理解否定和真实待遇；补查详情会消耗请求。",23,color=C["muted"])
    right_w=CONTENT-left_w-GAP
    s.rect(right_x,y,right_w,172,C["mint"],radius=12)
    s.text(right_x+25,y+41,"按需：另一套模型 API",28,True,C["teal"])
    s.block(right_x+25,y+64,right_w-50,"简历 / JD → 配置的 /chat/completions\n可指向外部或本地服务；输入可能离开本机。\n模型服务不替代平台会话、权限与事实核对。",23,color=C["muted"])
    s.arrow(MARGIN+left_w+2,y+86,right_x-3,y+86)
    y += 201
    s.arrow(MARGIN+left_w/2,y-24,MARGIN+left_w/2,y-3)
    s.arrow(right_x+right_w/2,y-24,right_x+right_w/2,y-3)
    s.rect(MARGIN,y,CONTENT,73,C["dark"],radius=9)
    s.text(MARGIN+24,y+32,"输出：岗位清单 / 导出 / JSON 信封 / 后续动作 / 可恢复 workflow",28,True,C["white"])
    s.text(MARGIN+24,y+60,"工具信封示意：ok · data · pagination · error · hints        →        可接自己的界面、分析方法与工作流",22,False,"#C9DECC")
    y += 97
    for note in notes:
        y=s.block(MARGIN+10,y,CONTENT-20,note,23,color=C["muted"])+9
    y += 28

    y=s.section(y,"03","呈现效果：我们实际演示了什么","本仓库 008 保留原始实验；013 展示总览与职业探索原型。以下岗位和公司均为合成数据。 [E1–E3]")
    demos=[
      ("候选岗位清单｜规则复现",[("8 个合成岗位","杭州 + 双休 + 五险一金：5 / 8 命中，其中 2 个按人工语义标注不满足。"),("可见边界","“不提供双休”仍可能命中；“周末休两天”可能漏判。10 个手选探针有 4 个语义差异，非准确率评测。")]),
      ("JSON 输出｜结构示意",[("与筛选结果同步","切换城市和福利条件后，清单与 JSON 一起变化；可复制文本，交由后续工具处理。"),("可见边界","信封是研究简化示意，不是 BOSS 实际响应，也不是本轮真实 CLI 在线输出。")]),
      ("职业画像｜本研究新增",[("9 个手工结构化样本","后端 / 数据 / AI 应用三个方向，各 3 个；按岗位计数技能，查看任务、样本 ID 与技能对照。"),("可见边界","没有运行模型抽取；技能勾选是自述。频次只描述示例内部构成，不是市场占比或能力认证。")])]
    hs=[]
    for i,(title,items) in enumerate(demos):
        hs.append(s.card(MARGIN+i*(w+GAP),y,w,title,items,"extension" if i==2 else "existing"))
    s.equal_height(y,max(hs))
    y += max(hs)+45

    y=s.section(y,"04","可实现场景：复用哪些基础，还要补齐什么","绿色场景已有较多业务基础；◆ 场景需要新增分析与数据建设。职业画像在本页只有合成原型。")
    columns=[255,405,575,CONTENT-1235]
    headers=["场景 / 成熟度","库提供的基础","仍需建设","产物与判断边界"]
    table_y=y
    s.rect(MARGIN,y,CONTENT,58,C["dark"],radius=8)
    xx=MARGIN
    for width,title in zip(columns,headers):
        s.text(xx+18,y+38,title,24,True,C["white"]);xx+=width
    y+=58
    rows=[
      ["● 求职筛选与跟进","搜索、详情、规则、候选池与进度","个人条件、证据核对、排序与确认","候选清单 / 跟进表；规则命中仍需复核"],
      ["◆ 职业画像","岗位入口、详情、导出与可选 AI","技能 / 任务提取、术语归一化、去重、频次、原文溯源","岗位要求画像；JD 不涵盖全部真实工作"],
      ["◆ 方向 / 城市比较","按关键词、城市等条件搜索并保存","统一采样口径、职业分类、薪资解析与比较方法","共性 / 差异对照；少量样本不代表总体"],
      ["◆ 个人差距探索","本地简历、JD 分析与候选匹配","个人经历证据、逐项对照、人工复核与行动清单","学习 / 访谈 / 实践任务；不预测录用概率"],
      ["◆ 需求变化观察","增量读取、本地状态、可恢复采集","带时间戳的历史快照、去重与同口径时间比较","要求变化记录；单次搜索不能说明趋势"],
      ["● 招聘工作助手","候选人、简历、沟通、附件与职位接口","业务界面、角色权限、动作确认、记录与团队流程","工作列表 / 流程助手；须具备对应权限"]]
    for i,row in enumerate(rows):
        rh=max(len(s.wrap(value,width-36,23,j==0))*23*1.5 for j,(value,width) in enumerate(zip(row,columns)))+33
        s.rect(MARGIN,y,CONTENT,rh,C["paper"] if i%2==0 else "#EAF0E5",radius=0)
        xx=MARGIN
        for j,(value,width) in enumerate(zip(row,columns)):
            s.block(xx+18,y+14,width-36,value,23,j==0,C["gold"] if j==0 and value.startswith('◆') else C["ink"] if j==0 else C["muted"],leading=1.5)
            xx+=width
        y+=rh
    y+=43

    y=s.section(y,"05","风险与控制：能调用、能登录，不等于稳定可用","下列是机制与使用边界分析。本轮没有测量真实平台通过率、封禁率或实际求职 / 招聘效果。 [S3–S7]")
    risks=[
      ("平台风控与会话异常","账号、IP、频率、令牌和环境都影响结果；HTTP 401 / 403 / 429、安全页与业务码要分类处理，code 37 不宜一律刷新。","已有节流、预算、冷却与风险锁；命中风险先保存状态并停止。浏览器、慢速或重新登录均不保证放行。"),
      ("内部接口与页面漂移","字段、路径、页面令牌、聊天运行时、浏览器版本与监听行为都可能变化；JSON 成功也可能缺数据。","固定版本、检查业务状态、结构与少量样本；schema 或本地健康检查成功不证明 live 平台可用。"),
      ("会话、个人资料与权限","Cookie、Token、profile、调试端口和 SQLite 可能暴露会话、简历、聊天或联系方式。","本机端口与文件限权、脱敏、最少保存及清理。MIT 许可覆盖代码，不扩大平台数据权限或保存授权。"),
      ("写操作副作用与重复","打招呼、消息、交换信息和职位状态会产生真实影响；超时后远端结果可能未知。apply 不证明附件已送达。","仅适用且标注 replay_safe 的请求允许自动重试；写操作需核对远端结果，设置业务确认与操作记录。"),
      ("模型资料传输、费用与幻觉","启用 AI 会向配置端点发送输入，可能产生费用、资料处理风险，以及缺乏依据的建议。","核对目的端与输入范围，必要时脱敏或选本地服务；重要结论回查原文。分析分数不等于录用概率。"),
      ("样本偏差与结论过度","规则误判、个性化推荐、重复 JD 和采样口径会影响统计；招聘要求也不能替代真实工作体验。","记录时间、条件与原文，归一化、去重并复核；补从业者访谈与实践证据。合成演示不作为市场事实。")]
    for start in (0,3):
        row_y=y
        hs=[]
        for i,(title,problem,control) in enumerate(risks[start:start+3]):
            x=MARGIN+i*(w+GAP)
            pos=len(s.ops)
            s.text(x+25,row_y+43,f"{start+i+1:02d}  {title}",27,True,C["gold"])
            end=s.block(x+25,row_y+64,w-50,problem,23,color=C["muted"])+16
            s.line(x+25,end,x+w-25,end,"#DCCFB7")
            end=s.block(x+25,end+16,w-50,control,23,color=C["gold"])+24
            h=end-row_y
            s.ops.insert(pos,("rect",x,row_y,w,h,C["risk"],"#E0D4BF",12))
            hs.append(h)
        s.equal_height(row_y,max(hs))
        y=row_y+max(hs)+GAP
    s.rect(MARGIN,y,CONTENT,81,C["sand"],radius=8)
    s.block(MARGIN+22,y+12,CONTENT-44,"运行原则：明确数量、时间、重试和停止上限；复用指定 run ID；保存 checkpoint；风险停止后核实再继续。assisted / research 的名称不取消预算、权限、数据保管与平台规则。",24,color=C["gold"])
    y+=126

    y=s.section(y,"06","意义与实施顺序：从操作能力，形成有证据的探索","以下为我们的工程理解与扩展判断，完整职业分析产品仍需自己的数据模型、分析方法和验证。")
    meaning=[
      ("对个人：形成值得验证的问题",[("从要求到探索","把岗位任务与技能变成学习、访谈和项目实践清单；用个人经历逐项举证，辅助判断方向。")]),
      ("对开发者：复用业务基础",[("从人工操作到工具调用","复用会话适配、字段组织、JSON 契约与本地状态，把投入集中在产品界面和可解释分析。")]),
      ("对研究：积累可追溯样本",[("从一次搜索到可比较记录","保存条件、时间与原文，持续去重和复核；逐步形成同口径的职业要求观察，而非无依据结论。")])]
    hs=[]
    for i,(title,items) in enumerate(meaning):
        hs.append(s.card(MARGIN+i*(w+GAP),y,w,title,items,"extension"))
    s.equal_height(y,max(hs))
    y+=max(hs)+22
    s.rect(MARGIN,y,CONTENT,107,C["dark"],radius=10)
    s.text(MARGIN+24,y+38,"建议最小路径",27,True,C["white"])
    s.text(MARGIN+24,y+78,"固定探索问题 → 少量有界样本 + 原文 → 手工核对字段 → 职业画像 / 方向比较 → 个人经历对照 → 长期观察",25,False,"#D7E7D2")
    y+=151

    y=s.section(y,"07","证据边界与来源：把事实、演示和设想分开","当前结论是固定快照的研究记录，不是对最新版本、全部功能或真实账号成功率的承诺。")
    evidence=[
      ("14 个固定源码文件","本轮记录 SHA-256；v3.0.0 / 4716ee1。覆盖会话、客户端、crawl、筛选、模型服务与风险锁。"),
      ("30 项当前本地检查","规则回归、条件组合与职业画像逻辑；浏览器另核对六场景、交互、资源与桌面 / 窄屏。"),
      ("59 项历史离线测试","008 的 2026.10.16 旧快照；仅确认四个福利相关符号 AST 未变，不能当作新版本全部回归。"),
      ("真实平台 / 模型调用 = 0","未测试真实登录、在线搜索、消息发送、简历送达或模型输出；没有真实求职效果与封禁率证据。")]
    ew=(CONTENT-3*GAP)/4
    hs=[]
    for i,(title,body) in enumerate(evidence):
        x=MARGIN+i*(ew+GAP)
        s.text(x,y+27,title,24,True)
        hs.append(s.block(x,y+46,ew-12,body,21,color=C["muted"])-y)
    y+=max(hs)+30
    s.line(MARGIN,y,WIDTH-MARGIN,y)
    y+=20
    s.text(MARGIN,y+22,"源库：github.com/can4hou6joeng4/boss-agent-cli  ·  固定 commit：4716ee1d211533db70ac7cc1ab2322eb269b43a0",20,color=C["muted"])
    y+=42
    links=[("S1 README",BASE+"README.md"),
           ("S2 能力矩阵",BASE+"docs/capability-matrix.md"),
           ("S3 客户端",BASE+"src/boss_agent_cli/api/client.py"),
           ("S4 模式路由",BASE+"src/boss_agent_cli/api/_base_client.py"),
           ("S5 crawl",BASE+"src/boss_agent_cli/crawler/transport.py"),
           ("S6 AI",BASE+"src/boss_agent_cli/ai/service.py"),
           ("S7 风险",BASE+"docs/platform-risk.md"),
           ("S8 浏览器",BASE+"src/boss_agent_cli/api/browser_client.py")]
    x=MARGIN
    for label,url in links:
        s.text(x,y+23,label,21,True,C["teal"],url)
        x+=font(21,True).getlength(label)+47
    y+=43
    s.text(MARGIN,y+22,"E1–E3：本仓库 008 原始实验、013 模型检查与合成样本；详见 references/sources.json、verification.json。",20,color=C["muted"])
    y+=39
    s.text(MARGIN,y+22,"本图由 013 研究项目整理；绿色为源库能力，琥珀色为扩展 / 风险；矢量文字与高分辨率图片表达同一张图。",20,color=C["muted"])
    y+=MARGIN+28
    s.save(math.ceil(y))


if __name__ == "__main__":
    main()
