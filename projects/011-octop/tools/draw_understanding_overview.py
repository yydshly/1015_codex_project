"""Typeset the complete Chinese research infographic as native SVG and render a PNG.

Pillow is used for font metrics only. Chromium renders the original vector source;
no generated raster image is edited. No model API or external service is called.
"""
from functools import lru_cache
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape

from PIL import ImageFont
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets"
W = 2160
M = 92
CW = W - M * 2
P = {"paper":"#f6f6ee", "white":"#fffef7", "ink":"#153d40", "body":"#405d59",
     "muted":"#62786b", "line":"#ccd9c5", "green":"#347861", "mint":"#e2efdc",
     "dark":"#112f34", "dark2":"#23474a", "light":"#c5dfc8", "amber":"#ad7139",
     "amberbg":"#f3e7d3", "gray":"#727b83", "graybg":"#e7eaE7", "blue":"#426c8c",
     "bluebg":"#e4eef4"}
REGULAR = Path("C:/Windows/Fonts/msyh.ttc")
BOLD = Path("C:/Windows/Fonts/msyhbd.ttc")
elements = []
stats = {"text_blocks":0, "characters":0, "sections":6, "layout_overflows":[]}

@lru_cache(maxsize=80)
def font(size, bold=False):
    return ImageFont.truetype(str(BOLD if bold and BOLD.exists() else REGULAR), size)

def lines(value, width, size, bold=False):
    result = []
    for paragraph in value.split("\n"):
        current = ""
        tokens = re.findall(r"[A-Za-z0-9_./+−-]+|\s+|[^A-Za-z0-9_./+−\s-]", paragraph)
        for token in tokens:
            if font(size, bold).getlength(current + token) <= width:
                current += token
                continue
            if current.strip():
                result.append(current.strip())
                current = ""
            if font(size, bold).getlength(token) > width:
                for char in token:
                    if font(size, bold).getlength(current + char) > width and current:
                        result.append(current)
                        current = ""
                    current += char
            else:
                current = token.lstrip()
        if current.strip():
            result.append(current.strip())
    return result or [""]

def height(value, width, size=30, lh=46, bold=False):
    return len(lines(value, width, size, bold)) * lh

def rect(x,y,w,h,fill=None,stroke=None,r=0,sw=1.5):
    elements.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill or P["white"]}" stroke="{stroke or "none"}" stroke-width="{sw}"/>')

def txt(x,y,value,size=30,color=None,bold=False,anchor="start",family=None):
    stats["text_blocks"] += 1
    stats["characters"] += len(value)
    elements.append(f'<text x="{x}" y="{y+size}" font-size="{size}" fill="{color or P["body"]}" font-weight="{700 if bold else 400}" text-anchor="{anchor}" font-family="{family or "Microsoft YaHei, sans-serif"}">{escape(value)}</text>')

def para(x,y,value,width,size=30,lh=46,color=None,bold=False):
    wrapped = lines(value,width,size,bold)
    for i,line in enumerate(wrapped):
        txt(x,y+i*lh,line,size,color,bold)
    return len(wrapped)*lh

def rule(y,x=M,w=CW,color=None):
    elements.append(f'<path d="M{x} {y}H{x+w}" stroke="{color or P["line"]}" stroke-width="2"/>')

def path(d,color=None,sw=3,arrow=False,dash=False):
    elements.append(f'<path d="{d}" fill="none" stroke="{color or P["green"]}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"{(" marker-end="+chr(34)+"url(#arrow)"+chr(34)) if arrow else ""}{(" stroke-dasharray="+chr(34)+"8 9"+chr(34)) if dash else ""}/>')

def chip(x,y,value,kind="green",size=24):
    fg,bg={"green":(P["green"],P["mint"]),"amber":(P["amber"],P["amberbg"]),"gray":(P["gray"],P["graybg"]),"blue":(P["blue"],P["bluebg"])}[kind]
    width = font(size).getlength(value)+34
    rect(x,y,width,45,bg,r=22)
    txt(x+17,y+6,value,size,fg)
    return width

def heading(y,index,title,tag):
    txt(M,y,index,61,P["green"],False,family="Georgia, serif")
    txt(M+112,y+7,title,48,P["ink"],True)
    txt(W-M,y+24,tag,24,P["muted"],anchor="end")
    rule(y+94)
    return y+126

def note(y,value,kind="green",size=28):
    bg,fg={"green":(P["mint"],P["body"]),"amber":(P["amberbg"],P["amber"]),"blue":(P["bluebg"],P["blue"])}[kind]
    h=height(value,CW-64,size,43)+40
    rect(M,y,CW,h,bg,r=12)
    para(M+32,y+18,value,CW-64,size,43,fg)
    return y+h

def main():
    OUT.mkdir(exist_ok=True)
    txt(M,58,"RESEARCH 011 / OCTOP",25,P["green"],True)
    txt(W-M,58,"理解总览 · 2026.10.20",24,P["muted"],anchor="end")
    txt(M,111,"Octop 理解全景图",100,P["ink"],True)
    txt(M,243,"从聊天入口，到模型判断、工具执行与持续服务",36,P["body"])
    rect(M,318,CW,124,P["ink"],r=17)
    txt(M+34,336,"群聊是入口之一；核心是把 Agent 执行与后台管理",38,"#edf4df",True)
    txt(M+34,389,"组织成可自建、可配置、可扩展的 AI 助手服务。",33,"#b7d6bf")
    txt(M,468,"体验：在群聊或私聊里让 Agent 办事。后台：身份、上下文、模型、工具与状态管理。",28,P["body"])
    x=M
    for value,kind in [("已有 · 文档 / 源码","green"),("Beta","amber"),("规划","gray"),("扩展方案 / 我们的建议","blue")]:
        x += chip(x,526,value,kind,22)+16

    y=heading(630,"01","本质与原理：消息怎样变成真实动作？","接入 → 判断 → 执行 → 验收")
    dy=y
    rect(M,dy,CW,718,P["dark"],r=20)
    txt(M+32,dy+25,"Octop 服务端：多种入口，共用一套可管理的 Agent 运行时",30,"#d7e8ce",True)
    inputs=["群聊 / 私聊","Web / CLI / API","定时任务"]
    for i,label in enumerate(inputs):
        x=M+32+i*340
        rect(x,dy+91,310,60,P["dark2"],"#45675d",r=9)
        txt(x+155,dy+107,label,26,"#c8ddc5",anchor="middle")
    rect(M+1250,dy+85,660,72,"#b6d9bd",r=12)
    txt(M+1280,dy+104,"模型服务：云端 API / 本地 Ollama",27,P["ink"],True)
    names=["接收消息","识别用户与专家","加载上下文","模型判断","工具执行","返回结果","回传与保存"]
    small=["统一入口","身份与会话","记忆 + 知识库","提出下一步","程序实际操作","产物或错误","用户与工作区"]
    gap=19
    node_w=(CW-64-gap*6)/7
    nodes=[]
    for i,name in enumerate(names):
        x=M+32+i*(node_w+gap)
        nodes.append(x+node_w/2)
        rect(x,dy+225,node_w,145,"#25494b","#527365",r=10)
        txt(x+20,dy+239,f"{i+1:02d}",23,"#8eb69b",family="Georgia, serif")
        txt(x+node_w/2,dy+279,name,27,"#f0f2dc",True,anchor="middle")
        txt(x+node_w/2,dy+326,small[i],22,"#9bbda0",anchor="middle")
        if i<6:
            path(f"M{x+node_w+2} {dy+297}H{x+node_w+gap-4}","#b6d6b5",2.5,True)
    for i in range(3):
        center=M+32+i*340+155
        path(f"M{center} {dy+151}V{dy+179}H{nodes[0]}","#9bbda0",2)
    path(f"M{nodes[0]} {dy+179}V{dy+220}","#9bbda0",2,True)
    path(f"M{nodes[3]} {dy+220}V{dy+190}H{M+1560}V{dy+160}","#9bbda0",2,True)
    path(f"M{nodes[5]} {dy+373}V{dy+416}H{nodes[3]}V{dy+376}","#a5caaa",3,True)
    txt((nodes[5]+nodes[3])/2,dy+431,"结果返回模型 → 继续处理 / 请求协助 / 结束",24,"#a9c6aa",anchor="middle")
    labels=[("文件 / 终端 / 浏览器","读取、命令、网页操作"),("MCP / 连接器","业务工具与数据"),("ACP 执行器","委派给已配置的编程助手")]
    for i,(label,sub) in enumerate(labels):
        x=M+32+i*644
        rect(x,dy+505,620,103,"#1d3d3f","#3f6053",r=9)
        txt(x+23,dy+519,label,27,"#d2e2c7",True)
        txt(x+23,dy+563,sub,23,"#95b79b")
    txt(M+32,dy+638,"模型提出工具调用；动作由工具执行。工具返回结果后，模型继续判断。",28,"#d0e1c7")
    txt(M+32,dy+681,"实际位置：部署主机 / 配置的工作环境 / 外部业务服务；使用相应账号与权限。",23,"#94b39b")
    y=dy+750
    y+=para(M,y,"技术基础：Python / FastAPI + React；octop-harness（LangGraph）、Gateway、Memory、Browser。",CW,27,43,P["muted"])
    y+=para(M,y+9,"控制面数据库：SQLite / PostgreSQL。工作区保存文件与产物；聊天入口不会自动授予业务权限。",CW,27,43,P["muted"])+78

    y=heading(y,"02","能力与效果：这套服务能带来什么？","能力状态按固定研究版本记录")
    caps=[
        ("多种入口","Web、CLI、API、飞书、钉钉、微信、企微等请求汇入同一服务。","green","已有"),
        ("多用户 / 多专家","为成员和岗位配置模型、资料、独立工作区与可用工具。","green","已有"),
        ("记忆 + 知识库","延续上下文；检索 PDF、Word、Excel、Markdown 等资料。","green","已有"),
        ("真实工具执行","读写文件、运行脚本、操作网页、调用业务接口与专门工具。","green","已有"),
        ("定时任务","直接发送固定提醒，或每次查询、分析最新信息并回传。","green","已有"),
        ("MCP / ACP / 插件","连接业务工具与数据；把编程工作交给已配置的执行器。","green","已有"),
        ("专家团队","主持人派工，成员用各自工作区执行并回报；收益需实测。","amber","Beta"),
        ("技能录制 / 自动提炼","浏览器工作流录制与从对话自动提炼技能仍在路线图中。","gray","规划")]
    gap=20
    cw=(CW-3*gap)/4
    rowh=max(132+height(c[1],cw-44,28,43) for c in caps)
    for i,(title,body,kind,status) in enumerate(caps):
        x=M+(i%4)*(cw+gap); cy=y+(i//4)*(rowh+20)
        rect(x,cy,cw,rowh,P["white"],P["line"],r=13)
        txt(x+22,cy+21,f"{i+1:02d}",25,P["muted"],family="Georgia, serif")
        chip(x+cw-123,cy+16,status,kind,21)
        txt(x+22,cy+73,title,30,P["ink"],True)
        para(x+22,cy+124,body,cw-44,28,43,P["body"])
    y+=2*rowh+20+30
    y=note(y,"能力存在、工具调用成功、业务任务达成，是不同层次。真正的效果要看可检查的产物。",size=28)+78

    y=heading(y,"03","使用场景：从输入，走到可验收的产物","以下是配置后的应用方案")
    scenes=[
        ("团队资料问答","成员提问 → 检索获授权资料 → 带依据的回答","先导入资料，配置检索与模型，检查引用和回答。"),
        ("项目更新研究","项目清单 → GitHub API / MCP / 脚本 → 中文 Markdown + 渠道通知","信息源、去重状态、保存与通知渠道须另行配置。"),
        ("日志排障与报告","授权日志 → 文件读取与脚本分析 → 报告 + 执行记录","需要目录权限、执行环境，并检查分析结果。"),
        ("编程任务入口","复现问题 → ACP 委派编程助手 → 代码差异 + 检查结果","主机须安装并认证对应 CLI，明确目标目录和验收。")]
    gap=24; cw=(CW-gap)/2
    rowh=max(93+height(s[1],cw-64,30,47,True)+25+height(s[2],cw-64,26,40) for s in scenes)+22
    for i,(title,flow,condition) in enumerate(scenes):
        x=M+(i%2)*(cw+gap); cy=y+(i//2)*(rowh+24)
        rect(x,cy,cw,rowh,"#edf2e6",P["line"],r=14)
        txt(x+30,cy+22,title,33,P["green"],True)
        th=para(x+30,cy+87,flow,cw-64,30,47,P["ink"],True)
        para(x+30,cy+87+th+22,condition,cw-64,26,40,P["muted"])
    y+=2*rowh+24+27
    y=note(y,"这里展示的是输入、动作与预期产物，不是实际运行日志；需要分别配置工具、信息源和授权。",size=27)+78

    y=heading(y,"04","可扩展方式：把接口接到业务现场","现有扩展点 + 我们的工程建议")
    ext=[
        ("模型与存储","兼容 API / Ollama / 工作区后端","选择模型策略、数据库与文件环境；核对工具调用、费用和数据流向。","green"),
        ("消息渠道","Gateway 适配","扩展自有消息平台；映射用户与群聊，处理重复消息、长任务回传和错误。","green"),
        ("业务系统","MCP / 连接器 / 插件","连接 CRM、工单、内部 API 与资料库；定义查询、写操作和明确的授权范围。","green"),
        ("岗位方法","专家配置 / Skills / 脚本","把客服、研究、报告和标准操作流程封装为岗位能力，约定输入与产物格式。","green"),
        ("专业执行","ACP runner","委派编程、审查等任务；交付可检查的差异、日志或专门工具的输出。","green"),
        ("可靠性与产品化","任务状态 / 幂等 / 恢复 / 审计","补齐失败重试、取消传播、配额与人工接管；这些是需要设计和验证的工程工作。","blue")]
    gap=24; cw=(CW-gap)/2
    rowh=max(140+height(e[2],cw-64,29,44) for e in ext)+30
    for i,(title,tech,body,kind) in enumerate(ext):
        x=M+(i%2)*(cw+gap); cy=y+(i//2)*(rowh+22)
        rect(x,cy,cw,rowh,P["white"],P["line"],r=13)
        rect(x,cy+25,5,rowh-50,P["blue"] if kind=="blue" else P["green"],r=2)
        txt(x+30,cy+20,title,33,P["ink"],True)
        if kind=="blue": chip(x+cw-217,cy+16,"我们的建议","blue",21)
        txt(x+30,cy+78,tech,27,P["blue"] if kind=="blue" else P["green"])
        para(x+30,cy+133,body,cw-64,29,44,P["body"])
    y+=3*rowh+44+27
    y=note(y,"可扩展场景：内部客服、运维巡检、销售 CRM、研究简报、跨系统工单。每个场景都需要接入、授权和验收。","blue",27)+78

    y=heading(y,"05","同类产品对比：差异在哪里？","四者都具备工具执行能力")
    widths=[248]+[(CW-248)/4]*4
    headers=[("比较维度",""),("Octop","自建助手平台"),("Codex","工程与工具任务"),("dots","持续职责与跟进"),("Grok Bot","官方常驻 Bot 团队")]
    rows=[
        ("主要定位",["搭建自己管理的 AI 助手服务","构建、调试、测试、审查软件及其他工具任务","承接持续职责，在对话之间主动推进工作","持久化 Bot 团队，跨应用协作办事"]),
        ("运行与维护",["你的电脑或服务器；你负责升级、备份和凭证","可用官方产品；CLI / SDK 可自行集成","官方云端，也可授权连接个人电脑","官方持久化云端电脑"]),
        ("实际执行",["主机工具、配置的工作环境、MCP / ACP","代码、命令、文件和已授权工具","云端电脑与浏览器，可委派 Work / Codex","浏览器、文件、终端、连接器与电脑操作"]),
        ("定制范围",["模型、消息渠道、存储、工具乃至平台源码","项目指令、Skills、插件、CLI / SDK；依形态而异","官方支持的连接、权限、规则与任务配置","官方支持的 Bot、连接器、技能与运行设置"]),
        ("持续工作",["Cron + 多专家；团队协调仍为 Beta","支持定时任务和可扩展的任务流程","持续跟进、后台分工、可保存的日程","多个 Bot 并行、相互交接、技能和例行任务"]),
        ("电脑关机后",["部署主机常开即可继续；本机部署随关机停止","取决于任务在本地还是云端运行","云端工作继续；本地步骤要求连接电脑在线","云端工作继续"])]
    cy=y; x=M; hh=124
    for i,(title,sub) in enumerate(headers):
        rect(x,cy,widths[i],hh,P["ink"] if i==1 else "#e7eddf",P["line"])
        txt(x+22,cy+20,title,33,"#eff6df" if i==1 else P["ink"],True)
        if sub: txt(x+22,cy+75,sub,23,"#bdd7bd" if i==1 else P["muted"])
        x+=widths[i]
    cy+=hh
    for row_title,cells in rows:
        rh=max(94,max(height(c,widths[i+1]-44,28,43) for i,c in enumerate(cells))+38)
        x=M
        rect(x,cy,widths[0],rh,"#edf1e5",P["line"])
        para(x+20,cy+20,row_title,widths[0]-40,28,43,P["ink"],True)
        x+=widths[0]
        for i,c in enumerate(cells):
            rect(x,cy,widths[i+1],rh,"#e8f1e0" if i==0 else P["white"],P["line"])
            para(x+22,cy+18,c,widths[i+1]-44,28,43,P["body"])
            x+=widths[i+1]
        cy+=rh
    y=cy+28
    y+=para(M,y,"Octop 的差异主要在自部署、国内 IM、内部业务接入和源码控制。功能重叠不代表同等完成率。",CW,28,44,P["green"],True)
    y+=para(M,y+10,"稳定性、费用与人工接管成本，需要用同一组任务实测。Grok Bot 指官方常驻智能体产品。",CW,26,41,P["muted"])+78

    y=heading(y,"06","我们的思考：什么情况下值得用？","先确认必要条件，再投入自建")
    decisions=[
        ("只想在群里调用 Agent","轻量机器人适配层 + Agent 执行器，可能已经够用。","先验证一次完整任务的输入、执行与回传。"),
        ("需要自己的 AI 服务","多人管理、内网业务、模型策略、源码定制，让 Octop 的增量价值更明确。","先选一个岗位、一条渠道、一种可验收产物。"),
        ("主要做个人通用工作","先用 Codex、dots 或 Grok Bot 跑通研究、编码或持续跟踪任务。","记录真实效果，再判断额外部署和维护是否值得。")]
    gap=22; cw=(CW-gap*2)/3
    rh=max(110+height(d[1],cw-54,29,45)+18+height(d[2],cw-54,25,39) for d in decisions)+30
    for i,(title,body,action) in enumerate(decisions):
        x=M+i*(cw+gap)
        rect(x,y,cw,rh,"#e8eee0",P["line"],r=13)
        txt(x+27,y+24,title,31,P["ink"],True)
        h=para(x+27,y+93,body,cw-54,29,45,P["body"])
        para(x+27,y+93+h+20,action,cw-54,25,39,P["muted"])
    y+=rh+30
    rect(M,y,CW,168,P["ink"],r=15)
    txt(M+33,y+24,"自建的收益，由必要的控制需求支撑。",43,"#eff4de",True)
    txt(M+33,y+91,"可靠性，用来源、产物、执行记录、失败恢复与人工接管来验证。",32,"#bed9bd")
    y+=204
    caveats=[
        "入口、模型能力、工具动作和结果验收要分别理解；增加专家数量不自动提高任务质量。",
        "自部署时仍需检查数据流向：云端模型接收请求上下文，远程连接器也有自己的数据流。",
        "团队仍 Beta：重启可能丢失在途任务；取消主持人不会自动取消成员。"]
    for i,value in enumerate(caveats):
        txt(M,y,"•",27,P["amber"])
        y+=para(M+32,y,value,CW-40,27,42,P["body"])+13
    y+=25
    rule(y)
    y+=28
    txt(M,y,"研究范围：文档与源码核查；尚未运行 Octop，也未完成同任务产品实测。",25,P["muted"])
    y+=49
    txt(M,y,"固定快照：Octop v1.0.2 / dd9dce4 · 核查日期：2026.10.20 · 独立研究示意，非官方宣传图",23,P["muted"])
    y+=49
    sources=["github.com/TencentCloud/Octop", "learn.chatgpt.com/docs/dots", "learn.chatgpt.com/docs/features", "docs.x.ai/grok-bot/overview"]
    txt(M,y,"来源",23,P["green"],True)
    y+=43
    for i,source in enumerate(sources):
        x=M+(i%2)*(CW/2)
        txt(x,y+(i//2)*38,source,22,P["muted"])
    H=int(y+2*38+58)
    defs='''<defs><marker id="arrow" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M1 1L9 5L1 9" fill="none" stroke="#9fbf9e" stroke-width="1.5"/></marker></defs>'''
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc"><title id="title">Octop 理解全景图：能力、群聊入口、真实执行、场景、扩展与同类产品对比</title><desc id="desc">完整中文研究长图。群聊是多个入口之一，服务端管理身份、上下文、模型与工具执行；包含六个板块，并区分已有能力、Beta、规划和研究建议。</desc>{defs}<rect width="{W}" height="{H}" fill="{P["paper"]}"/>'+"".join(elements)+"</svg>"
    destination=OUT/"octop-understanding-overview-20261020.svg"
    destination.write_text(svg,encoding="utf-8")
    root=ET.fromstring(svg)
    for item in root.findall('{http://www.w3.org/2000/svg}text'):
        size=int(item.attrib['font-size'])
        width=font(size,item.attrib.get('font-weight')=='700').getlength(item.text or '')
        x=float(item.attrib['x']); baseline=float(item.attrib['y'])
        anchor=item.attrib.get('text-anchor','start')
        left=x-width if anchor=='end' else x-width/2 if anchor=='middle' else x
        if left<0 or left+width>W or baseline<0 or baseline+size*.25>H:
            stats['layout_overflows'].append(item.text)
    if stats['layout_overflows']:
        raise ValueError('Text exceeds the poster canvas: '+str(stats['layout_overflows']))
    png=destination.with_suffix(".png")
    qa_parent=Path("D:/codex/home/visualizations/2026/10/15/01a13fe4-91aa-7093-a76f-fe398bde6468/octop-image-qa")
    qa_parent.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        browser=playwright.chromium.launch(headless=True)
        page=browser.new_page(viewport={"width":W,"height":H},device_scale_factor=1)
        page.set_content('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}svg{display:block}</style></head><body>'+svg+'</body></html>',wait_until="load")
        page.screenshot(path=str(png),timeout=90000)
        page.set_viewport_size({"width":W,"height":1600})
        for name,top in [("top",0),("middle",int(H*.32)),("bottom",int(H*.68))]:
            page.evaluate("top => window.scrollTo(0,top)",top)
            page.screenshot(path=str(qa_parent/(name+".png")),timeout=90000)
        browser.close()
    stats.update({"width":W,"height":H,"svg":str(destination),"png":str(png),"png_bytes":png.stat().st_size,
                  "method":"Original SVG typesetting; Pillow font metrics; Chromium PNG export.",
                  "imagegen_attempt":"Built-in image_gen failed with a network error. No CLI/API fallback used.",
                  "scope":"Summary of existing project research, no new Octop runtime or product benchmark.",
                  "imagegen_prompt":"references/understanding-overview-image-prompt.txt"})
    (ROOT/"references/understanding-overview-generation.json").write_text(json.dumps(stats,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(stats,ensure_ascii=False))

if __name__=="__main__":
    main()
