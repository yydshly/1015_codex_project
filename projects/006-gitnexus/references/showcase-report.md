# GitNexus 能力效果补充实跑

2026-10-15，沿用已安装的 npm gitnexus@1.6.12、Node 24.19.0、LadybugDB 0.18.3 和原 checkout-lab 隔离索引。没有重新 analyze，没有开启模型、embeddings 或 PDG。页面布局、颜色和中文说明是本研究的展示设计。

## 分组与流程

通过真实 cypher CLI 提取 Community、MEMBER_OF、Process、STEP_IN_PROCESS 与关系类型：

- 4 个分组，12 个成员；两个 Services 分组以 comm_1 / comm_2 区分。
- 4 条流程；库存校验 4 步，折扣、金额、运费各 3 步，共 13 条 STEP_IN_PROCESS。
- 全图 131 条关系含 13 条 CALLS；既有业务子图 11 条 CALLS 只含业务函数间调用。
- 本次不新增图谱中的推测边；流程相邻步骤与真实业务 CALLS 校验一致。

## Git diff 与结构检查

只在临时独立 Git 仓库中把 services/shipping.ts 的 `subtotal >= 10000` 改为 `subtotal >= 12000`，其他源码保持基线。执行 `gitnexus detect-changes --scope unstaged`，返回 1 文件、1 符号、1 受影响流程，risk level 为 medium。目标是 calculateShipping，流程为 SubmitOrder → CalculateShipping，3 步。程序在 finally 中恢复原文件字节，再执行 `check --cycles --json`：status=clean、enumeration=complete、cycleCount=0。

`detect_changes` 与 `impact` 风险字段来自不同工具与统计口径，本案例分别为 medium 与 LOW；不能当作故障概率或直接比较。检查只覆盖静态导入规则，不替代业务测试。

该版本 detect-changes CLI 输出人类可读文本，没有提供 JSON flag。采集器保留 stdout / stderr，并在 `showcase-changes.json` 中明确封装为 format=cli-text。展示数据从报告提取计数、目标和流程，原始 diff、报告和命令均可核对。首次采集把报告当作 JSON 读取失败，finally 已恢复样本；修正格式识别后完整重跑成功，最终保留的文件来自成功运行。

## 复现

先按 [原运行报告](run-report.md) 准备并索引临时 checkout-lab，全文检索需成功建立。然后执行：

```powershell
python <PROJECT>/src/collect-showcase.py --node <NODE_24_EXE> --lab <LAB>
python <PROJECT>/src/publish-showcase.py
```

`<PROJECT>` 指本子项目绝对路径，`<LAB>` 是原运行报告中的隔离安装目录。具体查询、退出码和时间见 [showcase-commands.json](showcase-commands.json)。原始数据为 `showcase-communities / memberships / processes / steps / relation-types / changes / check` 的 JSON 与 stdout，差异见 [showcase-change.diff](showcase-change.diff)。转换后数据为 web/assets/showcase.json。

## 页面与版本范围

七种视图只回放真实输出，不能分析访问者的新仓库。既有 context / impact / query / trace 保持原记录不变；新增分组和流程查询使用同一索引。能力清单另外核对 2026-10-15 上游 README，rename、API 关联、PDG、多仓库、Wiki 与 AI 问答未在本次运行。官方 Web UI、本地 CLI / MCP 作为实际使用入口给出。
