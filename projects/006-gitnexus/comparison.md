# GitNexus、Ix 与 CodeFlow：核心区别、优势与场景

核对日期：2026-10-15，Asia/Shanghai。结合既有 Ix / CodeFlow 源码研究、GitNexus v1.6.12 实测，以及本次核对的官方文档。主线文档可能变化，功能描述不代表全部已经运行验证。

## 共同路线与使用重心

三者都从源码中提取结构与关系，再进行查询、计算和呈现。AST、图形布局、持久化和任务接口是不同层，不能用图的复杂程度判断解析质量。

| 维度 | GitNexus | Ix | CodeFlow |
| --- | --- | --- | --- |
| 主要重心 | 围绕符号和开发任务提供上下文 | 持久结构维护、导航与追溯 | 快速浏览结构、源码和报告 |
| 关系 / 展示粒度 | 文件、符号、分组与候选流程 | 符号实体、关系与图谱修订 | 主图以文件关联为中心，附函数信息 |
| 存储 / 运行 | 嵌入式 LadybugDB，本地索引 | Docker 中的 ArangoDB 与 memory-layer | 浏览器分析、摘要缓存与导出；CLI 可提供网页 |
| 更新 | analyze 更新索引，detect_changes 分析 Git diff | map / watch，history / diff 查询图谱修订 | CLI 监听，Card 保存报告和指标历史 |
| 研究实现 | 可追踪解析、图加载、查询和展示源码 | 解析 / CLI 公开，Scala 后端源码私有，运行镜像公开 | 可研究浏览器解析、关系组织、视图与报告 |

依据：[GitNexus 架构](https://github.com/abhigyanpatwari/GitNexus/blob/main/ARCHITECTURE.md)、[Ix README](https://github.com/ix-infrastructure/Ix#how-it-works)、[CodeFlow README](https://github.com/braedonsaunders/codeflow#features)；CodeFlow 主图粒度及缓存边界另见[既有固定版本研究](https://github.com/yydshly/1004_codex_project/tree/main/projects/002-codeflow)。

## 各自较适合的能力

- **GitNexus**：函数上下文、潜在影响、入口路径，以及流程 / 分组参与的结果组织；适合把代码调查作为工具提供给 Agent。相对 CodeFlow，任务查询和符号级交付更突出；相对 Ix，本地运行组件更少，研究者可追踪的后端链路更多。
- **Ix**：持久结构、实体导航、有限上下文、持续更新、实体历史与图谱修订差异；适合长期维护结构事实。它也有调用链、影响分析、MCP、技能和 hooks，不能将这些视作 GitNexus 独有。
- **CodeFlow**：浏览器中快速看文件关系、目录和规模，阅读源码卡片，并导出或持续生成报告；适合接手项目、讲解结构和轻量检查。它也提取函数信息、计算影响候选和提供 JSON，不能将其概括成只会画图。

依据：[GitNexus 工具与接入](https://github.com/abhigyanpatwari/GitNexus#what-your-ai-agent-gets)、[Ix 命令参考](https://github.com/ix-infrastructure/Ix/blob/main/skills/ix/references/commands.md)、[Ix 后端边界](https://github.com/ix-infrastructure/Ix/blob/main/CONTRIBUTING.md#backend-development)、[CodeFlow 导出与 Card](https://github.com/braedonsaunders/codeflow#codeflow-card)。以上是能力和实现取舍的判断，没有三工具同仓库性能排名。

## 四种任务怎样分工

| 任务 | GitNexus | Ix | CodeFlow |
| --- | --- | --- | --- |
| 修改运费规则 | 目标符号 → context / impact / trace → 源码及回归检查 | callers / impact / context → 符号邻域和影响候选 | 选择运费文件 → 关联 / Blast / Code → 相关文件和源码 |
| 快速熟悉仓库 | query、context，结合分组与候选流程 | overview、inventory、subsystems、Compass | Graph、Tree、Treemap、Code 与报告 |
| 持续跟踪结构 | 更新当前索引，调查当前 Git diff | map / watch，实体 history 与图谱 revision diff | 监听当前分析，Card 指标与报告历史 |
| 研究底层实现 | 建图 → 数据库 → 查询 → MCP / HTTP 的公开实现链路 | 公开解析与 CLI；后端使用公开镜像，源码私有 | 浏览器解析、关联计算、交互图和报告生成 |

网页提供四种任务切换。这是分工示意；没有在浏览器实时执行三套分析器。只在“修改运费规则”的 GitNexus 卡片引用本次实测结果：context 确认 checkoutOrder 和 estimateOrder 两个调用者，业务子图可反向展开到 submitOrder。

## 验证范围与取舍

GitNexus 的 11 条预期业务调用、别名与同名消歧、真实关键词检索等结果已保存，见 [run-report.md](references/run-report.md)。CodeFlow 已运行另一套 15 文件样本；Ix 后端未运行。样本与验证口径不同，不可由此得出准确率、速度或 Token 成本排名。

GitNexus 要维护索引并处理原生依赖与扩展；Ix 要管理独立后端；CodeFlow 受到浏览器资源、采样和解析规则限制。图谱修订不等于 Git commit，指标历史不等于版本化符号图；静态调用链也不等于线上 Trace。选择应依据当前任务、可接受的运行组成与需要核对的证据。

[返回展示页](web/index.html#compare) · [研究首页](README.md) · [来源清单](references/sources.json)
