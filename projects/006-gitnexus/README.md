# 006 · GitNexus 代码图谱与影响分析研究

2026-10-19 补充：[核心定位与验证范围](https://yydshly.github.io/1015_codex_project/projects/006-gitnexus/#understanding)。核心是代码知识索引、分析与 AI 工具接入，展示只是其中一种输出。主页面与独立工作台使用相同总结，分开列明小样本已验证、已实跑但存在缺口、尚未验证的能力；12 张能力卡也分别注明验证状态。沿用 2026-10-16 的固定 npm 1.6.12 证据，没有把模型闭环、跨仓库组或真实大型项目收益标为已验证。

本次总结及缓存更新已通过 [Pages 任务 39208538994](https://github.com/yydshly/1015_codex_project/actions/runs/39208538994) 发布。12 项本地浏览器检查覆盖三层定位、三类证据、展开／键盘折叠、12 张能力卡、桌面及 390px／320px 布局与原有导览；线上 41 项资源与文本核对通过，12 张状态标签与本地一致，无脚本错误。保留标签页曾缓存旧工作台脚本，已为脚本与内嵌页面添加版本参数并复核。[本地检查](assets/positioning-local-verification.json) · [线上检查](assets/positioning-deployed-browser.json) · [总结截图](assets/positioning-desktop.jpg)。

GitNexus 从源码提取符号和跨文件关系，建立可持久查询的代码图谱。CLI、MCP 和网页共享这份索引，用于定位实现、展开调用链、调查变更影响和为编程助手提供上下文。

[中文展示页](web/index.html) · [研究记录](notes.md) · [真实运行报告](references/run-report.md) · [完整数据](web/assets/evidence.json) · [原创样本](src/checkout-lab) · [上游仓库](https://github.com/abhigyanpatwari/GitNexus)

![GitNexus 原理与能力总览，原创研究示意图](assets/cover.svg)

| 项目 | 记录 |
| --- | --- |
| 编号 / 日期 | `006` / 2026-10-15，Asia/Shanghai |
| 实测版本 | 固定 npm `gitnexus@1.6.12`，gitHead `c4ecf398…`；文档参考 tag `26ddd956…`，二者源码等价关系未建立 |
| 源码研究 | 当前主线架构、流程、聚类和混合搜索，与稳定版实测分别标明 |
| 上游许可 | PolyForm Noncommercial 1.0.0；[完整原文](references/UPSTREAM_LICENSE.txt) |
| 网页 | 原生 HTML / CSS / JavaScript / SVG，无运行时外部依赖 |
| 研究范围 | 源码研究和真实小样本输出；含独立 API / PDG / rename 实跑；未测生产准确率和 AI 任务收益 |
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

内容提交 `ea933ca` 已通过 [Pages 任务 38762226140](https://github.com/yydshly/1015_codex_project/actions/runs/38762226140) 发布。线上 24 项资源与数据核对通过，七种效果、流程选择、搜索与 390px 布局正常，没有控制台错误。[线上浏览器记录](assets/showcase-deployed-browser.json) · [手机效果](assets/showcase-mobile.jpg)。

## 完整能力工作台 · 2026-10-16

[独立工作台](https://yydshly.github.io/1015_codex_project/projects/006-gitnexus/assets/atlas.html) · [主页面内嵌入口](https://yydshly.github.io/1015_codex_project/projects/006-gitnexus/#explorer)

以联动图谱取代分散的静态结果介绍。原七种档案和简单函数图保留在折叠区，新的主入口是完整工作台，支持 12 步导览与手机能力选择器。

| 体验 | 能实际操作和看到什么 |
| --- | --- |
| 整仓地图 | 全部 71 实体 / 131 关系；切换文件依赖与业务调用视角、查找、聚焦邻居、缩放和平移 |
| 功能模块 | 4 个分组和成员与图联动；说明分组不等同目录 |
| 调用上下文 | 为 10 个业务函数分别实跑 context；点选切换调用者、被调用者、流程与源码 |
| 流程追踪 | 4 条流程逐步播放；点步骤定位源码；另有真实 trace 到存储路径 |
| 修改影响 | 10 个函数的实际 impact；切换目标、层级和返回项，含验证入口 |
| 检索定位 | 3 次 FTS 查询；流程 / 符号 / 定义命中可定位到图与源码 |
| 提交检查 | 免邮规则 diff 联动函数与流程；5 个业务探针真实比较修改前后金额 |
| 重命名预览 | 高级样本 4 文件 / 5 候选，graph 与 text_search 分别显示；点差异定位源码，无文件写入 |
| API 与工具 | 3 路由、客户端与处理器、receiptId 字段偏差、接口影响、Python MCP 工具；明确参数 URL 未关联 |
| 语句与数据流 | --pdg 的 7 条控制依赖、3 条变量依赖；直接、编码、跨函数、回调四种传播对照，回调明确漏报 |
| 交给 AI | 用真实工具结果逐步讲解 query → context → impact → detect_changes → 验证和更新索引；未调用 LLM |
| 能力全景 | 补齐 embeddings、仓库组、Wiki、索引维护等入口和条件，未运行部分明确说明 |

高级样本实跑为 103 节点 / 154 关系，与基础样本分开保存。API / PDG 为 verified-with-gaps；空结果不能证明不存在关联。npm 分发 gitHead 与 GitHub 文档 tag 不同，不能将源码等价关系当作已证实。

[完整图谱与金额探针报告](references/atlas-report.md) · [高级运行报告](references/advanced-run-report.md) · [高级原始数据](web/assets/advanced.json) · [高级原创源码](src/advanced-lab)

本地 61 项浏览器交互与响应式检查通过，涵盖图谱视角、查找、缩放、平移、分组、上下文、流程播放、分层影响、搜索与源码、diff 与金额探针、改名差异、API 字段、语句依赖、四种污点对照、12 步导览、390px / 320px 全部模式，以及主页面内嵌联动；没有脚本错误。[交互检查](assets/atlas-verification.json) · [数据与源码完整性](assets/atlas-integrity.json)。

工作台内容提交 `4821707` 已通过 [Pages 任务 38768846028](https://github.com/yydshly/1015_codex_project/actions/runs/38768846028) 发布。线上 39 项资源与文本 / 数据一致性检查通过，12 类能力及 API 字段、PDG 源码、手机流程共 15 项浏览器检查通过，无脚本错误。[线上检查](assets/atlas-deployed-browser.json) · [整仓地图](assets/atlas-desktop.jpg) · [API 字段联动](assets/atlas-api.jpg) · [PDG](assets/atlas-pdg.jpg) · [手机](assets/atlas-mobile.jpg)。
