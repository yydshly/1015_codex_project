# Pulse 的能力与来源支持

## 区分两个数据面

1. **账号额度监控**：复用登录态查询服务商接口、CLI / 本地服务或状态栏回调，显示额度比例、余额和重置时间。
2. **逐模型用量统计**：读取日志、数据库、OTEL 或导出事件中的模型与 Token，校正后汇总。本研究重点在这里。

Token 统计不是由额度百分比反推。一个服务能显示额度，不代表它存在可直接读取的逐模型本地记录。

## 完整 54 类来源

以下目录以固定提交 `b3bf083` 的 `SpendAgent` 和 `token-spend-sources.md` 为准。原有实机读取器 7 类；其余 47 类为新增格式适配，其中 6 类要求预先导出 / 捕获。目录识别不等于每一类都能输出完整的真实 Token 统计，也不代表本研究已逐一运行这些客户端。


### 原有实机读取器（7 类）

Claude Code、Codex、OpenCode、Kilo CLI、Grok、Kimi CLI、Devin。

读取通道：会话 JSONL / SQLite。


### 会话日志（10 类）

Pi、omp、Senpi、Kimchi、Prime Agent、Gemini CLI、Qwen、Amp、Droid、OpenClaw。

读取通道：JSON / JSONL / 部分 SQLite。


### 编辑器与任务记录（9 类）

Roo Code、Kilo Code、Cline、CodeBuddy、WorkBuddy、Cherry Studio、Command Code、OpenCodeReview、ZCode。

读取通道：任务日志 / 消息 JSON。


### 数据库与事件（10 类）

Hermes、Goose、Zed、Kiro、Crush、Unsloth、Antigravity CLI、Antigravity IDE、Micode、Devin Desktop。

读取通道：SQLite / JSON / NDJSON / 压缩记录。


### 产品结构化记录（11 类）

Mux、Codebuff、Freebuff、Jcode、Augment、GJC、Junie、DSH、Fx、LM Studio、Reasonix。

读取通道：各产品的 usage 文件 / 会话日志。


### 导出、缓存与捕获（6 类）

Cursor、Antigravity（导出）、Trae、Warp、Hindsight、Mcode。

读取通道：预先导出的 JSON / CSV / JSONL。


### Copilot 多通道（1 类）

GitHub Copilot。

读取通道：OTEL → Desktop SQLite → VS Code。


## 必须保留的例外

- **Crush、Warp**：只有成本 / 请求计数，没有真实 Token 字段，不能补成一个“0 Token”的使用结论。
- **Freebuff**：只有估算信息，Pulse 不将其报告为真实用量。
- **Cursor、Antigravity（导出）、Trae、Warp、Hindsight、Mcode**：统计读取器只读已有导出 / 缓存 / 捕获；它自身不负责该通道的登录、同步或抓取。
- **Antigravity CLI / IDE / 导出**：三种来源分开登记，不能把同名服务的不同存储当成一份通用日志。
- **Kiro**：仅显式 CLI 输入 / 输出计数；估算型 IDE 变体不纳入。
- **Copilot、OpenClaw 等**：跨来源镜像或不一致范围仍有限制，完整性以原始证据为准。
- **模型和时间缺失**：不能推测默认模型后硬分配消耗；来源可能被跳过或标注为部分计数。

完整逐来源路径、计数口径和证据等级见 [固定版本的上游目录](https://github.com/qunqin24/Pulse/blob/b3bf083c539310d57d82cd4e808cb37b2ffbfcc4/Docs/token-spend-sources.md)，本地留存 [目录快照](references/upstream-token-spend-sources.md)。网页目录提供检索与验证等级筛选。
