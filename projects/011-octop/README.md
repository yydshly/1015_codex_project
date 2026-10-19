# 011 · Octop 自建 AI 助手平台研究

Octop 把群聊、私聊、网页、API 和定时任务接入可自行部署的 Agent 服务，在后台整合模型、记忆、知识库和真实工具执行。配置与授权后，可用于资料问答、研究简报、日志分析和编程派工，产出回答、文件、报告或代码差异。

**群聊是入口之一，核心是自己管理的 Agent 执行与服务平台。** 价值主要在多用户与专家管理、国内 IM、内网业务接入、模型和源码控制；意义是把一次性对话组织成可重复使用、可检查产物的团队服务。它也把主机、升级、权限、备份和失败恢复的维护责任交给部署者。

| 项目资料 | 内容 |
| --- | --- |
| 上游仓库 | [TencentCloud/Octop](https://github.com/TencentCloud/Octop) |
| 固定研究版本 | [`dd9dce470844c25d59effb50615bb3c667ea25cd`](https://github.com/TencentCloud/Octop/tree/dd9dce470844c25d59effb50615bb3c667ea25cd) |
| 研究日期 | 2026-10-20 |
| 研究状态 | 文档、源码与网页研究；尚未运行 Octop 实例或做同任务产品实测 |
| 上游许可证 | MIT；原文保留于 [LICENSE](references/upstream/LICENSE) |
| 网页入口 | [研究网页](web/index.html)；本地预览方式见 [Web 说明](web/README.md) |
| 部署状态 | 本地网页与 Pages 构建接入；真实演示地址仅在部署验证后登记 |

## 一图总览

![Octop 完整理解全景图：能力、真实执行、使用场景、扩展路径与同类产品对比](assets/octop-understanding-overview-20261020.png)

[下载高清 PNG](assets/octop-understanding-overview-20261020.png) · [下载可编辑 SVG](assets/octop-understanding-overview-20261020.svg) · [生成记录](references/understanding-overview-generation.json)

长图采用原生 SVG 精确排版，导出为 2160×6786 PNG，包含六个板块，区分已有能力、Beta、规划与研究建议。排版可通过 `tools/draw_understanding_overview.py` 复现，生成过程与核查记录保存在 `references/`。

## 研究摘要

| 问题 | 我们的理解 |
| --- | --- |
| 能力和效果 | 多入口、多用户与专家、模型、记忆、知识库、定时任务和工具整合；交付来源回答、报告、简报或代码差异，需接入实际数据与工具。 |
| 本质是群聊吗？ | 群聊是交互形式之一。服务端识别用户与专家，准备上下文，模型提出工具调用，运行时落实动作并保存、回传结果。 |
| 使用场景 | 内部资料问答、项目更新研究、日志分析、通过 ACP 委派代码任务；每个场景按产物验收。 |
| 可扩展场景 | 经 MCP、连接器或业务 API 接入工单、CRM、运维、研究等流程；专家与技能沉淀方法，ACP 对接外部 Agent，也可扩展渠道、模型和存储。新业务仍需开发和验证。 |
| 同类对比价值 | Codex 擅长任务与工程执行，dots 面向持续职责，官方 Grok 聊天入口提供问答、搜索与资料分析，Grok Bot 则另有常驻电脑形态。Octop 的主要差异是自部署、业务整合与源码控制，不能据此推断更聪明或更可靠。 |
| 意义与取舍 | 把 AI 作为自己管理的业务服务。仅想在群里调用 Agent 时，轻量机器人加执行器可能已足够；当内部接入、多人管理与控制需求明确时，平台整合更有价值。 |

## 网页包含什么

- 能力与边界：已有实现、AgentTeams Beta 和路线图分别标记。
- 底层原理：三个任务情景、七步执行链路，以及部署位置与模型位置的交互说明。
- 同类对比：Octop、Codex、dots、官方 Grok Bot 的定位、运行环境、持续工作与定制范围。
- 我们的思考：控制权、推理与执行、数据流向、多专家收益和可靠性。
- 扩展方式：模型与存储、消息渠道、MCP、专家与技能、ACP，以及可靠性工程。
- 来源资料：固定版本的上游链接、官方产品文档、可下载的五份笔记和结构图。

本页是有来源的研究与机制示意；互动情景不调用真实模型、Shell、MCP 或 ACP，也不代表已经验证上游业务执行成功率。

## 阅读资料

[能力与边界](capabilities.md) · [底层原理](architecture.md) · [产品对比](comparison.md) · [讨论与待验证问题](notes.md) · [扩展路径](extensions.md)

固定的 13 份文档与源码及 SHA-256 见 [快照清单](references/upstream-manifest.json)，外部来源见 [来源目录](references/sources.json)。未引入上游可执行应用；选定快照保留原始版权与许可。结构图与网页为本研究编写，示意标识不作为 Octop 官方品牌素材。

## 构建与验证

```powershell
python projects/011-octop/tools/build_research.py
python scripts/projects.py sync
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8872 --directory _site --bind 127.0.0.1
```

访问 `http://127.0.0.1:8872/projects/011-octop/`。无需 npm 依赖；浏览器交互与本地 HTTP 检查记录见 `references/`。

也可以直接在浏览器打开 `web/index.html`，无需 HTTP 服务；交互数据、样式与下载资料均随文件保存。验证覆盖 1440 / 1024 / 768 / 390 / 320px、任务链路、筛选、扩展导航与资源下载；最新结果见 [网页验证记录](references/web-verification.json)。验证结论限于研究网页。

需要刷新上游研究版本时，可运行 `tools/capture_sources.py`，再审查内容变化并更新研究结论；构建不会自动抓取或替换来源。发布遵循 [仓库部署约定](../../docs/deployment.md)。
