# 能力矩阵与验证层级

固定快照 `7f46ba37c654d5f7675bb1328158030d7604847c`（包版本 3.0.0）。已实现表示存在代码或明确能力描述；离线验证表示合成/模拟输入运行；本轮未使用真实账号。

| 能力 | 命令示例 | 实现与条件 | 本轮证据 |
| --- | --- | --- | --- |
| 职位发现 | `search/detail/recommend` | 浏览器搜索；详情使用适用的 httpx/浏览器通道 | 管线离线测试，未在线验证 |
| 多维条件 | `--salary/--experience/--education` 等 | 平台参数映射+列表过滤 | 过滤/管线测试 |
| 福利 | `--welfare "双休,五险一金"` | 词表、子串、AND，先标签后详情 | 原始函数 10 例探针 |
| HR 活跃度 | `--active online/3d` | online 看列表，其余可能补查详情 | 读代码，未纳入 59 项测试 |
| 岗位管理 | `shortlist/watch/stats/preset/favorites` | SQLite 状态；部分需平台读取 | 代码/文档，网页只演示筛选 |
| 有界采集 | `crawl run/status/results/resume/stop` | 独立 profile、固定预算、断点和导出 | 未运行采集 |
| 求职触达 | `greet/apply/batch-greet/exchange` | 浏览器/平台接口，数量限制、去重、风险停止 | 未发送消息或交换联系方式 |
| AI 求职辅助 | `ai analyze-jd/polish/optimize/fit` | 提示词+配置的模型，可接本地兼容服务 | 未调用模型 |
| 沟通和进度 | `chat/chatmsg/pipeline/follow-up` | 平台读取+本地聚合；来源策略影响通道 | 未读取真实聊天 |
| 招聘者 | `hr candidates/resume/chat/reply/jobs` 等 | RecruiterPlatform，招聘者会话及权限 | 未读取候选人资料 |
| Agent | `schema/boss-mcp`、Python API | 参数自描述、统一 JSON、结构化错误 | 评测器子集，未启 MCP 宿主 |
| 状态和环境 | `doctor/status` | 默认主要看本地，显式 live 才探测 | 未读取现有用户会话 |

## 名称不能替代结果

- `apply` 复用立即沟通端点，不能证明附件送达、已读或招聘转化。
- `match_score` 有固定权重的本地评分，也有模型分析里的评分；都未校准成录用概率。
- “本地模型”指配置与接口，不代表包内附有招聘模型权重。
- 双平台注册表是扩展结构，当前实际只接 BOSS。
- `assisted|research` 是兼容元数据，当前两者开放已实现能力。旧资料中的默认 `COMPLIANCE_BLOCKED` 不能作为当前阻断机制。
- “可恢复”指断点和恢复动作，不会自动恢复被平台限制的账号。

## 固定来源

- [README](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/README.md)
- [能力矩阵](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/docs/capability-matrix.md)
- [命令参考](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/docs/commands.md)
- [搜索入口](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/src/boss_agent_cli/commands/search.py)
- [平台实现](https://github.com/can4hou6joeng4/boss-agent-cli/tree/7f46ba37c654d5f7675bb1328158030d7604847c/src/boss_agent_cli/platforms)
- [apply 实现](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/src/boss_agent_cli/api/client.py#L215)
