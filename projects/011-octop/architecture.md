# 从消息到真实执行

研究日期：2026-10-20。上游固定版本：`dd9dce470844c25d59effb50615bb3c667ea25cd`。

文档与选定源码核查；未运行 Octop 实例、付费模型 API 或同任务产品对照实测。产品比较按官方文档，不推断完成率和可靠性排名。

Octop 将模型、工具、权限、上下文和消息渠道组织为一个服务。模型提出下一步，运行时调用工具，工具结果返回后继续处理。下述链路是基于代码与文档的概念化讲解，具体分支因工具与任务而异。

## 1. 接收请求

`Gateway / WebSocket` · Octop 服务端

将不同入口的消息接入处理管线。聊天入口负责传递请求；它不会自动授予文件、邮箱或业务系统权限。

先确认：谁在什么会话中请求了什么？

[服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md) · [统一请求与会话处理](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/src/octop/infra/gateway/process/processor.py)

## 2. 定位用户与专家

`UserManager / AgentManager` · Octop 服务端

识别用户和专家归属，选定模型、工作区、已启用工具和会话。JWT 与行级归属检查帮助控制访问；实际工具隔离仍取决于执行环境。

专家配置决定这次能看到什么、能调用什么。

[服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md)

## 3. 准备上下文

`Memory / search_knowledge` · 工作区与知识库

把任务说明、相关记忆、选定知识库的检索片段和工具说明交给模型。RAG 是检索资料后辅助回答，内容不会因此自动写入模型权重。

相关资料帮助判断，检索结果仍需要查验。

[知识库检索工具](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/src/octop/infra/knowledge/tools.py) · [文档解析格式](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/src/octop/infra/knowledge/parse.py)

## 4. 模型决定下一步

`octop-harness / LLM provider` · 所选模型服务

模型可能直接回答，也可能提出结构化工具调用。Octop 提供运行时与配置，推理来自所接入模型；更换聊天入口不会自行提升推理能力。

工具调用是执行请求，接下来还要由运行时落实。

[Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md) · [服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md)

## 5. 工具实际执行

`Tool / MCP / ACP runner` · 主机、工作环境或外部服务

运行时根据工具、授权与审批规则执行操作。MCP 把请求交给业务工具；ACP 可以启动已安装并认证的外部编程助手。

检查动作在哪里发生、使用哪个账号、会写入什么。

[连接器与 MCP 模式](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/connectors.md) · [ACP 双向集成与执行器](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/acp.md)

## 6. 结果回到模型

`Tool result → agent loop` · 智能体运行时

实际工具返回内容或错误，模型据此继续处理、重试、请求协助或结束。这是概念化执行循环；具体恢复与重试策略需逐工具验证。

检查文件、差异、日志等产物，区分执行完成与任务达成。

[服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md) · [统一请求与会话处理](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/src/octop/infra/gateway/process/processor.py)

## 7. 回传与保存

`Channel / Archive / Workspace` · 原消息渠道与存储

向用户返回结果，保存会话和产物。配置、会话可恢复，不代表所有在途任务都能无损续跑；团队文档明确记录了相关限制。

用可检查的产物验收，再决定是否继续或调度下一轮。

[服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md) · [专家团队行为与限制](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/expert-teams.md)

## 核心构成

Python 3.12+、FastAPI/uvicorn、React/TypeScript，单进程集成运行时与消息网关；控制面数据库可用 SQLite 或 PostgreSQL。工作区文件、记忆和控制面数据应分别理解。底层 Agent 运行时来自 octop-harness，消息桥接来自 octop-gateway，记忆与浏览器能力由相应组件提供。
