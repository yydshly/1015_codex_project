"""Create a deterministic, text-searchable Chinese research infographic.

This creates a new SVG drawing. It does not edit an ImageGen output.
Render the SVG with a browser to obtain the companion PNG.
"""
from pathlib import Path
import html
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "smart-excalidraw-understanding-20261020.svg"
W, H = 1920, 6880
PAPER, INK, MUTED, LINE = "#f8f7f3", "#272733", "#73717b", "#e0dcd3"
PURPLE, LILAC, GREEN, SAGE, ORANGE, PEACH = "#7459ae", "#eee7fa", "#4f8165", "#e7f1e8", "#af7946", "#fbeddc"
S = []

def esc(value): return html.escape(str(value), quote=True)
def add(value): S.append(value)
def rect(x,y,w,h,fill="#ffffff",stroke=LINE,r=18,sw=2):
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')
def line(x,y,a,b,color="#a69ab8",width=3,dash=None,arrow=False):
    add(f'<path d="M{x} {y} L{a} {b}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round"'+(f' stroke-dasharray="{dash}"' if dash else '')+(' marker-end="url(#arrow)"' if arrow else '')+'/>')
def text(x,y,value,size=30,color=INK,weight=400,anchor="start",family=None):
    add(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}" text-anchor="{anchor}"'+(f' font-family="{family}"' if family else '')+f'>{esc(value)}</text>')
def width_units(value):
    return sum(1 if unicodedata.east_asian_width(c) in "WF" else .34 if c.isspace() else .6 for c in value)
def wrap(value,width,size):
    out=[]
    for paragraph in value.split("\n"):
        current=""
        for c in paragraph:
            if current and width_units(current+c)*size>width:
                out.append(current);current=c
            else: current+=c
        out.append(current)
    return out
def block(x,y,value,width,size=28,color=MUTED,weight=400,leading=1.6):
    lines=wrap(value,width,size)
    for i,item in enumerate(lines): text(x,y+i*size*leading,item,size,color,weight)
    return y+len(lines)*size*leading
def tag(x,y,value,fill=LILAC,color=PURPLE,size=23):
    w=width_units(value)*size+32
    rect(x,y,w,38,fill,fill,r=7,sw=0);text(x+16,y+27,value,size,color,600)
    return w
def section(y,number,title,subtitle=None):
    rect(80,y-39,61,58,LILAC,LILAC,r=12,sw=0)
    text(110,y+1,number,30,PURPLE,600,anchor="middle",family="Consolas,monospace")
    text(164,y+3,title,43,INK,650)
    if subtitle: text(164,y+51,subtitle,26,MUTED)
def node(x,y,w,h,label,tone="purple",size=23,shape="rect"):
    bg,stroke={"purple":(LILAC,PURPLE),"green":(SAGE,GREEN),"orange":(PEACH,ORANGE),"gray":("#f0eee8","#99917f"),"rose":("#f6e6e8","#b57c88")}[tone]
    if shape=="diamond": add(f'<path d="M{x+w/2} {y}L{x+w} {y+h/2}L{x+w/2} {y+h}L{x} {y+h/2}Z" fill="{bg}" stroke="{stroke}" stroke-width="2"/>')
    elif shape=="ellipse": add(f'<ellipse cx="{x+w/2}" cy="{y+h/2}" rx="{w/2}" ry="{h/2}" fill="{bg}" stroke="{stroke}" stroke-width="2"/>')
    else: rect(x,y,w,h,bg,stroke,r=10,sw=2)
    labels=label.split("\n")
    first=y+h/2-(len(labels)-1)*size*.65+size*.34
    for i,label in enumerate(labels):text(x+w/2,first+i*size*1.3,label,size,INK,500,"middle")
def group(x,y):add(f'<g transform="translate({x} {y})">')
def end():add('</g>')

def demo(kind,x,y):
    group(x+36,y)
    add('<g transform="scale(.86)">')
    if kind=="refund":
        node(5,70,120,55,"提交申请",size=23);node(160,70,120,55,"客服审核",size=23)
        line(128,97,153,97,arrow=True)
        node(320,65,100,65,"通过？","orange",22,"diamond");line(283,97,315,97,arrow=True)
        line(420,97,465,45,arrow=True);line(420,97,465,157,arrow=True)
        node(431,0,95,43,"退款","green",22);node(431,160,95,43,"告知原因","rose",20)
        text(440,73,"是",19,GREEN);text(440,146,"否",19,"#aa6874")
    elif kind=="architecture":
        node(165,0,200,43,"Web 前端",size=23);line(265,45,265,61,arrow=True)
        node(165,65,200,43,"API 网关",size=23)
        line(230,110,143,135,arrow=True);line(300,110,387,135,arrow=True)
        node(60,140,170,48,"用户服务","orange");node(300,140,170,48,"订单服务","orange")
        line(145,190,145,213,arrow=True);line(385,190,385,213,arrow=True)
        node(60,219,170,43,"MySQL","green");node(300,219,170,43,"Redis","green")
    elif kind=="er":
        node(10,30,165,70,"用户 User",size=23);node(350,30,165,70,"订单 Order",size=23)
        node(10,170,165,70,"商品 Product","green",21);node(350,170,165,70,"订单明细","orange",23)
        line(178,65,345,65);text(260,51,"1 : N",23,PURPLE,anchor="middle")
        line(432,104,432,165);text(447,145,"1:N",22,PURPLE)
        line(178,205,345,205);text(260,191,"1 : N",23,PURPLE,anchor="middle")
    elif kind=="mindmap":
        for a,b,c,d in [(180,115,118,48),(340,115,410,48),(180,143,118,218),(340,143,410,218)]:line(a,b,c,d)
        node(177,95,170,72,"缓存知识",shape="ellipse")
        node(15,10,145,67,"目的","orange",25);node(368,10,145,67,"策略","green",25)
        node(15,185,145,67,"风险","rose",25);node(368,185,145,67,"检查","green",25)
    elif kind=="gantt":
        for i in range(4):
            x=118+i*97;text(x+35,18,f"第{i+1}周",21,MUTED,anchor="middle");line(x,35,x,250,"#e5dfd5",2,dash="4 7")
        for i,(label,start,length,tone) in enumerate([("需求",0,1,"purple"),("设计",0,2,"orange"),("开发",1,2,"green"),("验收",3,1,"purple")]):
            text(15,76+i*53,label,24,INK);node(122+start*97,47+i*53,length*97-12,34,"",tone)
    else:
        node(160,10,210,64,"项目能力",size=27)
        line(265,78,265,115);line(85,115,445,115)
        for x,title,desc,tone in [(0,"输入","文字 / 文件","orange"),(180,"处理","模型 / JSON","purple"),(360,"输出","画布 / 编辑","green")]:
            line(x+85,115,x+85,143);node(x,145,170,60,title,tone,25);text(x+85,243,desc,22,MUTED,anchor="middle")
    end();end()

def build():
    add(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">')
    add('<title id="title">Smart Excalidraw 能力、原理、图表、场景与扩展全景</title><desc id="desc">把步骤、结构、关系、时间与分类整理成可编辑图解。包含三类输入、六场景效果、22类图表、五步原理、业务价值、扩展建议和实际边界。</desc>')
    add('<defs><marker id="arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M1 1 8 4.5 1 8" fill="none" stroke="#a69ab8" stroke-width="1.5" stroke-linejoin="round"/></marker><pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.2" fill="#ded6ea"/></pattern></defs>')
    add('<style>text{font-family:"Microsoft YaHei","Noto Sans CJK SC","PingFang SC",sans-serif}text{font-kerning:normal}</style>')
    rect(0,0,W,H,PAPER,PAPER,r=0,sw=0)
    text(80,92,"GITHUB RESEARCH LAB / 012",25,PURPLE,600,family="Consolas,monospace")
    text(80,210,"Smart Excalidraw 能力全景",83,INK,750)
    text(85,286,"把内容整理成结构，再画成可编辑的图",38,MUTED)
    rect(80,335,1760,162,LILAC,"#d8cbed",r=20)
    text(121,398,"最直观：把步骤用图展示。",39,INK,650)
    text(121,458,"更完整：把步骤、结构、关系、时间与分类，变成可编辑图解。",35,PURPLE,500)
    for i,(label,tone) in enumerate([("内容","orange"),("结构","purple"),("图形","green"),("理解与沟通","purple")]):
        x=80+i*450;node(x,543,410,85,label,tone,36)
        if i<3:line(x+418,585,x+442,585,arrow=True)

    section(724,"01","输入什么？","先读到素材，再组织信息。内容越清楚，图形越有依据。")
    for i,(title,subtitle,body,tone) in enumerate([
      ("文字","一句指令 / 一段内容","业务规则、文章、知识点、项目能力说明。","purple"),
      ("文本文件","MD / TXT · 最大 1MB","浏览器读取文件内容，再交给模型组织。","orange"),
      ("图片","截图 / 草图 / 已有图表","需要支持视觉的模型，识别后重新绘制。","green")]):
        x=80+i*600;rect(x,811,560,219);tag(x+26,835,title,{"purple":LILAC,"orange":PEACH,"green":SAGE}[tone],{"purple":PURPLE,"orange":ORANGE,"green":GREEN}[tone],26)
        text(x+27,922,subtitle,29,INK,600);block(x+27,971,body,503,26,MUTED,leading=1.5)
    rect(80,1053,1760,69,"#eeece6","#eeece6",r=12,sw=0)
    text(109,1097,"数据库、Excel、外部 API、完整仓库：先提取内容，或另外开发连接器。",29,MUTED)

    section(1216,"02","实际能做出什么效果？","相同的基础图形，可以表达不同业务；按关系选择布局。")
    cards=[("退款审批","业务规则 → 带分支的流程图","refund","核对审批条件与处理结果。"),("系统设计","组件与依赖 → 分层架构图","architecture","对齐服务职责与数据依赖。"),("数据建模","实体与字段 → ER 关系图","er","讨论主外键与一对多关系。"),("知识整理","文章要点 → 思维导图","mindmap","先看结构，再回原文读细节。"),("项目计划","任务与周期 → 甘特图","gantt","看清时间跨度与任务并行。"),("能力研究","工具功能 → 能力树","tree","提炼输入、处理和输出能力。")]
    for i,(title,subtitle,kind,caption) in enumerate(cards):
        x=80+(i%3)*600;y=1310+(i//3)*422
        rect(x,y,560,393);text(x+26,y+51,title,34,INK,650);text(x+26,y+94,subtitle,25,MUTED)
        demo(kind,x+16,y+114);text(x+26,y+369,caption,25,MUTED)
    rect(80,2166,1760,108,LILAC,"#d8cbed",r=14)
    text(111,2210,"输出保留独立文字、形状、箭头和坐标",31,PURPLE,650)
    text(111,2250,"拖动节点 · 修改文字与颜色 · 调整连线 · 导出保存",29,INK)
    text(1810,2305,"图形为效果示意，未接入模型实测。",24,MUTED,anchor="end")

    section(2390,"03","包含哪些图？22 类视觉规范")
    groups=[("流程与交互","5 类","流程图、时序图、状态图、泳道图、数据流图",LILAC,PURPLE),
            ("系统与结构","6 类","架构图、网络拓扑图、UML 类图、ER 图、组织架构图、树形图",SAGE,GREEN),
            ("知识与关系","3 类","思维导图、概念图、韦恩图",PEACH,ORANGE),
            ("时间与计划","2 类","甘特图、时间线",LILAC,PURPLE),
            ("分析与表达","6 类","鱼骨图、SWOT 分析图、金字塔图、漏斗图、矩阵图、信息图",SAGE,GREEN)]
    for i,(title,count,names,bg,color) in enumerate(groups):
        y=2451+i*116;rect(80,y,1760,98,"#fff",LINE,r=13)
        rect(80,y,291,98,bg,bg,r=13,sw=0);text(104,y+43,title,31,color,600);text(107,y+79,count,23,color)
        text(407,y+60,names,29,INK)
    text(102,3080,"图种通过提示词与视觉规范引导；精确统计、排程与约束需要另行处理。",28,MUTED)

    section(3202,"04","原理是什么？","大模型组织内容与图形数据，程序处理数据，画布完成展示和编辑。")
    steps=[("读取输入","文字、文件内容、\n图片数据"),("组装提示词","业务内容 + 图种 +\n图形与布局规则"),("模型生成 JSON","OpenAI 兼容接口\nAnthropic\nSSE 流式返回"),("修复与连线调整","尝试修复部分 JSON\n调整绑定箭头端点"),("Excalidraw 渲染","补全图形元素\n展示、手动编辑")]
    for i,(title,body) in enumerate(steps):
        x=80+i*360;rect(x,3311,320,251,"#ffffff",LINE,r=16)
        text(x+25,3358,f"0{i+1}",27,PURPLE,600,family="Consolas,monospace")
        text(x+25,3407,title,29,INK,650);block(x+25,3460,body,275,25,MUTED,leading=1.6)
        if i<4:line(x+327,3434,x+351,3434,arrow=True)
    rect(80,3582,840,189,"#2e2d3b","#2e2d3b",r=16,sw=0)
    text(109,3627,"结构化图形数据 / 简化示意",24,"#bdb0d8")
    text(110,3677,'{ type: "rectangle", x: 100, y: 80,',29,"#eee7fa",family="Consolas,monospace")
    text(110,3725,'  label: { text: "客服审核" } }',29,"#eee7fa",family="Consolas,monospace")
    rect(954,3582,886,189,"url(#dots)",LINE,r=16)
    node(1010,3636,252,77,"客服审核",size=32);line(1275,3675,1440,3675,arrow=True);node(1455,3636,306,77,"后续处理","green",32)
    for i,(role,body) in enumerate([("大模型","理解内容，组织节点、关系与坐标。"),("应用程序","调用、解析、修复与端点调整。"),("Excalidraw","显示、编辑与图形导出。")]):
        x=80+i*600;text(x,3834,role,28,PURPLE,650);block(x,3882,body,550,26,MUTED,leading=1.55)

    section(4031,"05","适合谁？价值在哪里？")
    professions=[("产品 / 业务","需求沟通、流程确认、跨部门职责梳理。"),("研发 / 架构","系统方案、接口交互、实体关系讨论。"),("教学 / 研究","文章图解、知识整理、项目能力对比。"),("项目 / 管理","时间计划、问题复盘、分析汇报。")]
    for i,(title,body) in enumerate(professions):
        x=80+i*450;rect(x,4100,410,224);tag(x+24,4126,f"0{i+1}",LILAC,PURPLE,23);text(x+24,4216,title,32,INK,650);block(x+24,4262,body,357,27,MUTED,leading=1.55)
    rect(80,4362,1760,147,"#e8dfef","#d4c6e0",r=17)
    text(117,4423,"把画图的起点，从空白画布变成可讨论的初稿。",40,PURPLE,650)
    text(118,4474,"减少整理和画图成本，让内容更容易沟通、精修与复用。",31,INK)

    section(4623,"06","可扩展价值","以下为扩展方向，需要二次开发；不等同于上游现成功能。")
    extensions=[("数据接入","连接数据库、Excel、文档平台、仓库与 API。"),("持续改图","加入当前画布上下文、差异修改与多轮对话。"),("行业模板","沉淀业务图模板、配色规范与图标资产。"),("团队产品","补充账号权限、版本管理、协作与用量管理。"),("业务闭环","接入工具执行、计算校验、自动更新与报告。")]
    for i,(title,body) in enumerate(extensions):
        y=4735+i*99;rect(80,y,1760,81,"#ffffff",LINE,r=12);tag(106,y+20,title,LILAC,PURPLE,27);text(340,y+51,body,30,INK);text(1799,y+52,"↗",34,PURPLE,anchor="end")

    section(5400,"07","能力边界","理解表达能力，也要明确输入、准确性和业务执行的条件。")
    limits=[("输入与结构","能读到内容，才谈得上整理；输入与关系越完整，结果越可靠。"),("内容准确性","业务判断、数值、主外键与消息时序，仍需要核对。"),("复杂图布局","箭头优化主要调整端点；复杂图仍需要人工整理。"),("持续修改","当前生成是单次输入；没有带完整画布与多轮历史。"),("模型数据流","本地部署仍可能调用远端模型；配置与内容会经过应用服务端。"),("实际业务执行","提供工具能力可以画出工作流；真正执行仍需接入工具或系统。")]
    for i,(title,body) in enumerate(limits):
        x=80+(i%2)*900;y=5507+(i//2)*184;rect(x,y,860,161,"#f0ede7","#ddd5c9",r=14)
        text(x+26,y+48,title,30,"#8b7051",600);block(x+26,y+95,body,806,27,MUTED,leading=1.5)

    section(6185,"08","一句话记住它")
    rect(80,6264,1760,257,LILAC,"#d8cbed",r=22)
    text(960,6346,"一个由 AI 辅助的可编辑信息图解工具。",50,PURPLE,700,anchor="middle")
    text(960,6425,"步骤 → 流程　　结构 → 架构　　关系 → 网络　　时间 → 计划",34,INK,500,anchor="middle")
    text(960,6482,"核心交付：让人更容易理解、讨论和继续修改的图。",31,MUTED,anchor="middle")
    line(80,6590,1840,6590,LINE,2)
    text(80,6651,"研究对象：liujuntao123/smart-excalidraw-next",27,INK,600)
    text(80,6700,"固定版本：fd139925b01a  ·  研究日期：2026-10-20  ·  012 项目研究",25,MUTED)
    text(80,6749,"源码依据：Chat.jsx · constants.js · prompts.js · generate/route.js",24,MUTED)
    text(80,6790,"optimizeArrows.js · ExcalidrawCanvas.jsx  ｜  示例是表达示意，扩展项不是现成能力。",24,MUTED)
    add('</svg>')
    OUT.write_text('\n'.join(S)+'\n',encoding='utf-8')
    print(f'Created {OUT.name}: {W} x {H}; {len(S)} SVG elements.')

if __name__ == '__main__':build()
