# 从 Agent 记录到模型用量账本

## 主链路

`输入来源 → 格式读取器 → 单次增量记录 → 去重 / 口径校正 → 模型价格 → 时间与模型汇总`

输入是客户端已经留下的数据。读取器负责理解该客户端的格式、单位、模型归属和计数语义；标准记录之后的汇总和计价才能共享。

## Claude Code

读取 `~/.claude/projects` 的会话 JSONL，选择 `type=assistant`，取 `message.model` 与 `message.usage`。usage 中读取 `input_tokens`、`output_tokens`、`cache_read_input_tokens`、`cache_creation_input_tokens`，还保留一小时缓存写入的子分类。

同一个 `message.id` 可能在多个内容块行里反复出现，计数逐渐更新。实现按 ID 保留最后计数，跨文件再排除历史副本；不能把每一行当成新请求。`<synthetic>` 错误占位不计费。

源码：[UsageLedger.swift](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Sources/Pulse/Usage/UsageLedger.swift)。

## Codex

读取 `~/.codex/sessions` 和归档会话。通常由 `turn_context.payload.model` 等模型事件更新当前模型，随后将 `token_count` 的 `info.total_token_usage` 差分归给该模型。

`本次增量 = 当前累计计数 − 上次累计计数`

输入已经包含缓存命中部分，因此分为 `普通输入 = input − cached_input` 与 `缓存读取 = cached_input`；输出保留已包含推理的输出总数一次，不再额外叠加 reasoning。fork 的首次基线、重放父历史和跨文件副本另外协调，避免旧工作重新计入。

该归因依赖客户端写下的模型事件，不独立验证服务端实际模型。源码：[UsageLedger.swift](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Sources/Pulse/Usage/UsageLedger.swift)、[身份边界](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Docs/providers/codex.md)。

## Cursor、OpenCode 与其他来源

- Cursor：读取预先导出的 `usageEventsDisplay` JSON 或符合列名的 CSV，取 `model` 与输入、输出、缓存读写字段。没有事件 ID 时，同文件相同内容的两行仍可能是两次真实请求；重叠导出按内容多重集合协调，并保留不完整标记。不会使用配额比例拆分模型，也不把 Cursor 自己的计费金额混入统一 API 价格估算。[读取器](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Sources/Pulse/Usage/Readers/CapturedCursorReader.swift)
- OpenCode / Kilo：读取 SQLite 消息；兼容 `modelID` 和新版 `model.id`，按嵌入的消息 ID 协调新旧表副本。[数据库读取器](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Sources/Pulse/Usage/OpenCodeStore.swift)
- Copilot：按 OTEL、Desktop SQLite、VS Code 的优先级过滤；各通道范围不完全相同，部分覆盖不能伪装成完整账本。[来源目录](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Docs/token-spend-sources.md)

## 标准记录与完整性

`AgentUsageRecord` 包含时间、模型、四类 Token、可选会话 / 项目 / 去重标识。读取器交付的是增量，不是累计快照。没有分类的真实数量保留为 `unclassifiedTokens`；时间只有汇总级时标为 aggregate；不完整计数标为 partial。这些标记不创造新 Token，也不把未知分类放进输入类别计价。

源码：[AgentUsageRecord.swift](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Sources/Pulse/Usage/AgentUsageRecord.swift)、[ModelSpendSummary.swift](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Sources/Pulse/Usage/ModelSpendSummary.swift)。

## 价格计算

价格表来自 models.dev，模型 ID 精确匹配后再尝试别名；首选原厂价格，只有未发布原厂价格且指定了套餐厂商时才使用厂商命名空间的价格。每百万 Token 单价分别应用于普通输入、输出、缓存读取和缓存写入；部分来源能支持长上下文阶梯和一小时缓存写入的差异。

`API 等价费用 = Σ（各类 Token × 对应模型单价）/ 1,000,000`

先按原始模型 ID 计价，再合并名称和 Agent。未知价格或不一致分类保留为未定价，零价格与未知价格分开。金额不是订阅账单。

源码：[ModelPrices.swift](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Sources/Pulse/Usage/ModelPrices.swift)、[ModelPriceLookup.swift](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Sources/Pulse/Usage/ModelPriceLookup.swift)。
