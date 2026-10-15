# 完整图谱与联动工作台

2026-10-16，基础索引不变，补充全量导出与实际查询。所有结果来自锁定 npm 分发 gitnexus@1.6.12；文档 tag 与 npm gitHead 的区别见 [分发核对](advanced-provenance.json)。图布局、缩放、过滤、播放、源码联动与导览是本研究实现，网页没有调用在线分析器。

## 实跑范围

- 全量 Cypher 导出：71 实体 / 131 关系，引用完整。源节点行号从 Cypher 的零基转换到编辑器一基。
- 为 10 个业务函数逐一执行 context 与 upstream impact(depth=4)，不是只运行运费函数。
- 实际关键词查询 3 组：shipping checkout order、inventory stock validate、discount subtotal。没有启用 embeddings。
- 所有命令、退出码和耗时见 [atlas-commands.json](atlas-commands.json)。全图原始节点和边见 [atlas-nodes.json](atlas-nodes.json)、[atlas-edges.json](atlas-edges.json)。

## 展示与图遍历

整仓、文件、业务调用视角分别投影实体与边，不补造关系。节点可选择、源码可定位，图可缩放和平移；聚焦邻居只过滤已采集图谱。模块来自 MEMBER_OF，流程来自 STEP_IN_PROCESS，影响层级使用实际 impact 返回。搜索选择固定实跑查询，卡片联动到保存的实体。12 步导览与 Agent 工具链是教学编排，工具输出均可回到原始记录。

高级样本单独建库，103 实体 / 154 关系；API、重命名与 PDG 视图选择其中的真实子图，见 [高级运行报告](advanced-run-report.md)。这两组图谱不能混加成一个仓库或据此推导总体解析准确率。

## 业务金额探针

`collect-business-probe.py` 在原隔离结算源码上执行 5 个输入场景，再把免邮门槛从 10000 分改为 12000 分，重新执行并在 finally 中恢复原字节。基础索引和研究仓库样本没有被改写。

本地、商品 110 元、重量 3、SAVE10 折扣的报价：原运费 0 元、总价 99 元；修改后运费 9 元、总价 108 元。商品 120 元仍免邮；远程规则不受该阈值影响。数据见 [改前](atlas-business-before.json)、[改后](atlas-business-after.json)。这些是执行结算函数的观察，不是 GitNexus 预测。

这组对照说明，图谱帮助调查“要检查谁”，代码执行与测试帮助验证“行为如何变化”。

## 复现

先准备已索引的原隔离 checkout-lab，再执行：

```powershell
python <PROJECT>/src/collect-atlas.py --node <NODE_24_EXE> --lab <LAB>
python <PROJECT>/src/collect-business-probe.py --node <NODE_24_EXE> --lab <LAB>
```

输出为 web/assets/atlas.json 与 business-probes.json。高级案例使用独立注册表、独立 fixture，按 advanced-run-report.md 复现。LLM、Wiki、语义 embeddings 与多仓库契约不在本次实跑范围；能力全景中分别列出条件。
