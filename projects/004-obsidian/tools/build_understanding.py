"""Build a self-contained research infographic from verified, locally rendered frames.

Run with --extract when the ignored reference MP4 is available. Otherwise the checked-in
JPEG frames are enough. Text remains SVG text; screenshots are embedded as data URIs.
"""

import argparse
import base64
from html import escape
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "web/assets/understanding"
W, H = 1920, 4280
BG, PANEL, LINE = "#121719", "#1b2427", "#344447"
TEXT, MUTED, COPPER, TEAL, GOLD = "#f0eee6", "#adbfbe", "#edb98b", "#92cfc4", "#d8cd9d"
FRAMES = [
    ("monolith", .7, "黑曜石", "裂纹生长 → 碎裂 → 重聚", "原作"),
    ("cathedral", 7.15, "玻璃教堂", "按轮廓搭建 / 玫瑰窗与透光", "原作"),
    ("whale", 11.8, "巨鲸", "身体摆动 / 鳍部动作 / 路径游动", "原作"),
    ("galaxy", 22, "星系盘", "旋臂数量 / 卷曲 / 厚度", "本研究已实现"),
    ("tornado", 29, "龙卷", "漏斗半径 / 圈数 / 差速旋转", "本研究已实现"),
    ("dna", 36, "双螺旋", "双管骨架 / 横向连接 / 半径", "本研究已实现"),
    ("text", 43, "文字聚合", "最多 8 字 / 正反面 / 侧边厚度", "本研究已实现"),
]


def build():
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc">',
             '<title id="title">一图读懂 Obsidian：能力、原理、效果、价值与扩展</title>',
             '<desc id="desc">七张真实渲染效果图，五步实现原理，原作与本研究能力对照，六类使用场景，十二类扩展现象，交付路径与边界。铜色为上游已有，青色为本研究已实现，浅金为待开发方向。</desc>',
             '<defs><linearGradient id="hero"><stop stop-color="#283536"/><stop offset="1" stop-color="#1c2328"/></linearGradient><marker id="arrow" markerWidth="12" markerHeight="12" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10" fill="none" stroke="#92cfc4" stroke-width="1.5"/></marker></defs>',
             f'<rect width="{W}" height="{H}" fill="{BG}"/>',
             '<g font-family="Microsoft YaHei, PingFang SC, Noto Sans CJK SC, sans-serif">']

    def rect(x, y, w, h, fill=PANEL, stroke=LINE, rx=12):
        parts.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}"/>')

    def text(x, y, content, size=25, color=TEXT, weight=400):
        parts.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-weight="{weight}">{escape(content)}</text>')

    def lines(x, y, content, size=24, color=MUTED, step=36):
        for i, line in enumerate(content):
            text(x, y + i * step, line, size, color)

    def line(x1, y1, x2, y2, color=LINE, arrow=False):
        parts.append(f'<path d="M{x1} {y1} L{x2} {y2}" stroke="{color}" stroke-width="2" fill="none"' + (' marker-end="url(#arrow)"' if arrow else '') + '/>')

    def section(y, num, title, subtitle):
        text(72, y, num, 23, COPPER, 600)
        text(128, y, title, 35, TEXT, 600)
        text(72, y + 42, subtitle, 23, MUTED)

    def pill(x, y, label, color, width):
        rect(x, y, width, 36, BG, color, 18)
        text(x + 15, y + 25, label, 20, color)

    text(72, 64, "004  /  RESEARCH LAB  /  OBSIDIAN", 23, COPPER)
    text(72, 136, "同一批碎片，组织变化，讲清一个故事。", 54, TEXT, 600)
    text(72, 186, "基于 Three.js / WebGL 2 的实时三维视听作品，复用方法是：形态采样 → 碎片重组 → 镜头与声音编排。", 27, MUTED)
    rect(72, 218, 1776, 78, "url(#hero)", LINE)
    text(99, 267, "当前最成熟的价值：片头 / 品牌视觉 / 发布会 / 舞台内容。更具体的业务用途，要接入具体资产与输入。", 27, TEAL, 500)

    section(356, "01", "先看效果：三种原作形态 + 四种新增形态", "以下均来自本地 48 秒成片的真实渲染帧，使用同一套三维碎片系统；截图为低画质，不代表科学仿真。")
    for i, (name, _, title, caption, _) in enumerate(FRAMES):
        if i < 3:
            x, y, width, height = 72 + i * 600, 424, 576, 260
            color = COPPER
        else:
            x, y, width, height = 72 + (i - 3) * 450, 782, 426, 220
            color = TEAL
        uri = "data:image/jpeg;base64," + base64.b64encode((DEST / f"{name}.jpg").read_bytes()).decode()
        rect(x, y, width, height + 72)
        parts.append(f'<image href="{uri}" x="{x}" y="{y}" width="{width}" height="{height}" preserveAspectRatio="xMidYMid slice"/>')
        text(x + 16, y + height + 31, title, 28, color, 600)
        text(x + 16, y + height + 59, caption, 21, MUTED)
    text(72, 1104, "声音：原作风声 / 碎裂 / 钟鸣 / 鲸歌；星系泛音与星尘钟；龙卷风噪与低鸣；双螺旋左右交替音；文字细点汇成和弦。", 22, MUTED)
    pill(72, 1120, "铜色 · 原作已有", COPPER, 205)
    pill(295, 1120, "青色 · 本研究已实现", TEAL, 255)
    pill(568, 1120, "浅金 · 扩展建议 / 待开发", GOLD, 306)
    text(915, 1145, "0–18 原作 → 18 星系 → 25 龙卷 → 32 双螺旋 → 39 文字 → 46 回归 → 48 循环", 21, MUTED)

    section(1226, "02", "实现原理：给每块碎片安排身份、目标与时间", "核心关系：画面状态 = f（碎片编号、当前时间、目标形态、参数）。完整循环可直接定位，也可逐帧复现。")
    steps = [
        ("01 / 生成", "把表面切成碎片", ["巨石表面 Voronoi 分割", "再向内挤出立体厚度", "裂纹与碎片边界一致"]),
        ("02 / 采样", "把形状变成目标", ["教堂 / 鲸鱼 / 新形态", "采样位置、朝向、尺度", "轮廓加权保留辨识度"]),
        ("03 / 匹配", "为每个编号配对", ["高度分带 + 角度排序", "保持大体空间关系", "沿用身份，组织飞行"]),
        ("04 / 计算", "GPU 并行求姿态", ["时间函数 + 曲线轨迹", "四元数插值控制旋转", "输出四张浮点状态纹理"]),
        ("05 / 呈现", "镜头与光声合成", ["合并网格按编号读状态", "阴影 / 镜面 / 光束 / 后期", "Web Audio 合成音效"]),
    ]
    for i, (label, title, body) in enumerate(steps):
        x = 72 + i * 360
        rect(x, 1300, 336, 228)
        text(x + 20, 1337, label, 22, TEAL)
        text(x + 20, 1383, title, 28, TEXT, 600)
        lines(x + 20, 1430, body, 22, step=32)
        if i < 4:
            line(x + 340, 1408, x + 354, 1408, TEAL, True)
    rect(72, 1552, 1776, 64, "#20302e", "#38554e")
    text(96, 1592, "为什么能重组？共享碎片身份与渲染管线，只改变目标姿态和运动规则；电影化观感再由材质、环境、运镜与声音共同完成。", 24, TEAL)

    section(1694, "03", "能力对照：作者做了什么，我们补了什么", "固定上游版本 74510f1。这里区分源码已有、当前已实现和仍需开发，避免把研究设想当作现成功能。")
    cols = [72, 330, 860, 1434]
    rect(72, 1760, 1776, 54, "#263134", LINE, 0)
    for x, label, color in zip(cols, ["能力", "上游已有", "本研究已实现", "继续落地的边界"], [TEXT, COPPER, TEAL, GOLD]):
        text(x + 16, 1796, label, 23, color, 600)
    rows = [
        ("形态与几何", "巨石 / 教堂 / 鲸鱼，程序化构造", "星系 / 龙卷 / 双螺旋 / 立体文字", "任意模型导入需另做"),
        ("碎片与材质", "真实立体碎片；玻璃 / 岩石 / 熔光", "四种形态共用原网格、材质与镜面", "几何厚度 ≠ 材料断裂"),
        ("运动与镜头", "爆散 / 涡流 / 群舞；作者剪辑运镜", "48 秒循环；2 秒转场；环绕与升降", "编排规则 ≠ 物理解算"),
        ("声音与输出", "合成风声 / 碎裂 / 钟鸣 / 鲸歌；录制", "四种新声；声画同步 MP4 / WebM", "编码能力依赖浏览器"),
        ("参数与操作", "暂停 / 定位 / 倍速 / 自由视角", "聚合 / 尺寸 / 扰动 / 专属参数 / 换字", "尚无通用时间线编辑器"),
        ("性能与复现", "GPU 状态；合并网格；三档预算", "8 千 / 2 万 / 3.2 万目标；确定性导出", "实际数量浮动；设备需测"),
    ]
    for i, row in enumerate(rows):
        y = 1814 + i * 58
        if i % 2 == 0:
            rect(72, y, 1776, 58, "#182023", "none", 0)
        for x, value in zip(cols, row):
            text(x + 16, y + 37, value, 21, TEXT if x == 72 else MUTED)
        line(72, y + 58, 1848, y + 58)
    text(88, 2201, "导出证据：已验证 48 秒 / 720p / 30 fps / H.264 + AAC 双声道 MP4。另提供 1080p 与 24 fps 选项；全设备表现需实测。", 23, TEAL)

    section(2283, "04", "价值判断：先交付视觉内容，再围绕具体用途做工具", "当前最容易落地的是视觉包装。复用价值在于换规则与内容后，可以沿用同一套重组、镜头、声音和输出流程。")
    values = [
        ("视觉表达", "用变化本身叙事", ["碎片 → 连接 → 成形 → 再生", "适合诞生、突破、循环等主题", "材质、光、运镜、音效形成统一风格"]),
        ("创作复用", "把一次效果变成系列", ["替换文字、形态、参数、节奏", "产出系列片头或交互网页版本", "标志 / 产品资产仍需新增接入"]),
        ("图形工程", "学习可迁移的完整链条", ["几何 → 采样 → 匹配 → GPU → 后期", "定位、分档和逐帧导出可复用", "商业收益取决于内容与使用场景"]),
    ]
    for i, (label, title, body) in enumerate(values):
        x = 72 + 600 * i
        rect(x, 2354, 576, 228)
        text(x + 22, 2393, label, 23, COPPER)
        text(x + 22, 2437, title, 30, TEXT, 600)
        lines(x + 22, 2482, body, 23, step=33)

    section(2660, "05", "使用场景：能交付什么，还要补什么", "“可直接创作”表示当前可制作通用视觉内容；品牌定制、长期运行、真实业务和科学用途均有额外接入工作。")
    scenes = [
        ("可直接创作", "电影 / 短片片头", "交付：标题揭示、重组转场、声画片段", "按作品补：片名设计、画幅、节奏与混音", TEAL),
        ("可直接创作", "品牌 / 发布会视觉", "交付：文字开场、概念演绎、背景循环", "品牌定制补：标志、产品轮廓与视觉规范", TEAL),
        ("可直接创作", "舞台 / 音乐视觉", "交付：带声音或静音的循环背景视频", "现场联动补：节拍输入、多屏与设备适配", TEAL),
        ("需要接入", "展馆 / 互动橱窗", "交付目标：观众触发聚合、沉浸式装置", "需补：输入设备、长时运行、复位与恢复", GOLD),
        ("需要接入", "科普 / 数据故事", "交付目标：结构形成、数据连接的可视解释", "需补：真实模型、数据语义、标签与验证", GOLD),
        ("需要接入", "循环材料 / 产品故事", "交付目标：资源 → 产品 → 拆解 → 再生", "需补：业务资产；真实装配另需零件约束", GOLD),
    ]
    for i, (state, title, output, needs, color) in enumerate(scenes):
        x, y = 72 + i % 3 * 600, 2732 + i // 3 * 174
        rect(x, y, 576, 154)
        text(x + 18, y + 32, state, 20, color)
        text(x + 18, y + 70, title, 28, TEXT, 600)
        lines(x + 18, y + 106, [output, needs], 21, step=29)

    section(3162, "06", "可扩展现象：十二个方向，四条接入路径", "思考方式：换目标形状、换运动规则、接外部输入，或重做有真实语义的对象系统。下列仍有未实现部分。")
    extensions = [
        ("文字 / 标志 / 产品轮廓", "文字已做；SVG / 模型需加载、归一与采样"),
        ("建筑生长 / 城市重组", "按楼层与建筑分组，增加搭建次序与镜头"),
        ("晶体 / 分形 / 双螺旋", "双螺旋已做；晶格、分形与分子数据可新增"),
        ("星系 / 星环 / 吸积盘", "星系盘已做；可扩轨道和环，真实引力另建"),
        ("龙卷 / 涡流 / 烟羽", "龙卷已做；体积烟雾与流体求解需新系统"),
        ("鸟群 / 鱼群 / 迁移", "路径可扩；协同行为需邻域搜索与避障"),
        ("波传播 / 冲击 / 涟漪", "用波源、到达时间、振幅和阻尼驱动状态"),
        ("音乐驱动 / 节拍重组", "新增音频输入、频谱分析和平滑参数映射"),
        ("数据聚类 / 关系显现", "接真实数据身份、点边、编码、标签与选择"),
        ("鼠标 / 触摸 / 身体参与", "接输入场；身体参与另需姿态识别与授权"),
        ("产品爆炸 / 零件装配", "保留零件拓扑、身份、装配关系和约束"),
        ("材料循环 / 资源再生", "新增产品阶段与材质，业务结论需真实数据"),
    ]
    for i, (title, body) in enumerate(extensions):
        x, y = 72 + i % 3 * 600, 3234 + i // 3 * 116
        rect(x, y, 576, 98)
        text(x + 17, y + 36, title, 25, GOLD, 500)
        text(x + 17, y + 74, body, 20, MUTED)

    section(3786, "07", "能力边界与落地路径", "把效果变成项目时，明确哪些是视觉隐喻，哪些需要真实的物理、数据和对象关系。")
    rect(72, 3856, 876, 188)
    text(94, 3895, "当前适合：艺术化、可控、可重放的三维视觉叙事", 27, TEAL, 600)
    lines(94, 3936, ["星系 / 龙卷 / DNA 是形态示意；尚无科学求解器。", "表面碎裂与排序匹配有针对性；任意物体不能一键套用。", "有合成声音输出；音乐输入、真实数据与姿态驱动需新增。"], 23, step=34)
    rect(972, 3856, 876, 188)
    text(994, 3895, "交付前补：内容、编辑、设备与运行保障", 27, GOLD, 600)
    lines(994, 3936, ["换品牌：资产导入 → 轮廓采样 → 匹配 → 镜头与音色。", "做工具：配置保存、可视编辑、错误反馈与版本管理。", "上现场：目标设备实测、减少动态效果、长期运行与恢复。"], 23, step=34)
    line(72, 4080, 1848, 4080)
    text(72, 4124, "推荐路线", 24, COPPER, 600)
    text(245, 4124, "文字 / 标志  →  参数化形态  →  输入驱动  →  具体场景交付", 29, TEXT, 500)
    text(72, 4172, "研究依据：iamtechartist/obsidian @ 74510f112c0a7e4318f688b851523105ec4f79e4 · 原作 © 2026 Techartist / MIT", 21, MUTED)
    text(72, 4210, "本图：本仓库研究判断 + 已实现功能；效果来自实际本地渲染。详细原理、源码定位、场景矩阵与许可见研究网页。", 21, MUTED)
    text(72, 4248, "2026.10.15  /  原作循环约 18 秒；本研究完整声画循环 48 秒。主体合并绘制，整帧仍包含阴影、反射与后期等多个过程。", 21, MUTED)
    parts += ["</g></svg>"]
    (DEST / "obsidian-understanding.svg").write_text("\n".join(parts), encoding="utf-8")
    print(f"Built self-contained infographic: {W} × {H}; {len(FRAMES)} real rendered screenshots.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--extract", action="store_true", help="Extract verified MP4 frames using ffmpeg")
    args = parser.parse_args()
    DEST.mkdir(parents=True, exist_ok=True)
    if args.extract:
        movie = ROOT / "exports/obsidian-complete-48s-720p-sound.mp4"
        for name, time, *_ in FRAMES:
            subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(time), "-i", str(movie), "-frames:v", "1", "-vf", "scale=864:-1", "-q:v", "2", str(DEST / f"{name}.jpg")], check=True)
    build()
