"""Typeset the research map as one high-resolution PNG and an editable SVG."""

from html import escape
import json
from pathlib import Path
import re

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
W, M = 2048, 108
CONTENT = W - 2 * M
PAPER, WHITE = "#F5F2EA", "#FFFEF8"
INK, TEXT, MUTED = "#173D35", "#3F5145", "#6C7B6C"
GREEN, PALE, EDGE = "#407558", "#E8EDDF", "#D4DCCB"
AMBER, SAND, ORANGE = "#A76632", "#F2E7D2", "#C45D38"
FONT = "C:/Windows/Fonts/msyh.ttc"
BOLD = "C:/Windows/Fonts/msyhbd.ttc"


class Artboard:
    def __init__(self):
        self.image = Image.new("RGB", (W, 18000), PAPER)
        self.draw = ImageDraw.Draw(self.image)
        self.svg = []
        self.fonts = {}
        self.text_bounds = []

    def font(self, size, bold=False):
        key = size, bold
        if key not in self.fonts:
            self.fonts[key] = ImageFont.truetype(BOLD if bold else FONT, size)
        return self.fonts[key]

    def rect(self, x, y, w, h, fill, stroke=None, radius=12):
        self.draw.rounded_rectangle((x, y, x+w, y+h), radius, fill=fill, outline=stroke, width=2)
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="2"/>')

    def line(self, points, fill=EDGE, width=2):
        self.draw.line(points, fill=fill, width=width)
        self.svg.append(f'<polyline points="{" ".join(f"{x},{y}" for x,y in points)}" fill="none" stroke="{fill}" stroke-width="{width}"/>')

    def dot(self, x, y, r, fill=GREEN):
        self.draw.ellipse((x-r,y-r,x+r,y+r),fill=fill)
        self.svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"/>')

    def text(self, x, y, value, size=29, fill=TEXT, bold=False, center=False):
        font=self.font(size,bold)
        if center:
            x-=font.getlength(value)/2
        self.draw.text((x,y),value,font=font,fill=fill)
        ascent=font.getmetrics()[0]
        self.svg.append(f'<text x="{x:.2f}" y="{y+ascent:.2f}" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{fill}">{escape(value)}</text>')
        self.text_bounds.append((x,y,x+font.getlength(value),y+size*1.45,value))

    def wrap(self, value, width, size=29, bold=False):
        lines=[]
        for paragraph in value.split("\n"):
            current=""
            tokens=re.findall(r"[A-Za-z0-9][A-Za-z0-9._/@&=:+%?\-]*|.",paragraph)
            for token in tokens:
                if current and self.font(size,bold).getlength(current+token)>width:
                    if token in "，。、；：！？）】》”’.,:!?":
                        current+=token
                        continue
                    opening=""
                    if current[-1:] in "（【《“‘(":
                        opening=current[-1:];current=current[:-1]
                    lines.append(current.rstrip());current=opening+token.lstrip()
                else:
                    current+=token
            lines.append(current)
        return lines

    def para(self,x,y,value,width,size=29,fill=TEXT,bold=False,leading=1.65):
        for line in self.wrap(value,width,size,bold):
            self.text(x,y,line,size,fill,bold)
            y+=round(size*leading)
        return y

    def height(self,value,width,size=29,bold=False,leading=1.65):
        return len(self.wrap(value,width,size,bold))*round(size*leading)

    def arrow(self,x1,y1,x2,y2,color=GREEN,width=4):
        self.line([(x1,y1),(x2,y2)],color,width)
        if y1==y2:
            direction=1 if x2>x1 else -1
            self.line([(x2-direction*12,y2-9),(x2,y2),(x2-direction*12,y2+9)],color,width)
        else:
            self.line([(x2-9,y2-12),(x2,y2),(x2+9,y2-12)],color,width)

    def chip(self,x,y,value,fill=PALE,fg=GREEN,size=21):
        width=round(self.font(size,True).getlength(value))+28
        self.rect(x,y,width,39,fill,radius=4)
        self.text(x+14,y+3,value,size,fg,True)
        return width


A=Artboard()


def chapter(y,num,title,subtitle,status="",status_bg=PALE,status_fg=GREEN):
    A.line([(M,y),(W-M,y)])
    y+=35
    A.text(M,y-3,num,38,ORANGE)
    A.text(M+85,y-7,title,45,INK,True)
    if status:
        chip_width=A.font(21,True).getlength(status)+28
        A.chip(W-M-chip_width,y,status,status_bg,status_fg)
    A.text(M+85,y+65,subtitle,25,MUTED)
    return y+131


def card(x,y,w,title,body,accent=GREEN,size=29,padding=32,minheight=0):
    body_height=A.height(body,w-2*padding,size)
    height=max(minheight,body_height+116)
    A.rect(x,y,w,height,WHITE,EDGE)
    A.rect(x,y,6,height,accent,radius=0)
    A.text(x+padding,y+23,title,33,INK,True)
    A.para(x+padding,y+84,body,w-2*padding,size)
    return y+height


def note(y,title,body,fill=PALE,fg=GREEN):
    title_w=A.font(26,True).getlength(title)
    h=max(76,A.height(body,CONTENT-title_w-90,25)+30)
    A.rect(M,y,CONTENT,h,fill,radius=7)
    A.text(M+25,y+18,title,26,fg,True)
    A.para(M+title_w+55,y+18,body,CONTENT-title_w-90,25,fg)
    return y+h


def flow(y,items,height=150,fill=WHITE,bidirectional=False):
    n=len(items);gap=44;bw=(CONTENT-gap*(n-1))/n
    for i,(title,detail) in enumerate(items):
        x=M+i*(bw+gap)
        A.rect(x,y,bw,height,fill,EDGE)
        A.text(x+bw/2,y+24,title,31,INK,True,True)
        lines=A.wrap(detail,bw-38,23)
        for j,line in enumerate(lines):
            A.text(x+bw/2,y+82+34*j,line,23,MUTED,center=True)
        if i<n-1:
            offset=9 if bidirectional else 0
            A.arrow(x+bw+9,y+height/2-offset,x+bw+gap-8,y+height/2-offset)
            if bidirectional:
                A.arrow(x+bw+gap-8,y+height/2+offset,x+bw+9,y+height/2+offset)
    return y+height


def bullet(x,y,title,body,width,size=27,color=GREEN):
    A.dot(x+5,y+21,4,color)
    y=A.para(x+27,y,title,width-27,size,INK,True)
    y=A.para(x+27,y+6,body,width-27,size,MUTED)
    return y+20


# Header: a reading map, not a decorative cover.
A.rect(0,0,W,480,INK,radius=0)
A.text(M,47,"RESEARCH FIELD NOTES  /  010",24,"#B9CDB7")
A.text(M,111,"从资源目录，到视频产品",81,WHITE,True)
A.text(M,235,"awesome-zhuiju-free · 能力、实测、架构与产品全景",31,"#CDDDC7")
A.para(M,306,"原库的价值，是可维护的资源发现与情报；视频产品还要连接内容许可、观看体验、流量分发和经营验证。",CONTENT,34,"#E2EBD9")
y=512
legend_x=M
for text,bg,fg in [("原库已有",PALE,GREEN),("我们已验证",INK,WHITE),("后续设想",SAND,AMBER),("仍待确认","#EBE8DF",MUTED)]:
    legend_x+=A.chip(legend_x,y,text,bg,fg)+16
A.text(W-M-A.font(23).getlength("研究与接入复验：2026.10.19"),y+6,"研究与接入复验：2026.10.19",23,MUTED)
y=597

# 01 — Upstream capability and the actual limits of its checker.
y=chapter(y,"01","源库的能力是什么？","一套资源目录与维护系统：发现入口、组织信息、持续更新。","原库已有")
y=flow(y,[("维护者 / 社区","人工整理与 Issue 推荐"),("结构化 JSON","分类、标签、评分与状态"),("脚本与自动化","目录生成、HTTP 检查"),("导航与记录","README、周报、核验来源")],145)
y+=25
statw=CONTENT/4
for i,(number,label,detail) in enumerate([("119","条固定版本记录","111 条精选 + 8 条移除"),("53","个在线影视入口","入口数量，不是影片数量"),("15","个 TVBox 配置","不等于独立授权片库"),("15","个开源项目","软件许可与内容许可分开")]):
    x=M+i*statw
    if i:A.line([(x,y+8),(x,y+136)])
    A.text(x+25,y,number,58,INK,True)
    A.text(x+25,y+80,label,27,INK)
    A.text(x+25,y+126,detail,22,MUTED)
y+=194
A.text(M,y,"最近报告：96 个入口的 HTTP 响应",29,INK,True)
barx=M+780;barw=CONTENT-780
for value,color in [(66,GREEN),(21,"#C89451"),(9,"#A0AA96")]:
    w=barw*value/96
    A.rect(barx,y+13,w-3,20,color,radius=0);barx+=w
A.text(M,y+54,"66 可访问  /  21 受限  /  9 无法访问；111 条精选中排除了 15 个开源项目。",27,TEXT)
A.text(M,y+102,"固定版本数据与上游检测：2026.10.15。HTTP 响应不是播放成功率。",25,MUTED)
y+=162
y=note(y,"许可边界","上游目录与代码的 CC BY 4.0，不自动覆盖第三方影片、海报、字幕和接口。",SAND,AMBER)
y+=50

# 02 — Real validation, with a clearly labelled schematic interface.
y=chapter(y,"02","展示效果：我们实际做出了什么？","007 映片 Demo 已嵌入 010 研究页；一个本地服务提供研究、播放器与 API。","我们已验证",INK,WHITE)
gap=36;half=(CONTENT-gap)/2
left_y=y
left_y=bullet(M,left_y,"实时搜片 → 详情 → 选集 → 浏览器播放","沿用 007 的实际后端与播放器，不用录播或静态结果替换失败响应。",half,28)
left_y=bullet(M,left_y,"2026.10.19 接入复验","搜索返回 5 条结果；样例返回 8 集。首两集均解码到 1920 × 1080。",half,28)
left_y=bullet(M,left_y,"有画面，也有时间推进","首集约 58.25 秒、次集约 63.92 秒；验证了切集、暂停与继续。",half,28)
ui_x=M+half+gap;ui_w=half
A.rect(ui_x,y,ui_w,494,"#19271F",radius=10)
A.text(ui_x+27,y+20,"映片 / CINEMA LAB",25,"#D8E7C9",True)
A.text(ui_x+ui_w-200,y+24,"界面示意",21,"#A9BC9F")
A.rect(ui_x+26,y+78,ui_w-52,57,"#2B3A2E",radius=5)
A.text(ui_x+47,y+89,"输入片名，实时搜索…",25,"#D5E2C8")
A.rect(ui_x+26,y+155,ui_w-52,195,"#0F1913",radius=6)
cx=ui_x+ui_w/2;cy=y+252
A.line([(cx-15,cy-24),(cx+24,cy),(cx-15,cy+24),(cx-15,cy-24)],"#BCD69C",4)
A.text(ui_x+ui_w-210,y+299,"1080p · HLS",22,"#C9DDB8")
A.text(ui_x+26,y+365,"选集 / 8 集",23,"#E1E8DB",True)
epw=(ui_w-52-7*9)/8
for i in range(8):
    ex=ui_x+26+i*(epw+9)
    A.rect(ex,y+409,epw,48,"#BCD69C" if i==0 else "#33432F",radius=4)
    A.text(ex+epw/2,y+416,str(i+1),23,"#19321F" if i==0 else "#D4E1C9",True,True)
y=max(left_y,y+494)+26
y=note(y,"实测边界","只抽样首两集；未完整观看、遍历全库、跨地区或并发压测。片名与季度资料来自上游，未独立核实。",SAND,AMBER)
y+=50

# 03 — Where the source was found and what remains unproven.
y=chapter(y,"03","片源如何找到？引发了什么思考？","追溯到了配置、接口与媒体地址；这条发现链路不等于原始内容的权属链。","发现链路已验证",INK,WHITE)
y=flow(y,[("资源 JSON","原库 tvbox_config 分类"),("小马配置","szyyds.cn/tv/x.json"),("暴風 HTTP API","bfzyapi.com"),("详情与选集","vod_play_url"),("HLS / CDN","v.fengbao14.com")],160)
y+=22
A.text(M,y,"接口：/api.php/provide/vod/    搜索：ac=detail&wd=片名    详情：ac=detail&ids=编号",25,TEXT)
A.text(M,y+46,"详情解析 vod_play_from / vod_play_url → .m3u8 清单 → 媒体分片 → 浏览器解码",25,TEXT)
A.text(M,y+92,"探索记录：读取 17 份配置、26 次 HTTP API 请求；次数不等于独立片库数；未执行远程 Spider。",24,MUTED)
y+=153
y=note(y,"仍待确认","最初影片由谁取得、上游为何承担成本、是否允许第三方商用，以及额度和服务承诺，都没有充分证据。",SAND,AMBER)
y+=28
y=flow(y,[("入口可访问？","有 HTTP 响应"),("媒体可播放？","能读取、解码、推进"),("有权用于业务？","许可、地区、期限、模式"),("可持续经营？","供给、体验、用户与利润")],149,PALE)
A.text(M,y+17,"每一层都需要自己的证据；前一层成功，不能自动证明下一层成立。",27,GREEN,True)
y+=101

# 04 — The architecture separates metadata/control from media bytes.
y=chapter(y,"04","架构是什么？视频流量由谁承担？","控制与元数据走后端；媒体字节的真实路径决定带宽账单。","直连链路已验证",INK,WHITE)
A.text(M,y,"A / 搜索与播放控制",25,ORANGE,True)
y+=53
y=flow(y,[("用户浏览器","搜索 / 选片 / 选集"),("我们的后端适配器","/api/search · /detail · /play"),("影片 API","影片资料与剧集地址")],146,bidirectional=True)
A.text(M,y+19,"后端负责：字段标准化、线路解析、超时重试、短期缓存、域名白名单与本机同源校验。",26,TEXT)
y+=93
A.text(M,y,"B / 真正的视频数据（007 正常播放路径）",25,ORANGE,True)
y+=52
y=flow(y,[("上游媒体 CDN","HLS 清单 / 音视频分片"),("用户浏览器","HLS.js / 原生解码与播放")],146,PALE)
A.text(M,y+20,"媒体直接从 CDN 到浏览器；我们后端主要传递元数据和播放地址。",28,GREEN,True)
y+=100
cols=3;cw=(CONTENT-2*28)/3
modes=[("上游直连","上游 CDN → 浏览器\n视频流量主要由上游承担；额度、权利和稳定性未知。"),("后端转发","上游 → 我们的服务器 → 浏览器\n我们增加出口带宽、连接与请求成本；转发不会产生授权。"),("自有分发","获准使用的文件 → 存储 / 转码 → CDN\n我们采购视频基础设施，规划分发、质量和地域控制。")]
bottom=y
for i,(title,body) in enumerate(modes):
    bottom=max(bottom,card(M+i*(cw+28),y,cw,title,body,size=26,minheight=320))
y=bottom+24
y=note(y,"生产扩展","片目库、许可地区与期限、字幕、播放质量监控、自动下架、报表与结算，都是正式产品需要补齐的部分。")
y+=20
A.text(M,y,"代码决定怎么接；合同决定能做什么；流量路径决定谁付钱。",31,INK,True)
y+=101

# 05 — Supply options plus a fully scoped cost example.
y=chapter(y,"05","内容如何获取？成本如何计算？","内容许可、接入方式与视频分发，应分别核实。","价格 / 条款快照 10.16",SAND,AMBER)
sx=M;sw=half;right=M+half+gap
A.text(sx,y,"先确认内容可用范围",34,INK,True)
sy=y+71
for title,body in [
    ("开放电影","Big Buck Bunny、Sintel 等；按具体作品核查许可、署名和片尾，自行分发另算成本。"),
    ("官方播放器嵌入","YouTube 等平台负责媒体分发；需遵守品牌、收费、广告与可用性规则。"),
    ("独立作者 / 工作室合作","取得非独家、地区、期限、用途明确的许可，建立逐片授权台账。"),
    ("Filmhub 渠道合作","我们是 Channel / Buyer。审核、选片、签协议；标准流程交付到 S3 / SFTP，再安排播放分发。"),
    ("素材 API 与未知公共接口","Pexels / Pixabay 是创作素材，不是完整影视片库。未知 API 可供技术研究，商用与容量仍未确认。"),
]:
    sy=bullet(sx,sy,title,body,sw,26)
A.rect(right,y,sw,835,PALE,EDGE)
rx=right+32;rw=sw-64
A.text(rx,y+28,"免费内容许可 ≠ 免费基础设施",32,INK,True)
ry=A.para(rx,y+100,"3 Mbps × 1 小时 ≈ 1.35 GB\n100 人同时观看 ≈ 300 Mbps，尚未含余量。",rw,28,INK)
ry=A.para(rx,ry+29,"示例：1,000 次/月 × 10 分钟/次 × 3 Mbps；转码后存储 20 GB，片库 200 分钟。",rw,27,TEXT)
A.text(rx,ry+25,"225 GB",62,INK,True)
A.text(rx+350,ry+62,"约月传输量",25,MUTED)
ry+=134
for label,value in [("Bunny Standard · 欧美","$2.45 / 月"),("Bunny Standard · 亚洲 / 大洋洲","$6.95 / 月"),("Cloudflare Stream","$15.00 / 月")]:
    A.text(rx,ry,label,25,TEXT)
    A.text(right+sw-32-A.font(28,True).getlength(value),ry-2,value,28,INK,True)
    A.line([(rx,ry+54),(rx+rw,ry+54)],"#CAD5BE")
    ry+=85
A.para(rx,ry+6,"美元、不含税；2026.10.16 公开价格快照。含示例存储与最低消费；不含版权、整站、支付、营销、人力和可选功能。不是正式报价。",rw,23,MUTED)
bottom=max(sy,y+835)
y=bottom+20
y=note(y,"Filmhub 的 80/20","通常指 Filmhub 与制片方，不代表网站默认保留 80%。个人准入、实际片单、预付款、保底和渠道分成仍待书面确认。",SAND,AMBER)
y+=22
A.text(M,y,"成本变量：码率、地区、观看分钟、预加载与重试。文件交付给你，不等于供应商替你承担终端播放流量。",25,MUTED)
y+=100

# 06 — Products, their revenue hypotheses, and reusable modules.
y=chapter(y,"06","可扩展成什么产品？","选择垂直用户与可持续供给，再把模块复用到更多场景。","后续设想",SAND,AMBER)
routes=[
    ("资源导航 / 状态目录","价值：垂直分类、实测与更新。\n收益假设：专题赞助、信息服务。\n特点：接近原库，媒体带宽较低。"),
    ("短片精选 + 原创解析","价值：主题策展、字幕与创作背景。\n收益假设：原创课程、会员服务、赞助。\n判断：当前优先验证的路线。"),
    ("签约片库 / 小型流媒体","价值：许可片目、稳定观看与服务。\n模式：广告 / 订阅 / 单片付费。\n条件：渠道准入、供应合同和资金。"),
]
cw=(CONTENT-2*28)/3
bottom=y
for i,(title,body) in enumerate(routes):
    bottom=max(bottom,card(M+i*(cw+28),y,cw,title,body,size=26,accent=ORANGE if i==1 else GREEN,minheight=340))
y=bottom+33
extension_rows=[("来源适配器","多源规范化、健康检测、失效处理"),("影片与许可台账","地区 / 到期 / 字幕 / 自动下架"),("观看事件与成本","质量归因、预算预警、单位经济核算"),("专题与用户关系","收藏、推荐、作者合作、教育与影展场景")]
roww=(CONTENT-gap)/2
for i,(label,detail) in enumerate(extension_rows):
    x=M+(i%2)*(roww+gap);yy=y+(i//2)*122
    A.text(x,yy,label,29,INK,True)
    A.text(x,yy+52,detail,25,MUTED)
    A.line([(x,yy+99),(x+roww,yy+99)])
y+=266
y=note(y,"产品壁垒","内容供给、编辑判断、可靠体验与用户关系。公共接口和一个搜索框，通常很容易重复实现。")
y+=50

# 07 — Validate real use and contribution profit before scaling.
y=chapter(y,"07","如何低成本起步，验证能否盈利？","把技术演示推进为有证据的需求与经营试验。以下是建议计划，尚未执行。","四周验证路线",SAND,AMBER)
weekw=(CONTENT-3*26)/4
weeks=[("第 1 周","收窄主题与供给","访谈目标用户，逐片核实许可，整理小片库。"),("第 2 周","测真实观看体验","邀请约 20 人，测起播、卡顿、字幕与每观看小时成本。"),("第 3 周","验证编辑价值","发布原创专题，观察有效观看、收藏和复访。"),("第 4 周","取得真实收入证据","试验明确收费项或赞助，核实支付与贡献利润。")]
wh=max(A.height(body,weekw-48,26) for _,_,body in weeks)+158
for i,(week,title,body) in enumerate(weeks):
    x=M+i*(weekw+26)
    A.rect(x,y,weekw,wh,WHITE,EDGE)
    A.text(x+24,y+22,week,25,ORANGE,True)
    A.text(x+24,y+72,title,29,INK,True)
    A.para(x+24,y+130,body,weekw-48,26,TEXT)
y+=wh+30
metrics=[("供给","可授权，并且实际能播"),("需求","复访与真实支付，而非仅访问量"),("经济","收入减去授权、分发、支付与获客成本")]
mw=(CONTENT-2*30)/3
for i,(label,body) in enumerate(metrics):
    x=M+i*(mw+30)
    A.text(x,y,label,31,INK,True)
    A.para(x,y+54,body,mw,26,MUTED)
y+=144
y=note(y,"扩张门槛","有收入证据、内容供应可持续、单位经济成立，再扩大片库。当前没有已验证的盈利结论。",SAND,AMBER)
y+=50

# 08 — Meaning and explicit unknowns.
y=chapter(y,"08","这次探索的意义是什么？","把一份网址清单，变成一套理解内容产品的方法。")
takeaways=[
    ("研究价值","从目录与配置发现接入链路，保留来源、原始数据与实测证据。"),
    ("工程价值","复用结构化数据、审核检测、适配器、缓存与媒体解码的组织方法。"),
    ("产品价值","从“什么都能搜到”，走向“这类内容，我愿意回来这里看”。"),
    ("商业价值","在采购与扩张之前，把许可、成本、需求和责任放到同一张图。"),
]
rh=max(A.height(body,half-64,28) for _,body in takeaways)+111
for i,(title,body) in enumerate(takeaways):
    x=M+(i%2)*(half+gap);yy=y+(i//2)*(rh+24)
    card(x,yy,half,title,body,size=28,minheight=rh)
y+=2*(rh+24)+7
y=note(y,"仍待解决","原始内容权属、公共接口商用与流量承诺、全库稳定性、Filmhub 准入和报价、用户留存与整站利润。",SAND,AMBER)
y+=42
A.rect(M,y,CONTENT,151,INK,radius=6)
A.text(W/2,y+27,"发现入口 → 验证播放 → 确认供应 → 设计体验 → 核算成本 → 验证经营",34,WHITE,True,True)
A.text(W/2,y+93,"有价值的产品，来自可持续的供给与用户愿意再来的理由。",27,"#C7D9BE",center=True)
y+=196
A.text(M,y,"研究对象：github.com/laoma528/awesome-zhuiju-free   ·   固定提交 d1049a3…52a0",24,MUTED)
A.text(M,y+45,"源码与供应商资料：2026.10.15–16；演示接入复验：2026.10.19。UI 为示意，验证数据来自本地报告。",23,MUTED)
A.text(M,y+89,"架构扩展与产品路线包含建议；尚未签商业片库合同，未公开部署。详细证据、来源与代码见研究项目 010 / 007。",23,MUTED)
y+=158

ASSETS.mkdir(parents=True,exist_ok=True)
stem="research-overview-20261019"
png=ASSETS/f"{stem}.png"
svg=ASSETS/f"{stem}.svg"
A.image.crop((0,0,W,int(y))).save(png,optimize=True)
svg.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{int(y)}" viewBox="0 0 {W} {int(y)}"><title>从资源目录，到视频产品：研究全景图</title><desc>源库能力、真实搜播效果、片源发现、流量架构、内容供应、成本、产品路线与经营验证。</desc><rect width="100%" height="100%" fill="{PAPER}"/>\n'+"\n".join(A.svg)+"\n</svg>\n",encoding="utf-8")
overflow=[(round(x1),round(x2),text) for x1,y1,x2,y2,text in A.text_bounds if x1<20 or x2>W-20]
if overflow:
    raise ValueError(f"Text outside image: {overflow}")
qa=ROOT.parent.parent/"outputs/010-overview-qa"
qa.mkdir(parents=True,exist_ok=True)
height=int(y)
for i,top in enumerate(range(0,height,2000)):
    A.image.crop((0,top,W,min(height,top+2000))).save(qa/f"part-{i+1}.png")
report={"date":"2026-10-19","method":"native vector typography exported to PNG with Pillow","built_in_imagegen_attempt":"failed: network error sending request","imagegen_cli_used":False,"width":W,"height":height,"png":str(png.relative_to(ROOT)),"svg":str(svg.relative_to(ROOT)),"text_items":len(A.text_bounds),"text_overflow_count":len(overflow),"source":"existing research and live-demo-integration.json; no new commercial or source availability claim","sections":8,"prompt":"assets/research-overview-prompt.txt"}
(ROOT/"references/overview-generation.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print(json.dumps(report,ensure_ascii=False))
