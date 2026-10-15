# GitNexus 高级能力实跑记录

本实验使用固定 `npm:gitnexus@1.6.12` 分发包，对独立原创 `advanced-lab` 建库；未修改基础 `checkout-lab` 的索引或记录。结果由 GitNexus 自己生成，网页只读取保存后的 JSON。

## 版本口径

**npm 分发包与 GitHub tag 的提交号不同，不能将两者认作同一份源码。**

| 内容 | 值 |
| --- | --- |
| 实际运行分发包 | `gitnexus@1.6.12` |
| npm 包 `gitHead` | `c4ecf398de637cf779ab2238e69958cfd5d601ce` |
| 文档参考 tag | `v1.6.12` |
| GitHub tag SHA | `26ddd95685f13d07f3661ef37c7ca1b62d29c409` |
| 平台与运行时 | Windows x64，Node.js `24.19.0`，LadybugDB `0.18.3` |
| 授权文本 | [PolyForm Noncommercial 1.0.0](UPSTREAM_LICENSE.txt) |

npm 的完整 integrity、核对命令和来源地址见 [advanced-provenance.json](advanced-provenance.json)；依赖实际锁定记录见 [runtime-package-lock.json](runtime-package-lock.json)。公开 GitHub compare API 对 npm 的 gitHead 返回 HTTP 404，因此源码等价关系尚未建立。所有本页运行结果均指锁定的 npm 分发包。

## 样本与索引

样本为 12 个原创文件：10 个 TypeScript 文件、1 个 Python 文件和 `package.json`。它包括 3 个 Express 风格 API 注册点、3 个客户端函数、运费计算、Python FastMCP 工具，以及只供静态分析的污点示例。Express/FastMCP 依赖没有安装到样本，也没有启动 HTTP/MCP 服务；安全示例未执行。

使用 `analyze --pdg --index-only --no-stats` 后，分析器报告 **103 节点、154 关系、2 聚类、0 流程，37.8 秒**。其中 57 个 BasicBlock、14 个 Function、3 个 Route、1 个 Tool；关系包括 45 条 CFG、42 条 REACHING_DEF、7 条 CDG、1 条 TAINTED、1 条 SANITIZES 和 1 条 TAINT_PATH。0 流程是本次自动流程启发式的实际结果，不补写流程。

原文见 [advanced-analyze.stdout.txt](advanced-analyze.stdout.txt)，元数据见 [advanced-metadata.json](advanced-metadata.json)，图谱原始行见 [advanced-graph_nodes.json](advanced-graph_nodes.json) 与 [advanced-graph_edges.json](advanced-graph_edges.json)。

## 重命名预览

调用 `rename`，将 `calculateShipping` 改为 `computeShippingFee`，`dry_run=true`：

- 4 个文件、5 处修改建议。
- 4 处标为 `graph`：定义、普通导入、调用、别名导入。
- 1 处标为 `text_search`：`notes.ts` 的说明字符串。
- `applied=false`，全部 12 个样本文件的前后 SHA-256 完全相同。

完整旧行、新行、位置和分类见 [advanced-rename.json](advanced-rename.json)；不写源码的核对见 [advanced-rename-integrity.json](advanced-rename-integrity.json)。这是预览验证，没有应用重命名。图标签是在文件级别分配，随后逐行文本替换，不能视作语言服务器的逐引用语义保证。

## API 与 MCP 工具

`route_map` 发现 `POST /api/orders`、`GET /api/orders/:id`、`GET /api/health`。订单创建接口关联到 `client/create-order.ts`，响应字段为 `orderId`、`total`、`status`，消费者却读取 `receiptId` 与 `total`。

`shape_check` 正确报告 `receiptId` 的 `MISMATCH`；`api_impact` 返回 1 个直接消费者、`MEDIUM` 风险及相同字段偏差。`tool_map` 发现 Python 的 `quote_shipping` 与其文档说明。

实际缺口同样保留：`GET /api/orders/:id` 没有连接字面量 `/api/orders/42` 的消费者，也没有连接变量拼接 URL 的消费者。不能据此认为该路由无人使用。所有路由的 `runtimeEvidence.confirmed=false`，均为静态观察。

原始输出：[route_map](advanced-route_map.json)、[shape_check](advanced-shape_check.json)、[api_impact](advanced-api_impact.json)、[tool_map](advanced-tool_map.json)。

## PDG 与污点

`pdg_query(mode="controls", target="calculateShipping")` 返回 7 条控制依赖，包括负金额时的提前 throw 与 T/F 分支。`pdg_query(mode="flows", variable="shipping")` 返回 3 条定义到第 10 行 return 的数据依赖，分别来自第 3、5、8 行赋值。

`impact(mode="pdg", line=5)` 返回 3 条上游局部语句，并通过明确标为 `callgraph-bridge` 的符号图兼容层附带 2 个跨函数调用者。局部语句 PDG 证据与跨函数符号桥接证据应分别解释。

`explain` 返回 2 个污点发现：

1. `unsafePreview`：第 3 行 `req.query` → 第 4 行 `html` → 第 5 行 `res.send`，类型 `xss`。
2. `wrappedPreview → sendPreview`：跨函数污点链，原始结果标有 `interprocedural=true`。

`safePreview` 使用 `encodeURIComponent`，本次没有 XSS 发现，图中有 SANITIZES 关系。`callbackPreview` 同样将请求数据传到回调中的 `res.send`，却没有发现；这是特意保留的漏报对照，不能把空结果当成安全证明。

原始输出：[controls](advanced-pdg_controls.json)、[flows](advanced-pdg_flows.json)、[PDG impact](advanced-pdg_impact.json)、[explain](advanced-explain.json)、[sanitized](advanced-explain_safe.json)、[callback](advanced-explain_callback.json)。

## 行号与展示图

Cypher 中 Function 等符号的行号从 0 开始，展示数据加 1；BasicBlock 和 PDG 语句行号已经从 1 开始。BasicBlock 没有数据库名称，因此页面名称取对应原始源码片段，ID、关系、文件和行区间保持可追溯。原始 JSON 不修改。

该版本 `explain` 的跨函数发现中，函数行号仍为 0 基：raw 的 `wrappedPreview=17`、`sendPreview=13` 对应编辑器第 18、14 行；函数图节点统一显示为 1 基。函数内污点 hops（3、4、5）本身为 1 基。

`web/assets/advanced.json` 的 `graphs.all` 保存完整 103/154 图，`views.rename`、`views.api`、`views.pdg` 是从真实节点和边中选出的子图，未生成额外调用或依赖边。API 与 PDG 视图标为 `partial`，同时展示成功与漏报案例。

## 复现方式

先按基础实跑记录安装锁定 npm 包。将 `src/advanced-lab` 复制到独立临时目录 `<LAB>/advanced-lab`，在副本中 `git init` 并提交。以下环境变量只作用于当前研究进程：

```powershell
# 必须先创建 <LAB>/advanced-identity-cache；不要放在 node_modules 内。
$env:GITNEXUS_HOME = '<LAB>/advanced-home'
$env:GITNEXUS_ANALYZER_IDENTITY_CACHE_DIR = '<LAB>/advanced-identity-cache'
$env:GITNEXUS_ANALYZER_IDENTITY_IN_PROCESS_GUARDS = '1'
$env:CI = '1'
$env:SCARF_ANALYTICS = 'false'
$env:NO_COLOR = '1'
node --max-old-space-size=8192 --max-semi-space-size=128 --stack-size=4096 <LAB>/node_modules/gitnexus/dist/cli/index.js analyze <LAB>/advanced-lab --pdg --index-only --no-stats
node <PROJECT>/src/collect-advanced.mjs <LAB>/node_modules/gitnexus <LAB>
python <PROJECT>/src/collect-advanced.py
```

第一次启动在 Windows 默认不持久化身份缓存的条件下耗时较长，尚未建立索引时主动终止；最终成功运行采用上游已有的缓存目录选项与进程内 guard 选项，并显式传内存参数，避免自动重启重复扫描。身份校验没有被跳过，元数据保留实际 runner/dependency 指纹。

采集器调用的是 MCP 使用的同一个公开 `LocalBackend.callTool` 方法，省略 MCP 传输层；每个方法、精确入参、耗时及原始输出路径见 [advanced-commands.json](advanced-commands.json)。未运行 `setup`，未修改用户全局配置，未使用密钥、付费模型、embedding、Wiki 或网络上的真实 API。所有导出内容已将用户目录与绝对临时路径脱敏。
