"""Build the research figure, readable PNG, product data and comparison from local facts.

Only Pillow is needed for authoring; the delivered webpage has no dependencies.
SVG and PNG share coordinates, wrapping and fonts; no upstream software is run.
"""
from pathlib import Path
from html import escape
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "web/assets"
DATA = json.loads((ROOT / "references/products.json").read_text(encoding="utf-8"))
STAGES = {"measure": "测试与验收", "diagnose": "采集与定位", "optimize": "AI 优化工作流"}
INK, MUTED, TEAL, BLUE, PURPLE, ORANGE = "#142e3d", "#607986", "#24867f", "#3d77bd", "#8270b5", "#b98031"
NAVY, LINE, WASH = "#132a38", "#d9e4e8", "#f3f7f7"
W, H, M = 1920, 6830, 88
FONT_DIR = Path("C:/Windows/Fonts")


class Figure:
    def __init__(self):
        self.image = Image.new("RGB", (W, H), "#ffffff")
        self.draw = ImageDraw.Draw(self.image)
        self.svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">',
                    '<title id="title">Tracy 能力、原理、场景与 AI 性能工程全景</title>',
                    '<desc id="desc">八部分中文研究图：性能证据、六类能力、四种机制、代码来源与语言、六种场景、22项工具差异、AI流程、思考和扩展。所有时间轴为机制示意。</desc>',
                    '<rect width="1920" height="6830" fill="white"/>']
        self.fonts = {}

    def font(self, size, bold=False):
        key = (size, bold)
        if key not in self.fonts:
            self.fonts[key] = ImageFont.truetype(str(FONT_DIR / ("msyhbd.ttc" if bold else "msyh.ttc")), size)
        return self.fonts[key]

    def rect(self, x, y, w, h, fill, radius=0, stroke=None):
        self.draw.rounded_rectangle((x, y, x+w, y+h), radius=radius, fill=fill, outline=stroke, width=1)
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke or "none"}"/>')

    def line(self, x, y, x2, y2, color=LINE, width=1):
        self.draw.line((x, y, x2, y2), fill=color, width=width)
        self.svg.append(f'<path d="M{x} {y} L{x2} {y2}" fill="none" stroke="{color}" stroke-width="{width}"/>')

    def text(self, x, y, value, size=26, color=INK, bold=False, url=None):
        font = self.font(size, bold)
        bounds = self.draw.textbbox((x, y), value, font=font, anchor="ls")
        if bounds[0] < 0 or bounds[2] > W or bounds[3] > H:
            raise ValueError(f"Text outside figure: {value} {bounds}")
        self.draw.text((x, y), value, font=font, anchor="ls", fill=color)
        element = f'<text x="{x}" y="{y}" font-family="Microsoft YaHei,PingFang SC,sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{escape(value)}</text>'
        self.svg.append(f'<a href="{escape(url, quote=True)}" target="_blank">{element}</a>' if url else element)

    def wrap(self, value, width, size=26, bold=False):
        lines = []
        for paragraph in value.split("\n"):
            line = ""
            for char in paragraph:
                if self.draw.textlength(line + char, font=self.font(size, bold)) > width and line:
                    lines.append(line); line = char
                else:
                    line += char
            lines.append(line)
        return lines

    def paragraph(self, x, y, value, width, size=26, color=MUTED, line_height=None, bold=False, max_lines=None):
        lines = self.wrap(value, width, size, bold)
        if max_lines is not None and len(lines) > max_lines:
            raise ValueError(f"Too many lines ({len(lines)} > {max_lines}): {value}")
        line_height = line_height or int(size * 1.5)
        for i, line in enumerate(lines):
            self.text(x, y + i*line_height, line, size, color, bold)
        return len(lines)*line_height

    def heading(self, y, number, title, note=""):
        self.text(M, y, number, 26, TEAL, True)
        self.text(M+70, y+1, title, 38, INK, True)
        if note:
            self.text(M, y+43, note, 23, MUTED)

    def box(self, x, y, w, h, title, detail, color=TEAL, size=26):
        self.rect(x, y, w, h, WASH, 12, LINE)
        self.rect(x+23, y+27, 5, 33, color, 2)
        self.text(x+45, y+48, title, 30, INK, True)
        self.paragraph(x+25, y+87, detail, w-50, size, MUTED, max_lines=max(1, int((h-96)/(size*1.5))+1))


def build():
    ASSETS.mkdir(parents=True, exist_ok=True)
    fig = Figure()
    fig.text(M, 75, "PERFORMANCE FIELD NOTES   /   RESEARCH 009", 24, TEAL, True)
    fig.text(M, 174, "Tracy · 性能定位与 AI 工程全景", 66, INK, True)
    fig.text(M, 230, "AI 生成 / GitHub 下载 / 自己编写：代码来源不同，运行时证据的价值相同。", 29, MUTED)
    fig.rect(M, 274, W-2*M, 196, NAVY, 14)
    fig.text(M+32, 322, "核心定位  /  运行时性能分析 + 性能瓶颈定位", 32, "#a9d5ce", True)
    fig.text(M+32, 380, "运行与复现  →  采样 / 事件采集  →  时间轴与统计  →  关联代码和线程  →  修改后复测", 30, "#edf6f6", True)
    fig.text(M+32, 430, "客户端 + 独立分析器；源码位置提供线索，根因需要事件、业务输入与复测共同确认。", 25, "#a9bfca")

    fig.heading(545, "01", "源库的能力：把执行过程变成可解释的证据", "以下为已有采集与分析能力，具体效果取决于平台、符号和接入。")
    caps = [
        ("CPU 热点与调用路径", "采样执行位置与调用栈，统计 self / total 热点；有符号时关联函数、源码或汇编。", BLUE),
        ("区间、帧与单次卡顿", "关键区间记录开始与结束；帧标记帮助放大异常帧，观察嵌套调用与持续时间。", TEAL),
        ("线程、锁与调度", "对齐线程运行、切出和已记录的锁事件，追查等待、持锁者与执行关系。", ORANGE),
        ("GPU 设备时间", "接入相应 GPU API，查看标记区间的设备耗时；CPU 提交耗时与 GPU 执行分开解释。", PURPLE),
        ("内存分配与释放", "追踪已上报分配的大小、存活及可选调用栈；数据覆盖范围由分配接入决定。", BLUE),
        ("保存、对比与分析接口", "保存 .tracy、比较记录、导出统计；关联日志和曲线。Assist / MCP 另提供 AI 分析入口。", TEAL),
    ]
    cw=(W-2*M-40)/3
    for i,(title,detail,color) in enumerate(caps):
        fig.box(M+(i%3)*(cw+20), 620+(i//3)*213, cw, 193, title, detail, color, 25)

    fig.heading(1100, "02", "底层原理：四条采集路径，共用一条分析链路")
    mechanisms=[
        ("采样：统计执行到了哪里", "系统周期采集地址 / 调用栈 → 栈展开与符号解析 → 热点。短调用可能漏采，样本比例有统计误差。", BLUE),
        ("埋点：记录这一次用了多久", "作用域开始 / 结束事件 + 时间戳 + 线程 / 源位置 → 持续时间。调用栈可选，区间也可能包含等待。", TEAL),
        ("等待：关联状态与依赖", "上下文切换 + 已接入锁的等待 / 获得 / 释放 → 对齐线程关系。时间重叠本身不能证明因果。", ORANGE),
        ("GPU / 内存：专门事件", "设备时间查询衡量 GPU 区间；分配 / 释放事件追踪地址与大小。均需要对应 API 或统一入口接入。", PURPLE),
    ]
    for i,(title,detail,color) in enumerate(mechanisms):
        fig.box(M+(i%2)*888, 1154+(i//2)*210, 856, 190, title, detail, color, 26)
    fig.text(M, 1597, "原始记录与线程上下文  →  后台传输 / 保存  →  分析器对齐与解析  →  人或 AI 提出假设", 27, TEAL, True)

    fig.heading(1680, "03", "什么代码可以用？看语言、运行环境和接入条件")
    fig.box(M, 1735, 856, 328, "代码来源与编程模式", "AI / GitHub / 自写代码均可，项目需实际运行。\n面向对象、过程式、单 / 多线程、循环、事件驱动、批处理都可以；没有帧概念也能分析。\nC/C++ 常规用法集成客户端并重编译；性能构建保留优化与调试符号。", TEAL, 26)
    fig.box(M+888, 1735, 856, 328, "语言支持有层次", "官方直接接入：C、C++、Python、Lua、Fortran。\n第三方绑定：Rust、Zig、C#、OCaml、Odin 等。\n绑定不保证同样的自动采样、源码映射与 GPU 能力。浏览器 / 远端模型内部需对应采集工具；代码文本或仓库链接本身不能生成运行记录。", BLUE, 26)

    fig.heading(2140, "04", "可用场景：从一次慢操作出发，选择需要的证据")
    cases=[
        ("游戏 / 渲染 / 仿真", "偶发卡帧 → 对齐帧预算、CPU、GPU、资源加载和锁等待。"),
        ("桌面 / CAD / 模型查看器", "打开大文件卡住 → 分析读取、解析、网格构建、主线程等待。"),
        ("图片 / 视频 / 数据处理", "一批数据变慢 → 阶段耗时、重复拷贝、分配与算法热点。"),
        ("多线程计算", "CPU 忙却提速有限 → 任务分布、同步、锁竞争与调度记录。"),
        ("原生后端 / 服务", "慢请求 → 本机热点结合压测；跨进程等待补 tracing / 数据库证据。"),
        ("包含 AI 的产品", "可控原生计算 / GPU 部分可分析；首 Token、生成速率、远程 API 需额外测量。"),
    ]
    for i,(title,detail) in enumerate(cases):
        x=M+(i%2)*888; y=2200+(i//2)*142
        fig.text(x, y+31, title, 29, INK, True)
        fig.paragraph(x, y+73, detail, 825, 25, MUTED, 35, max_lines=2)
        fig.line(x, y+124, x+856, y+124)

    fig.heading(2705, "05", "同类与互补产品：22 项能力差异", "按主用途分类，并非 22 个直接替代品；免逐函数埋点仍可能需要启动参数、权限、符号或配置。")
    x0=M; tw=W-2*M; table_y=2780; row_h=104
    cols=[M+20,M+363,M+866,M+1256]
    widths=[310,470,353,450]
    fig.rect(M,table_y,tw,59,NAVY,8)
    for x,label in zip(cols,["产品 / 主用途","主要输出","接入路径","与 Tracy / 完整闭环的差异"]):
        fig.text(x,table_y+39,label,24,"#e0edf0",True)
    for i,p in enumerate(DATA["products"]):
        y=table_y+59+i*row_h
        color={"measure":TEAL,"diagnose":BLUE,"optimize":PURPLE}[p["stage"]]
        fig.rect(M,y,tw,row_h,"#f1f6f5" if p["name"]=="Tracy" else ("#f7f9fa" if i%2==0 else "#ffffff"))
        fig.paragraph(cols[0],y+32,p["name"],widths[0],25,INK,31,True,max_lines=2)
        fig.text(cols[0],y+91,STAGES[p["stage"]],19,color)
        for j,key in enumerate(["short_output","access_short","difference"]):
            fig.paragraph(cols[j+1],y+31,p[key],widths[j+1],24,MUTED,31,max_lines=3)
        fig.line(M,y+row_h,M+tw,y+row_h)
    end=table_y+59+len(DATA['products'])*row_h
    fig.text(M,end+39,"AI 工作流可尝试生成候选；各工具的正确性测试、测量环境和支持范围都需独立核对。",24,MUTED)

    fig.heading(5235,"06","AI 时代的价值：让写代码与运行结果连接起来")
    values=[("AI 生成的普通软件","关注耗时、内存、卡顿、吞吐和稳定性。是否包含模型不影响性能工程的必要性。"),
            ("包含 AI 功能的产品","通用指标之外增加 TTFT、tokens/s、显存、排队及端到端等待；需模型 / 服务侧证据。"),
            ("用 AI 做性能工程","Agent 读 profile / trace、查源码、提出候选；业务正确性与真实性能分别验收。")]
    for i,(title,detail) in enumerate(values):
        fig.box(M+i*(cw+20),5294,cw,201,title,detail,TEAL if i!=2 else PURPLE,25)
    fig.rect(M,5521,tw,141,NAVY,12)
    fig.text(M+28,5565,"固定场景与输入 → 测基准 → 定位证据 → AI 候选补丁 → 编译 / 正确性测试 → 重复复测",29,"#e1f0f0",True)
    fig.text(M+28,5621,"保留 / 修正 / 回退：环境、提交、样本与原始记录可追溯；阈值通过不等于优化，也不保证所有输入。",25,"#acc4cc")
    fig.box(M,5690,856,177,"已有：Tracy Assist", "v0.14.1 手册已记载。配置本地模型，结合源码、调用栈与采样数据辅助分析。",TEAL,25)
    fig.box(M+888,5690,856,177,"已有：可选 MCP 服务", "独立 Python 服务 + 构建绑定，让编码 Agent 加载、查询、比较 .tracy；完整修复流程仍需另接。",PURPLE,25)

    fig.heading(5950,"07","引发的思考：从定位工具到可验证的软件质量流程")
    thoughts=[("证据要覆盖问题本身","热点、源码行号都是线索；等待、I/O 和业务依赖需要各自记录。资源占用率不能单独判断原因。"),
              ("自动化需要明确验收对象","先定义工作负载、业务结果、预算和噪声处理；免埋点不等于免配置，有 MCP 不等于自动修复。"),
              ("价值在缩短排查与复测","代码生成越快，独立反馈越重要。用可重复证据约束 AI 修改，而不是仅凭模型解释判断有效。"),
              ("扩展：统一三个层次","采集适配 → 结构化证据 → CI 门禁与候选修复；已有工具可组合，整合服务属于后续产品设想。")]
    for i,(title,detail) in enumerate(thoughts):
        fig.box(M+(i%2)*888,6008+(i//2)*193,856,173,title,detail,ORANGE if i<2 else TEAL,25)
    fig.line(M,6426,W-M,6426)
    fig.text(M,6481,"研究事实 / 边界",24,TEAL,True)
    fig.paragraph(M,6531,"Tracy 主研究快照：fd23005a…；发布版核对 v0.14.1。补充整理：2026-10-19（Asia/Shanghai）。\n本图为资料归纳，不是上游截图或实测报告；未运行 Tracy 采集、C/C++ 基准或模型自动修复。\nLinux tracy-monitor 仅按原固定主分支 NEWS 的未发布状态理解；平台与版本分别核对。\n22 项官方链接、详细限制与版本来源随网页「对应产品」和 comparison.md 保存。",1740,24,MUTED,42,max_lines=4)
    fig.text(M,6766,"github.com/wolfpld/tracy   ·   研究 009   ·   原生 SVG / PNG 可放大与下载",23,INK,True)
    fig.svg.append("</svg>")
    (ASSETS/"understanding-map.svg").write_text("\n".join(fig.svg)+"\n",encoding="utf-8")
    fig.image.save(ASSETS/"understanding-map.png", optimize=True)
    # The catalog uses the exact complete figure requested by the user.
    (ROOT/"assets/understanding-map.png").write_bytes((ASSETS/"understanding-map.png").read_bytes())
    (ASSETS/"products.js").write_text("window.PRODUCT_RESEARCH = "+json.dumps(DATA,ensure_ascii=False,indent=2)+";\n",encoding="utf-8")
    lines=["# 同类、互补工具与 AI 工作流对比", "", "补充整理：2026-10-19。共 22 项，按主用途归类，包含相近分析器、互补测试/追踪工具和 AI 工作流。下表为官方文档核对，没有逐项安装或执行，也不宣称穷尽市场。", "", "数据源：references/products.json；运行 src/build_overview.py 同步图表、网页数据与本文。", "", "| 项目 | 环节 / 适用对象 | 能得到什么 | 接入方式 | 关键差异与限制 | 官方来源 |", "| --- | --- | --- | --- | --- | --- |"]
    for p in DATA["products"]:
        lines.append("| "+" | ".join([p['name'],STAGES[p['stage']]+"；"+p['meta'],p['output'],p['access'],p['limit'],f"[官方资料]({p['url']})"])+" |")
    lines += ["", "## 如何选", "", "- C/C++ 普通计算慢：用重复基准建立问题，再由 perf / VTune / WPR 等采样，关键阶段可补 Tracy。", "- 偶发帧卡顿、线程同步和业务阶段：Tracy 的按需区间与事件时间轴有价值；系统范围追踪可补 Perfetto / ETW。", "- 分配与堆峰值：heaptrack / Massif；GPU 系统协同看 Nsight Systems，CUDA kernel 内部指标看 Nsight Compute。", "- Web / Python 分别看 Chrome DevTools、Lighthouse CI、Scalene 等；分布式等待用 OpenTelemetry 等关联服务证据。", "- AI 优化：profiler-md 更偏可读证据与技能流程，AGR 偏实验循环，ParaCodex / Atrex 偏并行计算与 GPU 算子。", "", "## 接入与自动化边界", "", "免逐函数埋点仍可能需要权限、符号、启动分析器、安装采集组件或配置场景。C++ 字样不等于任意 Windows 原生工程已兼容；WSL 的 Linux 构建与 Windows 原生 exe 分别看待。", "", "Tracy v0.14.1 手册已有 Assist 与独立 MCP 服务。分析接口不等于内置完整测试与源码修复流程；自动化验收依赖固定负载、业务正确性、性能预算和重复测量。", "", "本次没有核实任意工程零配置测试定位修复的成熟通用项目，结论限定于本轮核对范围。", ""]
    lines += ["## 补充官方资料", "", "- [Massif 堆分析手册](https://valgrind.org/docs/manual/ms-manual.html)：与 Callgrind 的调用图和指令成本分开理解。", "- [Tracy v0.14.1 手册](https://github.com/wolfpld/tracy/blob/v0.14.1/manual/tracy.tex)：语言、接入、采样、Assist 与 MCP。", ""]
    (ROOT/"comparison.md").write_text("\n".join(lines),encoding="utf-8")
    print(f"Built SVG / PNG {W} x {H}, {len(DATA['products'])} products.")


if __name__ == "__main__":
    build()
