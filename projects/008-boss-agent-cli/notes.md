# 研究与复现记录

首次查验 2026-10-15，子项目整理及本地验证 2026-10-16。固定上游 `7f46ba37c654d5f7675bb1328158030d7604847c`，包版本 3.0.0。上游检出在总仓库外，本项目仅摘录 7 个独立符号及完整 MIT 许可，另有原创文档、合成案例和网页移植。

## 源码与实验

阅读 README、能力矩阵、命令、平台风险、搜索管线、客户端、浏览器 fetch、AI service 与风险锁，确认会话访问、业务处理和可选 AI 的分工。

摘录器检查 commit 与相关源文件差异，按 AST 符号范围提取，保存源文件 LF 文本哈希、摘录哈希和行号。验证脚本先核对哈希，再调用原始函数。

10 个语义探针含正常、AND 缺项、标签/描述合并、自定义词、否定和同义表达，已复现 4 个不一致。8 个岗位全部合成，人工标注随数据保存，没有真实招聘者、简历或聊天记录。

风险锁用合成 session A/B 测试同值、变化、未知、损坏四种输入。网页状态机只演示停止和本地锁，不操作真实浏览器、平台或验证码。

## 上游测试子集

初次包含 CLI 的测试因本机缺 Patchright 未完成收集。随后只运行 `test_search_filters.py`、`test_search_pipeline.py`、`test_match_score.py`、`test_eval_harness.py`。默认 pytest 临时目录一度遇到 Windows 权限问题，改为新建隔离临时目录后 59 项通过。提供 record_core_tests.py 重新执行并保存输出。

环境问题不视为上游业务缺陷，59 项通过不等于全部测试通过。未进行真实账号烟测、在线搜索、触达或模型调用。

## 网页与范围

网页有角色能力、五步原理、岗位筛选、文本探针、风控回放、来源与改进方向。JS 移植与 Python 原始结果交叉校验；所有资源在项目内，无第三方 CDN。本地构建后按 `/projects/008-boss-agent-cli/` 验证，证据见 verification.json。

未推送或公开部署，demo_url 留空。保留其他项目已有未提交变更，不新增根目录应用依赖。

## 公开证据

[evals](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/evals/README.md) 是 fixture-first 骨架，记录过真实测试触发 ACCOUNT_RISK。[2026-06-24 记录](https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/evals/results/necessary-conditions-2026-06-24.json) 报告一次搜索返回 15 项，属于上游历史自述，本轮未重跑。没有据此推导线上稳定性或录用转化。
