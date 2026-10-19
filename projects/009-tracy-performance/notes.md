# 研究笔记

## 2026-10-19 · 补充理解与全景图

补充代码来源与运行条件：AI 生成、GitHub 下载、自写项目都可；面向对象、过程式、单/多线程、循环、事件驱动、批处理均可。官方语言与第三方绑定分开说明，不承诺各语言拥有相同自动采样和源码映射能力。

新增一张 1920×6830 的原创 SVG/PNG 全景图；网页提供完整图弹窗、原始尺寸、滚动和下载。八部分含能力、采集机制、代码/语言条件、六类场景、22 项产品差异、AI 价值、引发思考与范围。

产品对比新增 Google Benchmark、Valgrind Callgrind/Massif、heaptrack、Perfetto、Nsight Systems、Nsight Compute、OpenTelemetry，并增加接入方式、差异、语言/场景选择。来源为各自官方文档；仍未在本机运行这些上游工具。

产品资料集中于 references/products.json，由 src/build_overview.py 同步长图、PNG 封面、网页数据与 comparison.md。初版快照与验证记录保留；本次页面检查见 references/supplement-verification.json。

补充版本完成 30 项浏览器检查：图像尺寸、弹窗、原始尺寸与适应宽度、Escape 与焦点返回、PNG/SVG 下载、22 项分类与场景组合筛选、FAQ，以及原有采样/埋点、页签和正确性/性能验收回归。375px 与 320px 页面没有横向溢出，原图的大尺寸滚动限制在弹窗内部。下载文件与源图按哈希核对；网页验证不代表上游性能验证。

## 2026-10-16 · 从讨论到网页

澄清了定位与判断、采样与埋点、资源占用与执行证据、性能分析与验收、AI 产品与 AI 生成的普通软件之间的区别。

核心结论：Tracy 能提供定位证据；完整性能保障还要有固定场景、需求、正确性测试、基准和外部修复循环。普通 C/C++ 工作流已有参考，HPC/GPU 专用项目不能直接推广到任意桌面应用。

## 核对材料

- Tracy README、manual/tracy.tex、NEWS、LICENSE。
- Tracy.hpp 的源码位置宏，TracyScoped.hpp 的开始/结束事件，TracyProfiler.hpp 的数据路径。
- 另核对 v0.14.1 官方手册的 Tracy Assist 与 MCP 章节；这两项在发布标签中已有说明，不仅是扩展设想。Linux monitor 则仍按固定主分支 NEWS 的未发布状态标注。
- profiler-md 的 C/C++ 支持、采集与 profile-optimize 工作流。
- AGR 的实验循环、指标/正确性分离与案例。
- ParaCodex 的转换、profiling、数值验证和环境。
- Atrex 的 GPU 算子、验证和候选筛选。
- 产品官方说明，见 comparison.md。

五个仓库固定快照由 src/collect_sources.py 保存至 references/upstream.json。作者案例数字不作为本项目实测。

## 实现与验证范围

使用仓库创建工具登记 009。网页包含合成时间轴、原理页签、产品筛选、验收机制、AI 分层、扩展设想、FAQ 与来源。

所有帧时间、文件名/行号、锁关系与候选均为合成数据。网页不执行编译、profiling、模型请求或真实测试。

本地页面、交互和静态构建的最终检查记录见 references/verification.json；它验证研究网页，不表示验证了上游真实性能或修复效果。

## 部署

沿用 docs/deployment.md 的 Pages 静态构建。初版与补充理解阶段只创建并本地验证，未提交部署；后续发布记录在实际成功并验证后追加，demo_url 同步回填。
