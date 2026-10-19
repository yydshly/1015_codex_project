# 可扩展方式与交付要求

研究日期：2026-10-20。上游固定版本：`dd9dce470844c25d59effb50615bb3c667ea25cd`。

文档与选定源码核查；未运行 Octop 实例、付费模型 API 或同任务产品对照实测。产品比较按官方文档，不推断完成率和可靠性排名。

## 01 模型与存储

现有扩展点。先改变配置，再改变运行时。

按专家配置模型服务；README 列出兼容 API、DashScope 与 Ollama。工作区支持多种后端，控制面数据库与工作区文件存储是两个层次。

1. 选择支持所需工具调用的模型与接口
2. 确定数据库、工作区和模型分别运行在哪里
3. 用同一任务检查工具调用、延迟、费用与数据流向

交付：模型配置与环境说明 + 一份相同任务的对照记录。

[Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md) · [服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md)

## 02 消息入口

现有扩展点。让业务人员从熟悉的入口使用。

先使用已支持的飞书、钉钉、企微等渠道；新平台需要适配 Gateway 的消息、会话与回传机制。接入聊天渠道与授权业务系统是分别进行的。

1. 先验证机器人凭证与平台权限
2. 映射外部用户、群聊和内部会话
3. 测试长任务回传、重复消息及失败通知

交付：一条可收发消息的渠道 + 用户映射 + 失败回传记录。

[Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md) · [服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md)

## 03 业务工具 MCP

现有扩展点。把业务系统变成有边界的工具。

通过内置连接器或自定义 MCP 暴露业务查询与写操作。可以连接内部工单、CRM、知识库或 GitHub 工具；权限范围取决于实际账号与工具。

1. 先暴露只读查询并定义输入、输出和错误
2. 再增加范围明确的写操作与审查流程
3. 为重试设计幂等键，保存可检查的动作结果

交付：工具接口 + 授权范围 + 错误及重复请求处理说明。

[连接器与 MCP 模式](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/connectors.md) · [Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md)

## 04 专家、技能与插件

现有扩展点。把岗位知识与工作方法变成可复用配置。

专家用提示、技能、资料和工具形成岗位能力；插件可封装扩展。增加一个角色不等于增加一个独立训练过的模型，也不自动提高协作收益。

1. 写清职责、输入资料和停止条件
2. 把稳定步骤封装成技能或小脚本
3. 约定产物格式，并用固定样本验收

交付：一个岗位配置 + 样例输入 + 可验收的输出规范。

[Octop 功能与路线图](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/README.md) · [专家团队行为与限制](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/expert-teams.md)

## 05 编程执行 ACP

现有扩展点。让专门的编程工具接手代码任务。

在部署 Octop 的主机安装并认证对应 CLI；配置 runner，再按专家启用 acp_runner。Codex 通过相应 ACP 适配器接入。

1. 限制目标工作目录，准备项目约束
2. 传入复现条件、预期变化与检查要求
3. 返回差异与检查证据，再决定提交或部署

交付：可启动的 runner + 代码差异 + 检查结果。

[ACP 双向集成与执行器](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/acp.md)

## 06 可靠性与产品化

我们的工程建议。把“能调用”推进到“能稳定交付”。

若要承接长期业务，需围绕任务状态、幂等重试、取消传播、配额、可观测性与结果验收进行工程设计。当前团队文档记录了在途任务与取消行为的限制。

1. 先测试断网、重启、重复消息和凭证失效
2. 为有副作用的动作保存任务状态与幂等标识
3. 建立产物检查、人工接管与回归任务集

交付：失败场景记录 + 恢复策略 + 真实完成率与人工接管数据。

[专家团队行为与限制](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/expert-teams.md) · [团队在途任务状态](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/src/octop/infra/agents/teams/jobs.py) · [服务端、会话与存储架构](https://github.com/TencentCloud/Octop/blob/dd9dce470844c25d59effb50615bb3c667ea25cd/docs/architecture.md)
