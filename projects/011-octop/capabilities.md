# Octop 的能力与边界

研究日期：2026-10-20。上游固定版本：`dd9dce470844c25d59effb50615bb3c667ea25cd`。

文档与选定源码核查；未运行 Octop 实例、付费模型 API 或同任务产品对照实测。产品比较按官方文档，不推断完成率和可靠性排名。

## 多入口，共用一套运行时

状态：已有 · 文档。

网页、CLI、HTTP/WebSocket、飞书、钉钉、微信、企微等入口汇入统一消息处理。价值在统一入口、身份与会话。

使用场景：同事从企业微信提问，助手读取获授权的资料后返回结果。

[服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md) · [Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md)

## 多个用户，多个专业助手

状态：已有 · 文档。

为用户配置不同专家，每个专家有自己的工作区、模型、提示与工具配置；可以复用和分享专家配置。

使用场景：资料助手与代码助手使用不同的资料、模型和工具。

[Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md) · [服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md)

## 持久记忆与文档检索

状态：已有 · 源码。

记忆保存长期上下文；知识库检索相关文档片段后交给模型。PDF、Word、Excel、Markdown 等有解析实现。

使用场景：根据已导入的项目笔记回答问题；检索质量与回答正确性仍需验证。

[知识库检索工具](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/src/octop/infra/knowledge/tools.py) · [文档解析格式](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/src/octop/infra/knowledge/parse.py) · [Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md)

## 工具让判断变成动作

状态：已有 · 文档。

可使用终端、浏览器、连接器及编程执行器。操作发生在主机、配置的工作环境或外部服务，受工具与账号权限约束。

使用场景：读取文件、运行分析脚本、保存报告；远程桌面本身是查看与输入入口。

[Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md) · [连接器与 MCP 模式](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/connectors.md) · [ACP 双向集成与执行器](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/acp.md)

## 定时提醒与定时办事

状态：已有 · 源码。

定时任务区分 text 和 agent：前者直接发送固定提醒，后者每次调用助手处理最新信息，再返回结果。

使用场景：每天检查更新并生成摘要，需要额外接好信息源与通知渠道。

[定时提醒与 Agent 任务](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/src/octop/infra/cron/tools.py) · [服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md)

## 专家分工与主持人汇总

状态：Beta · 文档。

主持人异步分派，成员用各自工作区执行并回报。当前团队在途任务不支持跨进程持久化，取消主持人也不会同时停下成员。

使用场景：调研与代码分析可分别派工；不据此推断完成率高于单个助手。

[专家团队行为与限制](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/expert-teams.md) · [团队在途任务状态](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/src/octop/infra/agents/teams/jobs.py)

## 插件、MCP 与 ACP

状态：已有 · 文档。

插件和 MCP 扩展业务工具；ACP 连接外部编程助手。MCP 主要连接工具和数据，ACP 主要连接智能体会话与执行器。

使用场景：用 MCP 调内部工单 API，用 ACP 把代码任务交给 Codex CLI。

[连接器与 MCP 模式](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/connectors.md) · [ACP 双向集成与执行器](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/acp.md) · [Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md)

## 录制技能与自动提炼

状态：规划 · 路线图。

README 将浏览器工作流录制、从对话自动提炼技能等列为计划。现有记忆、手工技能与这些规划要分开理解。

使用场景：本研究没有将“一次演示，永久自动学会”作为 Octop 已验证效果。

[Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md)
