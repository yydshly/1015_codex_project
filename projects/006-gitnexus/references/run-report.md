# GitNexus v1.6.12 原创样本实跑

本页记录 2026-10-15 的真实本地输出。网页只读取已保存的结果；浏览页面不会运行 GitNexus，也不会把输入发送给远程服务。

## 版本与环境

- 上游：<https://github.com/abhigyanpatwari/GitNexus>
- 固定 tag：`v1.6.12`；Git SHA：`26ddd95685f13d07f3661ef37c7ca1b62d29c409`。
- npm：`gitnexus@1.6.12`；依赖锁定记录：[runtime-package-lock.json](runtime-package-lock.json)。
- Windows x64，Node.js `v24.19.0`，npm `10.9.2`，LadybugDB `0.18.3`。
- 原创样本：`src/checkout-lab/`，12 个被索引文件，其中 11 个 `.ts` 和 1 个 `package.json`。
- 上游许可证：PolyForm Noncommercial 1.0.0；完整原文见 [UPSTREAM_LICENSE.txt](UPSTREAM_LICENSE.txt)。研究网页及样本未复制上游运行时代码。

## 实际结果

| 项目 | 真实输出 |
| --- | --- |
| 整体图谱 | 71 个节点、131 条关系 |
| 函数调用子图 | 10 个函数、11 条 `CALLS` |
| 自动聚类与流程 | 4 个 cluster、4 个 flow |
| 分析时间 | 22.4 秒（分析器报告的时长，不含 npm 安装与完整进程启动） |
| 嵌入向量 | 0；未运行 LLM、Wiki 或 PDG |
| BM25 检索 | FTS 修复后正常；4 条流程、1 个流程符号、13 条定义 |
| 本地图数据库文件 | 5,160,960 字节，临时样本的 `.gitnexus/lbug` |
| 预先枚举的业务调用 | 11/11 出现在函数子图中 |
| 业务行为验证 | 3 个报价/下单案例通过；2 个非法输入拒绝断言通过 |

输入的购物结算流程为 `submitOrder → checkoutOrder → calculateSubtotal / applyDiscount / calculateShipping / reserveStock / saveOrder`，报价入口 `estimateOrder` 用 `shippingCost` 别名导入 `calculateShipping`。`customer.validate` 与 `inventory.validate` 同名，用于核对消歧。

11/11 是本次小样本、预先定义的有限调用集合核对结果，不是总体准确率，也不是对大型仓库的性能保证。

## 各工具实际返回

- [context.json](context.json)：`calculateShipping` 的两个直接调用者为 `checkoutOrder`、`estimateOrder`，并返回符号源码及所属静态流程。
- [impact.json](impact.json)：上游第 1 层为上述两个函数，第 2 层为 `submitOrder` 和 `verify.ts`，共 4 个受影响符号/文件。`verify.ts` 被当作普通入口文件纳入；影响范围不等于一定发生行为错误。
- [trace.json](trace.json)：`submitOrder → checkoutOrder → saveOrder`，2 跳。
- [customer-context.json](customer-context.json)、[inventory-context.json](inventory-context.json)：两个 `validate` 的调用者分别是 `submitOrder` 和 `reserveStock`；未见交叉误连。
- [graph-nodes.json](graph-nodes.json)、[graph-edges.json](graph-edges.json)：原始 Cypher 返回 Markdown 表格，本项目仅将这些行转换为网页节点与边，没有补写不存在的调用。
- [query.json](query.json)：检索 `shipping checkout order`，FTS 修复后实际返回 4 条流程、1 个流程符号（`checkoutOrder`）和 13 条定义；当前结果无 warning。修复前的真实空结果与 warning 保留在 [query-before-repair.json](query-before-repair.json)。
- [business-checks.json](business-checks.json)：本地/优惠、异地运费、满额包邮三个案例，订单总额分别为 5900、6600、10800 分，且报价与下单一致。

Cypher 返回的 `startLine`/`endLine` 及本版本 `trace` 行号从 0 开始；`context` 行号从 1 开始。网页节点统一加 1 后显示，原始输出保持不变。边 `confidence=0.85` 是工具给出的解析置信度，不能解释为经验准确率。

## 安装过程与限制

工具只安装在隔离临时目录 `<LAB>`；样本复制到该目录并独立 `git init`。`GITNEXUS_HOME=<LAB>/home` 隔离注册表，未运行 `setup`，未对研究仓库运行 `analyze`。`--index-only --no-stats` 避免注入 AGENTS/CLAUDE/skills；上游仍在临时样本写入 `.gitnexus` 内的索引和 runner。

第一次用 `--omit=optional` 安装时，LadybugDB 的 Windows 平台二进制也是 optional dependency，因此被一同省略，随后回退源码构建失败。解决方式是在忽略脚本安装主体后，显式安装 `@ladybugdb/core-win32-x64@0.18.3`，再运行其二进制激活脚本。Node 24 ABI 不是该失败的原因。曾在安装未完成时启动一次分析，被上游运行时身份检查拒绝；最终结果来自安装全部结束后的成功分析。

FTS 扩展初次安装超过上游默认的 15000ms，图谱索引成功，BM25 搜索未建立；随后将上限提高到 45000ms，执行一次 `--repair-fts` 后明确返回 `FTS indexes repaired successfully`，见 [repair-fts.stdout.txt](repair-fts.stdout.txt)。成功修复后重新运行所有查询，当前网页展示修复后的真实输出。未启用 embedding，因此本实验不能展示语义检索命中。

## 复现

建议在新临时目录复现，使用符合包要求的 Node：`^22.18.0 || >=24.11.0`。以下记录与本次成功运行方式一致；所有命令在临时目录执行，不需要全局安装。

```powershell
# <LAB> 为独立临时目录；node 指向 Node v24.19.0。
npm install --prefix <LAB> --ignore-scripts --omit=optional --no-audit --no-fund gitnexus@1.6.12
npm install --prefix <LAB> --ignore-scripts --omit=optional --no-audit --no-fund @ladybugdb/core-win32-x64@0.18.3
node <LAB>/node_modules/@ladybugdb/core/install.js
node <LAB>/node_modules/gitnexus/scripts/build-tree-sitter-grammars.cjs
# 将 src/checkout-lab 复制到 <LAB>/checkout-lab，再在该副本 git init、git add、git commit。
$env:GITNEXUS_HOME = '<LAB>/home'
$env:SCARF_ANALYTICS = 'false'
node <LAB>/node_modules/gitnexus/dist/cli/index.js analyze <LAB>/checkout-lab --index-only --no-stats
# 若出现相同 FTS 超时，按本次实际方式提高上限后修复：
$env:GITNEXUS_LBUG_EXTENSION_INSTALL = 'auto'
$env:GITNEXUS_LBUG_EXTENSION_INSTALL_TIMEOUT_MS = '45000'
node <LAB>/node_modules/gitnexus/dist/cli/index.js analyze <LAB>/checkout-lab --repair-fts --index-only --no-stats
node --experimental-strip-types <PROJECT>/src/checkout-lab/verify.ts
python <PROJECT>/src/collect-evidence.py --node <NODE_EXE> --cli <LAB>/node_modules/gitnexus/dist/cli/index.js --lab <LAB>
```

Windows 平台包名称专用于本次 Windows x64 环境，其他系统应使用对应平台包或正常安装 optional dependencies。全部查询命令、退出码和查询耗时见 [commands.json](commands.json)，成功分析的原文见 [analyze.stdout.txt](analyze.stdout.txt)，索引元数据见 [analyze-metadata.json](analyze-metadata.json)。导出的输出已将用户目录与绝对临时路径替换为占位符。

`src/publish-evidence.py` 将已采集的 Cypher 表格和查询 JSON 规范化为 `web/assets/evidence.json`；这是展示格式转换，不是第二套静态分析实现。
