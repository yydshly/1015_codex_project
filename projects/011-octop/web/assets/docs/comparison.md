# Octop 与 Codex、dots、Grok Bot

研究日期：2026-10-20。上游固定版本：`dd9dce470844c25d59effb50615bb3c667ea25cd`。

文档与选定源码核查；未运行 Octop 实例、付费模型 API 或同任务产品对照实测。产品比较按官方文档，不推断完成率和可靠性排名。

Octop 的差异主要是自部署、模型接入、国内消息渠道与源码级定制。dots 和官方 Grok Bot 也能持续工作、记忆和真实执行。Codex 也有插件、定时任务及开源 CLI/SDK。能力重叠不代表同等完成率；需要使用相同任务验收。

用户所说的 Grok 官方聊天入口与 Grok Bot 分开理解：前者提供聊天、搜索、资料分析和内容生成；下表中的 Grok Bot 是官方常驻智能体形态，具有电脑与任务协作能力，不能把这些能力默认套用到所有普通聊天会话。[官方 Grok：聊天、搜索与资料分析](https://x.ai/grok) · [官方 Grok Bot：云端电脑与 Bot 协作](https://docs.x.ai/grok-bot/overview)

| 维度 | Octop | Codex | dots | Grok Bot |
| --- | --- | --- | --- | --- |
| 主要用途 | 搭建自己管理的 AI 助手服务 | 构建、调试、测试、审查软件及其他工具任务 | 接下持续职责，在对话之间推进与跟进 | 持久化 Bot 团队，跨应用完成工作 |
| 运行与维护 | 自行部署，维护主机、升级、备份与凭证 | 可用官方产品；CLI / SDK 可供自行集成 | 官方云端运行，也可授权连接个人电脑 | 官方托管的持久化云端电脑 |
| 入口与资料 | Web / API 与多种 IM；内置知识库与工作区 | 桌面、CLI、IDE；项目、文件、插件与工具 | ChatGPT、语音、Slack、Teams；上下文跨渠道延续 | 桌面、移动端和 Bot 群聊；连接器与电脑应用 |
| 真实执行 | 按配置在主机、工作环境、MCP 服务或 ACP 执行器操作 | 在授权工作环境中操作代码、命令和工具 | 云端电脑与浏览器，可委派 Work / Codex 任务 | 云端文件、终端、浏览器、连接器和电脑操作 |
| 持续工作与分工 | Cron + 多专家；团队协调仍 Beta | 支持定时任务及可扩展的任务流程 | 持续职责、自主跟进、后台任务与可保存的日程 | 多个 Bot 并行、互相交接、技能与例行任务 |
| 可定制的层次 | 模型接入、业务工具、存储、入口乃至平台源码 | 项目指令、Skills、插件、CLI / SDK；因产品形态而异 | 官方支持的连接、权限、规则和任务配置 | 官方支持的 Bot、连接器、技能及运行设置 |
| 关掉个人电脑后 | 部署主机常开即可继续；仅部署在已关机电脑上则停止 | 取决于任务在本地还是云端执行 | 云端工作继续；本地步骤要求连接电脑在线 | 云端工作继续 |

## 决策建议（我们的判断）

### 我自己完成工作

先把现成助手用到位。 如果目标是研究仓库、写代码、整理资料或持续跟踪事项，可以先用 Codex、dots 或 Grok Bot 跑通同一组任务。Octop 的额外部署成本，需要由明确的接入或控制需求支撑。

- 用同一份任务说明与验收清单比较
- 记录失败后的人工接管时间
- 核算真实用量、执行环境与维护成本

### 我为团队自建服务

Octop 的平台价值开始清晰。 当成员需要从企业微信或飞书访问内部资料、内部 API，而且你要管理专家、模型和存储时，Octop 提供了一组已经整合的基础模块。

- 先选一个岗位和一条消息渠道
- 验证账号与工具权限是否满足实际隔离要求
- 为失败、重启和重复触发设计验收

### 我准备二次开发

把它当作可改造的服务底座。 保留运行时、渠道、知识库和任务管理，围绕特定业务接入 MCP、专家技能与产物检查。工程投入应优先用来提升可验收性，再扩展更多角色。

- 固定上游版本，保留 MIT 许可
- 优先配置和标准协议，必要时再改核心
- 用真实任务完成率指导扩展方向

## 产品资料

- [OpenAI：当前功能与扩展](https://learn.chatgpt.com/docs/features)
- [OpenAI：开源 CLI、SDK 与 App Server](https://learn.chatgpt.com/docs/open-source)
- [OpenAI：dots 的持续职责](https://learn.chatgpt.com/docs/dots)
- [OpenAI：dots 的电脑与应用](https://learn.chatgpt.com/docs/dots/computers-and-apps)
- [OpenAI：dots 的任务与记忆](https://learn.chatgpt.com/docs/dots/tasks-and-memory)
- [OpenAI：dots 的消息渠道](https://learn.chatgpt.com/docs/dots/channels)
- [官方 Grok Bot：云端电脑与 Bot 协作](https://docs.x.ai/grok-bot/overview)
- [官方 Grok：聊天、搜索与资料分析](https://x.ai/grok)
