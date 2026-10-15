# 006 · GitNexus 代码图谱与影响分析研究

GitNexus 从源码提取符号和跨文件关系，建立可持久查询的代码图谱。CLI、MCP 和网页共享这份索引，用于定位实现、展开调用链、调查变更影响和为编程助手提供上下文。

[中文展示页](web/index.html) · [研究记录](notes.md) · [真实运行报告](references/run-report.md) · [完整数据](web/assets/evidence.json) · [原创样本](src/checkout-lab) · [上游仓库](https://github.com/abhigyanpatwari/GitNexus)

![GitNexus 原理与能力总览，原创研究示意图](assets/cover.svg)

| 项目 | 记录 |
| --- | --- |
| 编号 / 日期 | `006` / 2026-10-15，Asia/Shanghai |
| 实测版本 | npm `gitnexus@1.6.12`；tag SHA `26ddd95685f13d07f3661ef37c7ca1b62d29c409` |
| 源码研究 | 当前主线架构、流程、聚类和混合搜索，与稳定版实测分别标明 |
| 上游许可 | PolyForm Noncommercial 1.0.0；[完整原文](references/UPSTREAM_LICENSE.txt) |
| 网页 | 原生 HTML / CSS / JavaScript / SVG，无运行时外部依赖 |
| 研究范围 | 源码研究和真实小样本输出；未测生产准确率和 AI 任务收益 |
| 在线入口 | [已发布并验证的中文展厅](https://yydshly.github.io/1015_codex_project/projects/006-gitnexus/) |

## 网页内容

- **能力效果展厅**：模块分组、流程展开、符号上下文、影响层级、搜索结果、路径追踪、变更检查七种真实结果回放。可选择流程、筛选命中、展开全图类型及原始 diff。
- **能力清单**：标明已实跑、待实测和扩展条件，覆盖 rename、API / 工具关联、PDG、多仓库及 Wiki / AI 问答。
- **原理**：语法解析、跨文件绑定、LadybugDB 图谱、Leiden 分组与候选流程、混合搜索、MCP 输出六步切换。中间结构明确为教学示意。
- **实际效果**：真实 Function / CALLS 业务子图，点击符号展开邻居、反向调用范围或入口路径，并打开对应源码。
- **证据**：真实指标、检查项、查询 JSON、复现命令与失败边界。浏览器交互静态回放已提取关系，没有启动在线分析服务。
- **对照**：新增 GitNexus / Ix / CodeFlow 三种使用重心、核心区别矩阵、各自优势与场景，以及运费修改、快速浏览、结构追溯、底层研究四种可切换任务；明确能力交集与实测范围，另保留 Graft 研究入口。[完整对比](comparison.md)

## 本次样本与统计口径

原创 `checkout-lab` 包含下单、结算、报价、金额、折扣、运费、库存、客户校验、订单存储和验证程序。报价通过 `shippingCost` 别名使用 `calculateShipping`；库存与客户模块各有一个 `validate`。

实际分析报告 **71 节点 / 131 关系 / 4 社区 / 4 流程**。网页展示与业务有关的 **10 个函数 / 11 条 CALLS 边**。全图包含文件、接口、社区、流程和验证程序；两组数字统计口径不同。图的布局由展示页计算，坐标不是 GitNexus 产物。局部事实核对不等于通用准确率。

业务执行断言与代码图谱断言分别记录。首次 FTS 扩展下载超时，随后提高等待上限修复成功；重跑真实关键词查询返回 4 条流程、1 个流程符号和 13 条定义，修复前后的结果均保存。本次没有启用 embeddings、运行大模型 Wiki 或测量 Agent Token 收益。

## 底层理解

```text
源码 → 单文件 AST → 符号与跨文件目标解析 → LadybugDB 图谱
     → 分组、流程与搜索索引 → CLI / MCP / HTTP → 核对源码和验证
```

AST 描述语法包含关系；图谱用 CALLS、IMPORTS、EXTENDS 等边连接解析后的实体。导入、别名、作用域和类型规则决定连边。关键词及可选语义检索定位候选，图查询补充关系。候选流程不是实际运行轨迹，也没有线上性能信息。

## 既有研究

[Ix](https://github.com/yydshly/1002_codex_project/tree/main/projects/010-ix) 已整理 Tree-sitter、ArangoDB / memory-layer 和 MCP 数据链路，未运行后端。[CodeFlow](https://github.com/yydshly/1004_codex_project/tree/main/projects/002-codeflow) 已运行 15 文件真实样本，曾比较 Source Insight、Ix 和 GitNexus。[Graft](https://github.com/yydshly/0914_codex_project/tree/main/projects/010-graft) 已整理能力，完整构建与总体收益仍待验证。

## 本地预览与发布

在仓库根目录运行：

```powershell
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8096 --bind 127.0.0.1 --directory _site
```

访问 `http://127.0.0.1:8096/projects/006-gitnexus/`。需要通过 HTTP 加载 JSON，双击 HTML 的 file 模式可能被浏览器拦截。发布遵循根目录 docs/deployment.md，不增加所有项目共享的 npm 依赖。

页面、封面、样本和交互代码为本研究原创。[来源清单](references/sources.json) 保留依据；没有把上游引擎打包到网页。上游运行使用隔离安装的固定 npm 包，并保留许可证，不为总仓库选择统一许可。

## 发布验证

内容提交 `488397b` 已推送，[Pages 任务 38745006562](https://github.com/yydshly/1015_codex_project/actions/runs/38745006562) 成功。线上 13 个页面、资源与证据请求返回 200，JS / CSS / 数据在规范换行后与本地一致；桌面 1280px、手机 390px 无页面横向溢出，局部源码与关键词记录交互正常，无控制台错误。本地另验证 320px、12 项交互及静态引用 / 源码快照完整性。

[桌面预览](assets/desktop.jpg) · [手机预览](assets/mobile.jpg) · [本地交互验证](verification.json) · [线上HTTP检查](assets/deployed-verification.json) · [线上浏览器检查](assets/deployed-browser.json)

## 同类对照扩展

[直接打开三工具对照](https://yydshly.github.io/1015_codex_project/projects/006-gitnexus/#compare)：三种使用重心、五维区别、相对优势、能力交集及四种任务切换。新增内容只作功能与实现取舍分析，不形成未验证的准确率排名。

[桌面对照预览](assets/comparison-desktop.jpg) · [手机任务切换](assets/comparison-mobile.jpg) · [11项交互与响应式检查](assets/comparison-verification.json) · [完整对比](comparison.md)

对比扩展内容提交 `43509b6` 已通过 [Pages任务38754225542](https://github.com/yydshly/1015_codex_project/actions/runs/38754225542) 发布；线上16项资源检查与四种任务切换通过，手机无页面溢出和脚本错误。[线上对比验证](assets/comparison-deployed-browser.json)。

## 能力效果展厅

[直接打开七种效果](https://yydshly.github.io/1015_codex_project/projects/006-gitnexus/#showcase)。以同一个真实结算样本展示：

| 展示 | 数据与交互 |
| --- | --- |
| 模块分组 | 4 个真实 Community、12 个成员；展开 71 节点 / 131 关系的类型构成 |
| 流程展开 | 在 4 条 Process 中切换，按真实 STEP_IN_PROCESS 展开 3 或 4 步 |
| 符号上下文 | calculateShipping 的源码、2 个直接调用者和流程参与 |
| 影响层级 | 完整回放 impact 的 4 个返回项，包含 verify.ts 文件 |
| 搜索结果 | 4 流程 + 1 流程符号 + 13 定义；只过滤本次保存结果 |
| 路径追踪 | submitOrder → checkoutOrder → saveOrder，2 跳 |
| 变更检查 | 免邮门槛 100 → 120 元的真实 diff；1 文件、1 符号、1 流程，medium；附完整循环导入检查，结果 0 |

新增采集使用既有隔离索引，没有重新 analyze；只在临时样本中改变一个阈值，在 finally 中恢复原字节。数据库保存基线，detect_changes 读取未提交差异。CLI 的变更报告原本是文本，按原格式保存；showcase.json 是展示投影，不伪装成上游 JSON。4 条流程的相邻步骤均与原业务 CALLS 边核对。

复现及原始材料：[补充运行说明](references/showcase-report.md) · [展示数据](web/assets/showcase.json) · [采集脚本](src/collect-showcase.py) · [转换脚本](src/publish-showcase.py)。页面视图为原创呈现，公开站点静态回放；官方 Web UI 与本地 CLI / MCP 的入口另列于页面。

本地 25 项交互 / 响应式检查通过，包含七种视图、四条流程、18 项真实搜索结果与筛选、原始 diff、键盘 Home / End，以及 390px / 320px 布局；没有控制台错误。[浏览器检查](assets/showcase-verification.json) · [效果预览](assets/showcase-desktop.jpg)。
