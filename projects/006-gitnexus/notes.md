# 研究与验证记录

日期：2026-10-15，Asia/Shanghai。

## 研究目标与来源

把能力、实现和实际输出联系起来。主线功能说明、固定版本实测、教学示意、社区评测分别标明。来源为 README、ARCHITECTURE、process-processor、community-processor、hybrid-search、known-gaps 和 Discussion #3493；链接保存在 references/sources.json。

核心链路：AST / 语言规则提取并解析符号与引用，构建本地 LadybugDB 代码图；Leiden 分组和有预算的遍历组织模块与候选流程；关键词与可选向量检索定位；CLI、MCP、HTTP 共享查询后端。静态流程不包含实际分支、调用次数或 CPU 耗时。

## 实际执行

原创 checkout-lab 复制到临时仓库运行，避免 analyze 修改本研究仓库的 AGENTS.md / CLAUDE.md 或全局配置。没有运行 setup，没有将根仓库接入 MCP。固定 npm `gitnexus@1.6.12`，tag SHA `26ddd95685f13d07f3661ef37c7ca1b62d29c409`，使用独立 Node 24 运行时。

LadybugDB 平台二进制需要保留；不能通过 omit optional 仅跳过向量模型依赖。安装恢复、环境、命令、原始输出和最终结论以 [run-report.md](references/run-report.md) 为准。

已观察的分析值为 71 节点、131 关系、4 社区、4 流程。业务子图为 10 函数、11 CALLS，11 条预期调用全部出现，同名 validate 正确区分。context(calculateShipping) 返回 checkoutOrder 与 estimateOrder。impact 全图还包含 verify.ts 的调用，不能将全图结果直接与网页筛选后数量比较。

首次全文搜索扩展下载超时，空查询与 warning 不代表相关代码不存在。一次将下载上限提高到 45 秒的修复成功，重新查询返回 4 条流程、1 个流程符号、13 条定义且没有 warning；保留了失败与恢复两份证据。最终共 7 项核对通过。本次未启用 embeddings，未运行大模型 Wiki、自动源码改写、安全准确率或生产仓库收益测量。

## 展示边界

- 首页：按原创样本绘制的关系概览，坐标是展示设计。
- 六步原理：教学结构和简化代码，不当作真实工具输出。
- 交互图：读取实际提取的业务函数 CALLS；过滤、反向 BFS 和路径 BFS 在浏览器执行。
- 原始输出：直接显示采集的查询 JSON，保留无结果和告警。
- 源码：本次原创 TS 样本，供核对导入、别名、同名函数和位置。
- 社区评测：v1.6.12 的公开记录，多数单元 n=1；不等同于本研究实测，也不外推到全部模型。

## 网页验证与发布

验证故事：打开页面 → 加载 evidence.json → 选择符号和模式 → 从真实边派生局部关系 → 查看源码与原始查询 → 核对复现边界。

检查静态资源、桌面 / 手机布局、三种图模式、无匹配和重置、源码、六步页签键盘操作、输出选择器、折叠面板。结果记录在 verification.json 和截图中。静态展示没有在线数据库写入。

构建沿用 scripts/build_web.py，输出 `_site/projects/006-gitnexus/`。发布遵循 docs/deployment.md，仅在成功部署并验证后填写真实 demo_url。

发布完成：内容提交 `488397b`，Pages 任务 `38745006562` 成功。线上13项HTTP检查、桌面/手机与关键交互通过；数据与本地一致（文本按LF规范换行比较），记录在 assets/deployed-verification.json 与 assets/deployed-browser.json。索引已在部署并验证后回填真实地址。
