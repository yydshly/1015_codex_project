"""Build offline-friendly research data and a source-linked document set. No dependencies."""
from html import escape
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / "references/upstream-manifest.json").read_text(encoding="utf-8"))
data = json.loads((ROOT / "research.json").read_text(encoding="utf-8"))
COMMIT = manifest["commit"]
source_specs = [
    ("overview", "Octop 功能与路线图", "README.md", "上游文档"),
    ("architecture", "服务端、会话与存储架构", "docs/architecture.md", "上游文档"),
    ("processor", "统一请求与会话处理", "src/octop/infra/gateway/process/processor.py", "源码"),
    ("knowledge", "知识库检索工具", "src/octop/infra/knowledge/tools.py", "源码"),
    ("parse", "文档解析格式", "src/octop/infra/knowledge/parse.py", "源码"),
    ("cron", "定时提醒与 Agent 任务", "src/octop/infra/cron/tools.py", "源码"),
    ("teams", "专家团队行为与限制", "docs/expert-teams.md", "上游文档"),
    ("jobs", "团队在途任务状态", "src/octop/infra/agents/teams/jobs.py", "源码"),
    ("connectors", "连接器与 MCP 模式", "docs/connectors.md", "上游文档"),
    ("acp", "ACP 双向集成与执行器", "docs/acp.md", "上游文档"),
]
sources = [{"id": sid, "title": title, "url": f"https://github.com/TencentCloud/Octop/blob/{COMMIT}/{path}",
            "path": path, "kind": kind, "date": data["date"]} for sid, title, path, kind in source_specs]
sources += [
    {"id":"codex", "title":"OpenAI：当前功能与扩展", "url":"https://learn.chatgpt.com/docs/features", "kind":"官方产品文档", "date":data["date"]},
    {"id":"codex-open", "title":"OpenAI：开源 CLI、SDK 与 App Server", "url":"https://learn.chatgpt.com/docs/open-source", "kind":"官方产品文档", "date":data["date"]},
    {"id":"dots", "title":"OpenAI：dots 的持续职责", "url":"https://learn.chatgpt.com/docs/dots", "kind":"官方产品文档", "date":data["date"]},
    {"id":"dots-computer", "title":"OpenAI：dots 的电脑与应用", "url":"https://learn.chatgpt.com/docs/dots/computers-and-apps", "kind":"官方产品文档", "date":data["date"]},
    {"id":"dots-tasks", "title":"OpenAI：dots 的任务与记忆", "url":"https://learn.chatgpt.com/docs/dots/tasks-and-memory", "kind":"官方产品文档", "date":data["date"]},
    {"id":"dots-channels", "title":"OpenAI：dots 的消息渠道", "url":"https://learn.chatgpt.com/docs/dots/channels", "kind":"官方产品文档", "date":data["date"]},
    {"id":"grok", "title":"官方 Grok Bot：云端电脑与 Bot 协作", "url":"https://docs.x.ai/grok-bot/overview", "kind":"官方产品文档", "date":data["date"]},
    {"id":"grok-chat", "title":"官方 Grok：聊天、搜索与资料分析", "url":"https://x.ai/grok", "kind":"官方产品文档", "date":data["date"]}
]
data.update({"sources": sources, "commit": COMMIT, "version": "1.0.2", "sourceFileCount": len(manifest["files"])})
web_assets = ROOT / "web/assets"
web_assets.mkdir(parents=True, exist_ok=True)
(web_assets / "research-data.js").write_text("window.OCTOP_RESEARCH = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
(web_assets / "research-data.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
(ROOT / "references/sources.json").write_text(json.dumps(sources, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
by_id = {s["id"]:s for s in sources}

def refs(ids):
    return " · ".join(f'[{by_id[i]["title"]}]({by_id[i]["url"]})' for i in ids)

intro = f"研究日期：{data['date']}。上游固定版本：`{COMMIT}`。\n\n文档与选定源码核查；未运行 Octop 实例、付费模型 API 或同任务产品对照实测。产品比较按官方文档，不推断完成率和可靠性排名。\n\n"
cap = "# Octop 的能力与边界\n\n" + intro
for c in data["capabilities"]:
    cap += f"## {c['title']}\n\n状态：{c['tag']}。\n\n{c['text']}\n\n使用场景：{c['example']}\n\n{refs(c['sources'])}\n\n"
(ROOT / "capabilities.md").write_text(cap.rstrip() + "\n", encoding="utf-8")
arch = "# 从消息到真实执行\n\n" + intro
arch += "Octop 将模型、工具、权限、上下文和消息渠道组织为一个服务。模型提出下一步，运行时调用工具，工具结果返回后继续处理。下述链路是基于代码与文档的概念化讲解，具体分支因工具与任务而异。\n\n"
for n, f in enumerate(data["flow"], 1):
    arch += f"## {n}. {f['name']}\n\n`{f['component']}` · {f['where']}\n\n{f['description']}\n\n{f['decision']}\n\n{refs(f['sources'])}\n\n"
arch += "## 核心构成\n\nPython 3.12+、FastAPI/uvicorn、React/TypeScript，单进程集成运行时与消息网关；控制面数据库可用 SQLite 或 PostgreSQL。工作区文件、记忆和控制面数据应分别理解。底层 Agent 运行时来自 octop-harness，消息桥接来自 octop-gateway，记忆与浏览器能力由相应组件提供。\n\n"
(ROOT / "architecture.md").write_text(arch.rstrip() + "\n", encoding="utf-8")
comp = "# Octop 与 Codex、dots、Grok Bot\n\n" + intro
comp += "Octop 的差异主要是自部署、模型接入、国内消息渠道与源码级定制。dots 和官方 Grok Bot 也能持续工作、记忆和真实执行。Codex 也有插件、定时任务及开源 CLI/SDK。能力重叠不代表同等完成率；需要使用相同任务验收。\n\n用户所说的 Grok 官方聊天入口与 Grok Bot 分开理解：前者提供聊天、搜索、资料分析和内容生成；下表中的 Grok Bot 是官方常驻智能体形态，具有电脑与任务协作能力，不能把这些能力默认套用到所有普通聊天会话。" + refs(["grok-chat", "grok"]) + "\n\n| 维度 | Octop | Codex | dots | Grok Bot |\n| --- | --- | --- | --- | --- |\n"
for r in data["comparison"]:
    comp += "| " + " | ".join(r[k].replace("|", " / ") for k in ["dimension","octop","codex","dots","grok"]) + " |\n"
comp += "\n## 决策建议（我们的判断）\n\n"
for d in data["decisions"]:
    comp += f"### {d['label']}\n\n{d['title']} {d['text']}\n\n" + "\n".join("- " + c for c in d["checks"]) + "\n\n"
comp += "## 产品资料\n\n" + "\n".join("- " + refs([s["id"]]) for s in sources if s["kind"] == "官方产品文档") + "\n"
(ROOT / "comparison.md").write_text(comp.rstrip() + "\n", encoding="utf-8")
ext = "# 可扩展方式与交付要求\n\n" + intro
for e in data["extensions"]:
    ext += f"## {e['label']}\n\n{e['status']}。{e['title']}\n\n{e['text']}\n\n" + "\n".join(f"{i}. {s}" for i,s in enumerate(e["steps"], 1)) + f"\n\n{e['output']}\n\n{refs(e['sources'])}\n\n"
(ROOT / "extensions.md").write_text(ext.rstrip() + "\n", encoding="utf-8")
notes = "# 从对话形成的理解与待验证问题\n\n" + intro
notes += "群聊是入口之一。Octop 的本质是将入口、身份与专家、模型、上下文和工具执行组织成可自建的 AI 助手服务。其价值主要来自业务接入与控制权；群聊入口本身不自动提高模型智力。\n\n理解逐步从功能清单，推进到统一服务端，再区分模型决策与工具执行，最后比较自建平台与托管常驻助手。对于只想在群里调用一个 Agent 的个人，轻量机器人加执行器可能已经足够；多用户、内部资料与系统接入、模型策略和源码改造需求越明确，平台整合的价值越容易成立。这是基于功能与架构的判断，仍需真实任务验证。\n\n"
for q in data["questions"]:
    notes += f"## {q['title']}\n\n{q['answer']}\n\n{q['next']}\n\n"
notes += "## 验证记录\n\n上游固定源码文件及 SHA-256 见 references/upstream-manifest.json；网页的静态与浏览器验证记录单独保存。网页交互使用说明性情景，无实际模型、Shell、MCP 或 ACP 调用。\n"
(ROOT / "notes.md").write_text(notes.rstrip() + "\n", encoding="utf-8")

svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900" role="img" aria-labelledby="title desc">
<title id="title">Octop：从一个请求，到一次真实执行</title><desc id="desc">本研究绘制的结构示意。多种消息入口进入 Octop 服务，经身份、上下文、模型判断和工具执行，把结果回传并保存；自部署与托管助手的选择取决于控制与维护需求。</desc>
<defs><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="#233542" stroke-width=".6"/></pattern><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="none" stroke="#8be1ca" stroke-width="1.5"/></marker></defs>
<rect width="1440" height="900" fill="#10242b"/><rect width="1440" height="900" fill="url(#grid)" opacity=".5"/>
<g font-family="Segoe UI,Microsoft YaHei,sans-serif"><text x="80" y="79" font-size="17" fill="#91b3b4" letter-spacing="4">RESEARCH 011 / OCTOP</text><text x="80" y="160" font-size="54" font-weight="700" fill="#f4f1e9">从一个请求，到一次真实执行。</text><text x="80" y="205" font-size="23" fill="#a6bebd">多入口 · 模型与上下文 · 工具执行 · 结果回传</text>
<g fill="none" stroke="#8be1ca" stroke-width="2" marker-end="url(#arrow)"><path d="M330 413H470"/><path d="M720 349V290H1100V365"/><path d="M800 450H1000"/><path d="M1100 530V620H720V546"/><path d="M470 485H390V605H222V498"/></g>
<g fill="#19343c" stroke="#36555b"><rect x="80" y="333" width="250" height="165" rx="12"/><rect x="470" y="330" width="330" height="215" rx="14"/><rect x="1000" y="365" width="350" height="165" rx="12"/></g>
<text x="108" y="371" font-size="14" fill="#8be1ca" letter-spacing="2">01 / 接入</text><text x="108" y="415" font-size="29" fill="#fff">消息与定时任务</text><text x="108" y="455" font-size="17" fill="#acc2c1">Web · CLI · 飞书 · 企业微信</text>
<text x="500" y="372" font-size="14" fill="#8be1ca" letter-spacing="2">02 / OCTOP SERVER</text><text x="500" y="423" font-size="41" fill="#fff" font-weight="700">身份 + 上下文</text><text x="500" y="466" font-size="20" fill="#acc2c1">会话 / 记忆 / 知识库 / 权限</text><text x="500" y="505" font-size="17" fill="#8be1ca">运行时协调模型与工具</text>
<text x="1028" y="407" font-size="14" fill="#8be1ca" letter-spacing="2">03 / 执行</text><text x="1028" y="451" font-size="29" fill="#fff">实际工具与程序</text><text x="1028" y="492" font-size="17" fill="#acc2c1">文件 / 终端 / 浏览器 / MCP / ACP</text>
<rect x="945" y="251" width="310" height="63" rx="31" fill="#9bdfc8"/><text x="1100" y="291" text-anchor="middle" font-size="22" fill="#153730">模型判断 · API / Ollama</text>
<text x="222" y="643" text-anchor="middle" font-size="18" fill="#9bb8b5">向用户回传结果</text><text x="825" y="654" text-anchor="middle" font-size="18" fill="#9bb8b5">工具返回结果，再继续处理与保存</text>
<path d="M80 727H1360" stroke="#345057"/><text x="80" y="777" font-size="21" fill="#f3f0e8">核心价值：自己管理 AI 服务，接入自己的工作环境与业务系统。</text><text x="80" y="824" font-size="16" fill="#90acae">与 Codex、dots、Grok Bot 有能力重叠；差异在运行方式、控制范围与维护责任。</text><text x="80" y="865" font-size="13" fill="#769798">本研究绘制的机制示意 · 文档与源码核查 · 2026.10.20 · 未运行 Octop 实例</text></g></svg>'''
(ROOT / "assets/cover.svg").write_text(svg, encoding="utf-8")
shutil.copy2(ROOT / "assets/cover.svg", web_assets / "architecture.svg")
documents = web_assets / "docs"
documents.mkdir(exist_ok=True)
for name in ("capabilities.md", "architecture.md", "comparison.md", "extensions.md", "notes.md"):
    shutil.copy2(ROOT / name, documents / name)
shutil.copy2(ROOT / "references/upstream-manifest.json", web_assets / "upstream-manifest.json")
print(f"Generated research data, five documents and architecture SVG. Source commit: {COMMIT[:12]}")
