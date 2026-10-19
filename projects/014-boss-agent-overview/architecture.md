# 技术原理与风险：接口、浏览器与本地处理

核查日期：2026-10-20。以下描述固定快照 [`4716ee1`](https://github.com/can4hou6joeng4/boss-agent-cli/tree/4716ee1d211533db70ac7cc1ab2322eb269b43a0)，不推定后续版本行为相同。来源文件与哈希见 [sources.json](references/sources.json)。本轮只访问公开 GitHub 源码，未使用 BOSS 账号或模型服务。

可配合 [一图总览](assets/boss-agent-panorama.png) 或 [SVG 矢量版](assets/boss-agent-panorama.svg) 阅读。

## 结论：API 和浏览器不是互斥选项

这个库的主要数据入口是 BOSS **网页内部接口**，访问条件包括登录态、页面令牌、账号权限和环境校验。源码中没有看到官方开放平台的开发者授权接入，不能据此把它称为 BOSS 官方 API SDK。

“API”描述数据请求接口；“浏览器 / httpx”描述执行请求的环境。浏览器也可以在页面内执行 `fetch` 调用接口并取得 JSON。CLI、Python API 和 MCP 则是这个库提供给调用者的入口，不会增加对平台的访问权限。

典型流程为：正常登录 → 按会话模式选择 HTTP 或浏览器通道 → 网页接口 JSON → 业务字段适配、规则与本地 SQLite → 可选模型分析 → CLI / MCP 输出。

## 三种主要平台取数路径

| 路径 | 如何工作 | 数据来源 | 主要限制 |
| --- | --- | --- | --- |
| HTTP 客户端 | Python httpx 使用 AuthManager 提供的 Cookie、Token 和请求头 | 网页内部接口的 JSON | 仅适用允许 HTTP 的会话；凭据有效也可能被拒绝 |
| 浏览器内请求 | CDP / Patchright 驱动已登录页面执行 fetch，携带页面会话 | 同源网页内部接口的 JSON | 仍受服务端风控；依赖浏览器、页面会话与令牌 |
| 页面驱动与网络监听 | 专用 crawl 用 DrissionPage 打开职位页、滚动加载，监听 joblist 响应 | 首选网络响应 JSON；必要时页面内 fetch | 依赖页面行为、监听与加载状态；风险停止不可当成可随意换通道的普通失败 |

[HTTP 客户端及路由](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/api/_base_client.py#L261-L279)、[浏览器执行层](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/api/browser_client.py)、[crawl 监听及回退](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/crawler/transport.py#L204-L272)。

因此，“浏览器抓取”需要进一步拆开：它可以指驱动页面后监听请求，也可以指在页面里主动请求接口，还可能指提取 DOM 文本。此库的上述职位取数主路径是 **JSON**；页面 / DOM 主要辅助导航、滚动加载、容器与风险状态检查，不能笼统描述成逐条抓取职位卡片或识图点击。另有部分招聘者操作使用现有聊天页的 JS 运行时，参见 [evaluate_js](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/api/browser_client.py#L697-L725)。

## 命令与方法的路由差异

- `search_jobs`、`recommend_jobs` 直接调用 `_browser_request`，在网页环境请求接口。[搜索与推荐源码](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/api/client.py#L165-L206)
- `job_detail` 调用 `_request`，由当前模式决定是否转到浏览器；`job_card` 在允许 HTTP 时先尝试 httpx，普通异常可回退浏览器，风险停止异常直接抛出。不是所有失败都换通道。[详情与卡片源码](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/api/client.py#L226-L259)
- 显式 CDP、非 auto 浏览器来源，或已经连接 CDP 的会话，都会触发 `is_browser_only`。`_request` 转浏览器；`_get_client` 阻止继续用 httpx 携带这类浏览器凭据。源码解释这用于避免混用环境造成令牌异常，并不证明平台不会限制浏览器通道。[模式判断](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/api/_base_client.py#L106-L123)、[请求分流](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/api/_base_client.py#L342-L352)
- `crawl` 先监听职位列表响应，普通监听失败可退到页面内 fetch；详情也在采集页签内 fetch `job/card.json`，不回退到进程内 httpx。[详情与滚动](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/crawler/transport.py#L380-L410)
- `greet`、`apply` 是浏览器内 POST。当前 `apply` 最小实现复用立即沟通端点，不能仅凭命令名认定附件简历已成功送达。[沟通写操作](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/api/client.py#L208-L224)
- 候选池离线比较、词表判断等在本地处理已保存数据。刷新、搜索或补查详情是额外的平台访问。[能力矩阵](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/docs/capability-matrix.md)
- AI 服务把简历 / JD 等输入发到配置的 `/chat/completions`，可指向外部或本地模型。这是另一套模型 API，不是 BOSS 的职位数据入口。[模型服务请求](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/ai/service.py#L57-L65)

## 风险、已有控制与剩余边界

| 风险 | 源码中可见的控制 / 建议核对 | 仍然不能保证什么 |
| --- | --- | --- |
| 账号、IP、频率与环境风险 | 分类处理平台业务码、HTTP 403 / 429、安全验证页；节流、预算、冷却与风险锁 | Cookie 有效、使用浏览器或减慢速度均不保证平台放行；没有实测封禁率 |
| 登录态过期与令牌异常 | 401 提示认证失效；根据上下文分类令牌响应；browser-only 避免混用凭据 | code 37 不能一律认定为可自动刷新；重新登录不保证解除风险 |
| 内部接口和页面变化 | 固定版本、检查业务码和返回结构，少量样本核对；保留明确错误 | 路径、字段、令牌、页面运行时及浏览器行为没有本研究验证的稳定契约 |
| 敏感会话与个人资料 | 限制会话文件、浏览器目录、本机调试端口、SQLite 和导出的访问范围；避免写入 Git / 日志 | 开源许可不扩大账号权限，也不授权任意保存或再分发平台和个人数据 |
| 写操作结果不明或重复 | 仅适用且标注 replay_safe 的请求允许自动重试；根据远端记录核对结果 | 超时不代表未发送；写操作重复调用可能重复执行；apply 不证明完整投递 |
| 模型资料传输、费用与幻觉 | 核对配置端点与输入范围，必要时脱敏或使用本地服务；结论回查原文 | 启用 AI 不代表资料留在本机，也不保证分析准确或给出录用概率 |
| 职业探索中的样本偏差 | 记录关键词、城市、时间、过滤条件、原文和去重规则，补从业者资料 | 个性化搜索和少量 JD 不能代表整个市场，也不能替代真实工作体验 |

HTTP 通道的重试开关与 `replay_safe` 约束可见 [_request](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/api/_base_client.py#L342-L352)；风险检查见同文件后续分支以及 [上游风险说明](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/docs/platform-risk.md)。浏览器请求不继承整套 httpx 刷新重试循环，参见 [_browser_request](https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/src/boss_agent_cli/api/client.py#L125-L157)。

实际使用前应核对平台现行规则、账号权限及相应数据处理授权。本研究没有对现行条款作法律结论，也没有给出规避平台风控的操作方案。

## 本页验证范围

网页新增六个请求场景的离线路径说明、七行操作对照和六类风险说明。场景切换只更新本地内容；原来的岗位筛选和职业画像仍使用合成数据。源码核查、合成演示和真实账号测试是不同证据层级，不能互相替代。

浏览器和资源核对记录见 [verification.json](verification.json)；入口见 [README](README.md)。
