# 研究与验证记录

## 研究问题

2026-10-15：从“Pulse 能做什么、如何移植 Windows”收敛到“如何识别不同 Agent / 模型的本地消耗”。最终确认可参考的核心是多来源记录解析、模型归因、计数校正与 API 等价估价。原生浮窗并非实现类似统计模块的前提。

## 固定版本与证据

- 上游提交：`b3bf083c539310d57d82cd4e808cb37b2ffbfcc4`，2026-10-14T02:24:43Z。
- 读取 README、来源目录、计数与缓存说明，并核对 UsageLedger、AgentUsageRecord、ModelPrices、ModelPriceLookup、ModelSpendSummary、CapturedCursorReader、OpenCodeStore 与 SpendAgent。
- 完整链接与引导图 SHA-256 见 [sources.json](references/sources.json)。本轮是源码 / 文档研究，未在 macOS 运行 Pulse，未读取本机真实 Agent 的私人日志，也未逐一验证 54 类客户端。
- 目录计数核对：7 个原有实机读取器 + 10 会话来源 + 9 编辑器来源 + 10 数据库 / 事件来源 + 11 结构化来源 + 6 导出来源 + 1 Copilot = 54。
- 网页记账示例使用合成数据，演示重复快照不增量、模型切换和缓存拆分，不作为上游运行实测。

## 页面验证与发布

本地已通过目录检查与静态构建。Edge 浏览器验证：54 行目录；实机 / 格式适配 / 导出 / 无真实 Token 筛选分别为 7 / 41 / 6 / 3；搜索与空结果正常。合成账本重复快照不增量，模型 A 计 400 / 600 / 100，切换后模型 B 计 300 / 300 / 80（普通输入 / 缓存读取 / 输出）。原图完整查看、Escape 关闭与下载地址正常；13 个相对资源 / 文档返回 200，PNG 哈希与原图相同。1440px 桌面、390px 手机和 320px 窄屏通过，无脚本错误或失败资源。

证据：[本地检查报告](https://github.com/yydshly/1015_codex_project/blob/main/projects/005-pulse/assets/local-verification.json)、[桌面截图](https://github.com/yydshly/1015_codex_project/blob/main/projects/005-pulse/assets/local-desktop.png)、[手机截图](https://github.com/yydshly/1015_codex_project/blob/main/projects/005-pulse/assets/local-mobile.png)、[引导图截图](https://github.com/yydshly/1015_codex_project/blob/main/projects/005-pulse/assets/local-guide.png)。实际部署结果在发布后追加。
