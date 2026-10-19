# 会话访问、业务处理与风控边界

## 五层分工

1. **会话**：AuthManager 管理用户登录。Cookie、`__zp_stoken__` 和页面环境影响可用性；凭据有效不保证接口权限与风控均通过。
2. **请求**：httpx 直接请求适用端点。浏览器通过 CDP / Patchright 执行页面 `fetch`，利用网站正常 JS 环境。CDP 是浏览器调试协议，不是 BOSS 服务端特权通道。
3. **业务**：转换职位字段、执行筛选；SQLite 保存缓存、候选池、预算和断点。
4. **可选 AI**：将简历、JD 放入提示词，调用配置的模型服务。普通搜索、词表筛选不需要大模型。
5. **工具输出**：统一 JSON，附带分页、错误、恢复动作和 run ID，方便人或 Agent 继续任务。

[API 客户端](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/src/boss_agent_cli/api/client.py) · [页面 fetch](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/src/boss_agent_cli/api/browser_client.py#L78) · [AI service](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/src/boss_agent_cli/ai/service.py)

## 福利算法与实验

`双休` 展开为 `[双休, 周末双休, 五天工作制, 5天工作制]`。单项福利的任一关键词出现在标签或描述中即满足；多项福利必须全满足。先检查标签，再补查详情。

`src/upstream_welfare.py` 按 AST 符号范围逐字摘录，来源行号与哈希见 `references/source-manifest.json`。网页 JS 为该算法移植，验证脚本对全部语义探针及 3 个城市 × 4 种福利组合交叉核对 Python 原始函数。

10 个有意构造的探针中有 4 个语义不一致：“不提供双休”“目前不是双休”“五险一金暂不提供”误命中，“周末休两天”漏判。该比例不是实际岗位准确率。人工标注仅属于合成案例，不是网页实现了语义理解。

本地固定规则评分也不能解释为录用概率。否定识别、承诺时效、证据片段和“未知”状态是可研究的改进方向，本轮没有修改上游规则。

## 风控可以阻断访问

以下是项目适配器的错误分类，不能当作平台官方全部风控规则。

| 状态 | 项目处理 | 边界 |
| --- | --- | --- |
| 登录失效 | 认证错误、恢复动作；部分 httpx 路径支持刷新 | 不保证刷新成功 |
| 账号风险 `36` | AccountRiskError，停止流程 | 不应无界换通道重试 |
| 环境风险类 `37` | EnvironmentRiskError，记录 CDP 本地锁 | 同码还需区分 token_expired 分支 |
| 本地锁 | 比较 Token 摘要；同值、未知、损坏时拒绝继续 | 只能本地阻止，不能解服务端风控 |
| 限流/预算耗尽 | 有界处理或停止，保留状态 | 没有绝对安全频率保证 |

原始 `RiskLock.matches` 的四例说明：同摘要保持锁定；不同摘要不匹配；读不到当前摘要时保持锁定；损坏锁保持锁定。测试只用合成字符串。摘要变化只改变本地判断，后续仍可能被 BOSS 拒绝。

频率控制包含随机延迟、突发惩罚与 SQLite 跨进程预约预算，缓存减少重复请求。逐个查详情增加访问量；`online` 与近期活跃条件的请求成本不同。没有公开证据能推导“每分钟多少次绝对安全”。

[错误停止分支](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/src/boss_agent_cli/api/client.py#L108) · [风险锁](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/src/boss_agent_cli/api/cdp_risk_lock.py) · [风险说明](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/docs/platform-risk.md)

## 效果证据与文档时效

公开 fixture 主要检查调用参数、JSON 形状、ID 流转和错误恢复，不是在线稳定性、招聘匹配质量或转化基准。历史一次搜索成功也不能证明今天同账号同端点仍可用。

部分旧注释/评测仍提默认 `COMPLIANCE_BLOCKED`；当前 README 和风险文档明确两种模式开放已实现功能。研究采用当前执行路径与能力说明，避免把旧注释当有效防护。
