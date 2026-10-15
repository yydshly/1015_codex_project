"""Typeset one evidence-led overview; original screenshots are embedded without alteration.

Produces a high-resolution PNG and a self-contained SVG with editable text and vector shapes.
"""
from pathlib import Path
import base64
import html
import io
import math

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
W, H = 3000, 5900
BG, INK, MUTED = '#f4f1e8', '#17392f', '#62766b'
CARD, BORDER = '#fffdf7', '#d6ddd0'
TEAL, GOLD, PURPLE = '#277565', '#ac7835', '#716090'
REGULAR = 'C:/Windows/Fonts/msyh.ttc'
BOLD = 'C:/Windows/Fonts/msyhbd.ttc'


class Poster:
    def __init__(self):
        self.image = Image.new('RGB', (W, H), BG)
        self.draw = ImageDraw.Draw(self.image)
        self.svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
                    '<title>ER Mario 的能力 演示效果 扩展方向与意义</title>',
                    '<desc>以固定版本源码和本地浏览器截图整理。上游复用 libsm64；本地演示使用自实现控制器，二者分开标注。</desc>']
        self.rect(0, 0, W, H, BG)

    def rect(self, x, y, w, h, fill=CARD, stroke=None, radius=22, width=2):
        self.draw.rounded_rectangle((x, y, x+w, y+h), radius, fill, stroke, width)
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="{width}"/>')

    def line(self, points, color=BORDER, width=3):
        self.draw.line(points, fill=color, width=width, joint='curve')
        self.svg.append(f'<polyline points="{" ".join(str(x)+","+str(y) for x,y in points)}" fill="none" stroke="{color}" stroke-width="{width}"/>')

    def arrow(self, points, color=TEAL, width=5):
        self.line(points, color, width)
        a, b = points[-2:]
        angle = math.atan2(b[1]-a[1], b[0]-a[0])
        triangle = [b, (b[0]-19*math.cos(angle-.47), b[1]-19*math.sin(angle-.47)),
                    (b[0]-19*math.cos(angle+.47), b[1]-19*math.sin(angle+.47))]
        self.draw.polygon(triangle, fill=color)
        self.svg.append(f'<polygon points="{" ".join(str(x)+","+str(y) for x,y in triangle)}" fill="{color}"/>')

    def text(self, text, x, y, size=38, color=INK, bold=False, max_width=None, line_height=1.5):
        font = ImageFont.truetype(BOLD if bold else REGULAR, size)
        lines = []
        for paragraph in text.split('\n'):
            line = ''
            for char in paragraph:
                if max_width and line and self.draw.textlength(line+char, font=font) > max_width:
                    lines.append(line)
                    line = char
                else:
                    line += char
            lines.append(line)
        for i, line in enumerate(lines):
            top = y+i*size*line_height
            self.draw.text((x, top), line, font=font, fill=color, anchor='lt')
            self.svg.append(f'<text x="{x}" y="{top+size*.91:.1f}" font-family="Microsoft YaHei, Noto Sans CJK SC, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}">{html.escape(line)}</text>')
        return y+len(lines)*size*line_height

    def chip(self, text, x, y, w, color=TEAL, fill='#e6eee5', size=28):
        self.rect(x,y,w,49,fill,radius=12)
        self.text(text,x+17,y+9,size,color,bold=True,line_height=1)

    def image_box(self, name, x, y, w, h, crop=None, background='#203329'):
        original=Image.open(ASSETS/name).convert('RGB')
        im=original.crop(crop) if crop else original
        fitted=ImageOps.contain(im,(int(w),int(h)),Image.Resampling.LANCZOS)
        self.rect(x,y,w,h,background,radius=0)
        px,py=int(x+(w-fitted.width)/2),int(y+(h-fitted.height)/2)
        self.image.paste(fitted,(px,py))
        data=io.BytesIO();im.save(data,format='JPEG',quality=94)
        encoded=base64.b64encode(data.getvalue()).decode('ascii')
        self.svg.append(f'<image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid meet" href="data:image/jpeg;base64,{encoded}"/>')

    def section(self, number, title, y, subtitle=None, color=TEAL):
        self.chip(number,88,y+2,74,color)
        self.text(title,185,y,53,bold=True)
        if subtitle:self.text(subtitle,88,y+80,31,MUTED,max_width=2824)

    def finish(self):
        self.svg.append('</svg>')
        self.image.save(ASSETS/'er-mario-overview.png',optimize=True,dpi=(180,180))
        (ASSETS/'er-mario-overview.svg').write_text('\n'.join(self.svg),encoding='utf-8')
        ImageOps.contain(self.image,(1200,2600),Image.Resampling.LANCZOS).save(ASSETS/'er-mario-overview-preview.jpg',quality=92)


p=Poster()
# The first screen carries the conclusion and evidence categories.
p.rect(0,0,W,350,INK,radius=0)
p.text('003 / GITHUB RESEARCH LAB',88,47,28,'#b8c6ae',bold=True)
p.text('ER MARIO 的能力、演示与扩展',88,112,98,'#fff7e1',bold=True)
p.text('核心理解：复用角色行为，分别适配身体外形与宿主世界。',92,248,43,'#d4dfcb')
p.chip('上游源码支持',2280,45,220,'#bfe0d2','#2a5144')
p.chip('本地演示验证',2520,45,220,'#efc884','#4e4931')
p.text('固定研究版本 v0.4.2 · 11744b8    /    2026.10.15',1850,306,25,'#b8c6ae')

p.section('01','原库的能力：把 SM64 动作接入《艾尔登法环》',392)
# Upstream capability inventory.
p.rect(88,488,1125,650,CARD,BORDER)
features=[
    ('运动与攻击','三段跳、远跳、蹬墙、下砸；拳脚与踩踏'),
    ('场景接入','实时读取 Havok 碰撞，转换为 SM64 表面'),
    ('动态物体','同步移动表面；支持敌人搬运与特定 Boss 甩投'),
    ('渲染与反馈','部件姿态写入宿主骨骼，接入血条、声音、镜头'),
    ('战斗桥接','命中转为比例扣血，再衔接原生受击、击杀与掉落'),
    ('流程衔接','褪色者作为代理；开门、爬梯、赐福、死亡与存档')]
for i,(title,desc) in enumerate(features):
    yy=516+i*99
    p.text(title,119,yy,35,TEAL,bold=True)
    p.text(desc,345,yy+2,31,INK,max_width=825,line_height=1.4)
    if i<5:p.line([(119,yy+82),(1180,yy+82)],'#e6e9df',2)

# Collision is explicitly fed back into the motion core.
p.rect(1241,488,1671,650,'#eaf0e7',BORDER)
p.text('工程核心：让运动、渲染与游戏流程协作。',1276,516,37,TEAL,bold=True)
for x,w,title,sub in [(1276,435,'法环实时世界','地形 / 动态物体'),(1791,565,'er-mario 适配层','坐标 / 碰撞格式'),(2436,441,'libsm64','输入 → 运动 / 动画')]:
    p.rect(x,598,w,142,CARD,'#b5cabc',radius=16)
    p.text(title,x+24,622,38,bold=True)
    p.text(sub,x+24,680,29,MUTED)
p.arrow([(1714,668),(1782,668)])
p.arrow([(2359,668),(2427,668)])
p.arrow([(2657,742),(2657,826),(1506,826),(1506,858)])
p.arrow([(2035,826),(2035,858)])
p.arrow([(2601,826),(2601,858)])
p.text('动作输出回到宿主：位置 / 姿态 / 命中',1740,768,29,TEAL)
for x,w,title,sub in [(1276,470,'主角代理与事件','门、赐福、死亡、存档'),(1773,525,'宿主骨骼与渲染','把动作显示在游戏中'),(2325,552,'宿主战斗系统','受击、击杀、掉落')]:
    p.rect(x,863,w,143,'#d9e7d9',radius=16)
    p.text(title,x+22,884,36,bold=True)
    p.text(sub,x+22,947,29,MUTED)
p.text('Rust DLL 经 me3 加载 · 30 Hz 逻辑更新并插值显示',1278,1050,32,TEAL)
p.text('上游是面向法环的具体适配；迁移到别的游戏，需要重新实现宿主接口。',92,1173,34,MUTED)

p.section('02','我们做出的效果：场景探索、模型切换与动作复用',1260,color=GOLD)
p.text('以下全部为本地浏览器实际画面；本演示使用自实现控制器，未运行法环、libsm64 或模组 DLL。',88,1340,31,GOLD)
# Strongest visual evidence receives the entire row.
p.rect(88,1412,2824,900,'#203329',radius=24)
p.text('七种外形，同一运动状态与语义姿态',126,1448,44,'#f1ddaa',bold=True)
p.image_box('elleh-human-comparison.jpg',126,1520,2748,640,(185,305,1100,552))
p.text('马里奥 · 路易吉 · 索尼克 · 卡比 · 史蒂夫 · 林克 · 写实人物',126,2192,39,'#f1e6c6',bold=True)
p.text('共同 Controller → 同一 pose() → 模型关节适配    ｜    切换保留位置、速度与跳跃阶段',126,2255,34,'#bdcebc')
stats=[('7 种外形','同步奔跑 / 三段跳 / 远跳 / 下砸'),('80 个关节','写实人物保留纹理、骨骼与蒙皮'),('0 个预录片段','写实 GLB 由本地姿态实时驱动'),('18 项检查','动作、计算与真实模型回归检查')]
for i,(title,sub) in enumerate(stats):
    x=88+i*713
    p.rect(x,2340,685,131,'#e9eadb',radius=18)
    p.text(title,x+22,2361,36,GOLD,bold=True)
    p.text(sub,x+22,2417,28,MUTED)

# Three views establish place, interaction, and actual control of the realistic model.
cards=[('elleh-exterior.jpg','A  场景迁移：艾雷教堂','钟楼、拱门、残墙与黄金树的局部重建',None),
       ('elleh-interior.jpg','B  进入室内与探索地标','赐福、商人咖列、锻造台；3 / 3 导览完成',(280,140,1110,700)),
       ('elleh-human-scene.jpg','C  写实人物进入同一世界','同样可以移动、跳跃，保留相同运动规则',(280,180,1020,690))]
for i,(file,title,desc,crop) in enumerate(cards):
    x=88+i*951
    p.rect(x,2500,922,665,CARD,BORDER)
    p.image_box(file,x+20,2520,882,515,crop)
    p.text(title,x+25,3062,36,bold=True)
    p.text(desc,x+25,3120,28,MUTED,max_width=872)

# Secondary screenshots never carry the explanation alone.
p.rect(88,3193,1100,560,CARD,BORDER)
p.text('D  原理展厅',118,3220,39,bold=True)
p.image_box('mechanism.jpg',118,3290,1040,349,(35,220,1210,710))
p.text('用动作轨迹、碰撞线与四步流程解释适配。',118,3676,31,MUTED,max_width=1030)
p.rect(1216,3193,1100,560,CARD,BORDER)
p.text('E  战斗比例教学实验',1246,3220,39,bold=True)
p.image_box('combat.jpg',1246,3300,1040,264,(35,85,1210,365))
p.text('例：10,000 HP Boss，拳击 5.025% → 503 HP；',1246,3600,31,MUTED,max_width=1040)
p.text('下砸 3.35% → 335 HP。仅展示数学比例。',1246,3661,31,MUTED,max_width=1040)
p.rect(2344,3193,568,560,CARD,BORDER)
p.text('F  手机适配',2370,3220,36,bold=True)
p.image_box('elleh-human-mobile.jpg',2508,3281,220,400)
p.text('触屏跳跃 / 角色切换',2370,3714,28,MUTED)

p.section('03','可扩展方向：从已验证原型，走向更通用的组件',3804,color=PURPLE)
p.text('以下方向需要按目标模型、场景或引擎继续开发，并单独验证适配效果。',88,3881,31,PURPLE)
extensions=[
    ('更多人物与身体形态','导入模型、统一尺度、映射语义关节，检查蒙皮和身体穿插。','写实人物已做出一个适配实例'),
    ('更自然的写实动作','加入动画重定向、IK 落脚、重心与肘膝处理，再调整运动参数。','保留夸张能力或追求自然动作，目标需先明确'),
    ('更多地图与局部场景','制作建筑地形与碰撞，处理第三人称镜头遮挡和地标交互。','新场景仍需独立制作与验证'),
    ('更多动作与玩法','扩充动作状态、过渡、命中检测、反馈与交互，并做回归检查。','尚无完整战斗 AI、经济或关卡系统'),
    ('接入其他游戏或引擎','重做输入、坐标、碰撞、骨骼渲染、战斗与事件接口。','法环专属适配层不能直接照搬'),
    ('沉淀可复用工具链','抽离控制、姿态与环境协议，供数字人、虚拟展厅和交互原型使用。','还需建立模型规范、调参工具与自动验证')]
for i,(title,desc,note) in enumerate(extensions):
    x=88+(i%3)*951;y=3950+(i//3)*297
    p.rect(x,y,922,269,'#f1edf4','#d6cde1')
    p.text(title,x+27,y+25,39,PURPLE,bold=True)
    p.text(desc,x+27,y+91,32,INK,max_width=868,line_height=1.42)
    p.text(note,x+27,y+211,26,PURPLE,max_width=868)

p.section('04','意义：把成熟能力变成能复用、能验证的基础',4581)
values=[('少重复开发','复用成熟运动与动画，把精力用在接口适配和新玩法。'),
        ('改变探索体验','新的移动能力，会改变路线、障碍与接近敌人的方式。'),
        ('外形与行为解耦','比较不同身体比例，验证同一行为如何被不同模型表达。'),
        ('工程原理可见','把碰撞、骨骼与流程的连接，做成可操作、可交流的证据。')]
for i,(title,desc) in enumerate(values):
    x=88+i*713
    p.rect(x,4684,685,242,'#e5ecdf',radius=22)
    p.text(title,x+24,4711,39,TEAL,bold=True)
    p.text(desc,x+24,4783,32,INK,max_width=637,line_height=1.45)

# Practical boundaries and a final relationship, rather than a slogan without scope.
p.rect(88,4970,2824,657,INK,radius=24)
p.text('这次探索证明：控制逻辑、身体表现和环境接口，可以分开设计。',128,5010,47,'#f5e3b1',bold=True)
boundary=[('原库运行前提','Steam 法环、自有美版 SM64 ROM、me3。离线运行、反作弊关闭，并使用独立存档。'),
          ('目前验证到哪里','源码研究＋浏览器演示。未做上游模组实机验证；教堂是参考重建，并非原版游戏场景。'),
          ('继续复用的条件','模型需要关节适配，游戏需要宿主接口。写实外形不自动产生自然动作；统一碰撞体也不等于精确身体碰撞。')]
for i,(title,desc) in enumerate(boundary):
    x=128+i*924
    p.text(title,x,5115,37,'#ead39b',bold=True)
    p.text(desc,x,5183,32,'#c6d5c1',max_width=850,line_height=1.55)
p.text('上游已知问题：部分电梯穿透、过场变形、甩投布娃娃异常与阴影闪烁；未在本机复测。',128,5374,27,'#b1c5ae')
p.line([(128,5418),(2872,5418)],'#4b6758',2)
p.text('库的价值：成熟动作 × 宿主适配。我们的延伸：共用控制 × 不同外形 × 可探索场景。',128,5454,38,'#f1e6c6',bold=True,max_width=2730)
p.text('网页不包含 ROM、法环资产或模组 DLL；经典形象为自制几何，写实人物采用 Rocketbox 的 MIT 资源。',128,5542,28,'#b1c5ae',max_width=2740)

p.text('资料与证据',88,5681,31,bold=True)
p.text('上游：github.com/deltarooo/er-mario  ·  v0.4.2 / 11744b8；源码索引：references/sources.json',88,5733,27,MUTED)
p.text('写实模型：github.com/microsoft/Microsoft-Rocketbox  ·  MIT / Copyright © 2020 Microsoft；来源记录：references/rocketbox-source.json',88,5780,26,MUTED)
p.text('本地截图与检查：scene.md、notes.md。作者 X 视频媒体已停用，未用作实机画面。图中扩展方向为基于现有工程的推演。',88,5827,26,MUTED)
p.finish()
print('Created assets/er-mario-overview.png and .svg —',W,'×',H)
