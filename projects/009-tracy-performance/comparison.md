# 同类、互补工具与 AI 工作流对比

补充整理：2026-10-19。共 22 项，按主用途归类，包含相近分析器、互补测试/追踪工具和 AI 工作流。下表为官方文档核对，没有逐项安装或执行，也不宣称穷尽市场。

数据源：references/products.json；运行 src/build_overview.py 同步图表、网页数据与本文。

| 项目 | 环节 / 适用对象 | 能得到什么 | 接入方式 | 关键差异与限制 | 官方来源 |
| --- | --- | --- | --- | --- | --- |
| hyperfine | 测试与验收；开源 · 跨平台 · 命令行任务 | 重复运行、预热、统计耗时，导出 JSON / CSV。 | 提供可重复命令，可配置预热；GUI 场景需额外驱动。 | 可直接测试可执行文件；不自动操作 GUI，也不直接定位函数。 | [官方资料](https://github.com/sharkdp/hyperfine) |
| Bencher | 测试与验收；持续基准平台 · 多种基准适配器 | 维护性能历史、基准与阈值，检测性能退化。 | 需已有场景 / 基准结果；支持 Google Benchmark、hyperfine 等适配器。 | 仍需定义场景并接入结果；支持 Google Benchmark、hyperfine 等，不负责源码修复。 | [官方资料](https://bencher.dev/docs/explanation/adapters/) |
| k6 | 测试与验收；开源 · API / 浏览器负载测试 | 请求时延、错误率、负载与阈值失败结果。 | 配置 API / 浏览器负载脚本，运行测试并定义阈值。 | 通常先定位到慢接口；后端源码原因要结合 profiling / tracing。 | [官方资料](https://grafana.com/docs/k6/latest/using-k6/thresholds/) |
| Lighthouse CI | 测试与验收；开源 · Web 页面 | 持续运行 Lighthouse，检查页面性能预算并比较报告。 | 持续运行 Lighthouse，配置 URL、断言与报告保存。 | 主要是页面审计；不能替代整个产品交互、后端压测或代码级剖析。 | [官方资料](https://github.com/GoogleChrome/lighthouse-ci) |
| Google Benchmark | 测试与验收；开源 · C++ 微基准 | 函数或代码片段的重复基准、统计与机器可读结果。 | 编写基准函数并编译链接 | 需要显式编写 benchmark 场景；性能是否达标与业务正确性需另定义。 | [官方资料](https://github.com/google/benchmark) |
| Tracy | 采集与定位；开源 · BSD-3-Clause · C/C++ / 多语言 | 逐帧时间轴、区间、采样、锁、GPU 与内存事件。 | 集成客户端；支持的平台可采样，区间、锁、GPU、内存按需接入。 | 按需集成客户端与采集点；系统采样依平台。自动修复和 CI 门禁需外部接入。 | [官方资料](https://github.com/wolfpld/tracy) |
| Linux perf | 采集与定位；开源 · Linux · C/C++ 等原生程序 | CPU 样本、调用链及受支持硬件事件，结合符号查看热点。 | Linux 采样权限、栈展开、符号；通常无需逐函数埋点。 | 需要 Linux 与采样权限；源码级解释受符号和构建影响。它不修改代码。 | [官方资料](https://perfwiki.github.io/main/) |
| Intel VTune | 采集与定位；专有分析工具 · Windows / Linux | CPU 热点、线程及受支持硬件分析；命令行报告可导出。 | 启动或附加分析器，配置符号与采样权限；高级功能依硬件。 | 高级分析依硬件、权限和运行环境；不应当作开源自动修复平台。 | [官方资料](https://www.intel.com/content/www/us/en/docs/vtune-profiler/user-guide/2026-0/report.html) |
| WPR / WPA | 采集与定位；微软系统工具 · Windows | ETW 记录与 CPU、线程调度等系统级分析。 | 配置 ETW 录制并解析符号；采集可以脚本化。 | 采集可脚本化；需要合适录制配置和符号，验收与 AI 修复需另接。 | [官方资料](https://learn.microsoft.com/en-us/troubleshoot/windows-server/support-tools/support-tools-xperf-wpa-wpr) |
| Chrome DevTools MCP | 采集与定位；开源 · 浏览器性能工具接口 | 让 Agent 操作浏览器、录制性能 trace，读取诊断与网络信息。 | 配置 MCP 和浏览器连接，无需给页面逐函数埋点；源码解释依构建。 | 不必给网页逐函数埋点；源码映射与具体诊断取决于构建和采集内容，修复依赖 Agent。 | [官方资料](https://github.com/ChromeDevTools/chrome-devtools-mcp) |
| Scalene | 采集与定位；开源 · Python | 函数及源码行级 CPU、内存分析，并输出可供工具使用的报告。 | 通常免业务埋点，通过 Scalene 启动程序；能力依平台与版本。 | 通过分析器启动程序，通常无需业务埋点；不等于任意 C++ 程序的通用分析器。 | [官方资料](https://github.com/plasma-umass/scalene) |
| Pyroscope / Alloy | 采集与定位；持续 profiling · Linux eBPF 路径 | 由外部采集器周期采集 CPU profile，集中存储与查看热点。 | eBPF 路径需要 Linux 与权限；其他语言采集器分别配置。 | eBPF 需要 Linux 和相应权限；支持多语言，但不能单靠 CPU 样本还原全部远程等待。 | [官方资料](https://grafana.com/docs/pyroscope/latest/configure-client/) |
| Valgrind Callgrind / Massif | 采集与定位；开源 · 原生程序 · 平台依工具支持 | Callgrind 提供调用关系和指令成本；Massif 分析堆内存峰值。 | 在 Valgrind 下运行；符号辅助 | 无需逐函数埋点，但运行时分析会影响速度；指令计数不等于实际耗时。 | [官方资料](https://valgrind.org/docs/manual/cl-manual.html) |
| heaptrack | 采集与定位；开源 · Linux 原生堆内存 | 分配调用栈、临时分配与内存占用线索。 | 通过 heaptrack 启动或附加 | 依 Linux、可追踪分配路径与符号；不能把堆追踪等同于全部进程内存。 | [官方资料](https://github.com/KDE/heaptrack) |
| Perfetto | 采集与定位；开源 · 系统与应用 tracing | 跨线程 / 进程 trace、系统事件与 SQL 分析。 | 系统数据源 + 按需 SDK 埋点 | 系统采集依平台、数据源与权限；业务区间通过 SDK 等补充。 | [官方资料](https://perfetto.dev/docs/) |
| Nsight Systems | 采集与定位；NVIDIA 工具 · CPU / GPU 系统分析 | CPU / GPU、CUDA API、调度与任务时间线。 | nsys 录制；可选 NVTX 标记 | 支持项依操作系统、GPU 和权限；硬件 / API 范围需按官方矩阵核对。 | [官方资料](https://docs.nvidia.com/nsight-systems/UserGuide/index.html) |
| Nsight Compute | 采集与定位；NVIDIA 工具 · CUDA kernel | 单个 CUDA kernel 的计数器、访存与执行效率。 | 选择 kernel 与指标；可能重放 | 依受支持 NVIDIA GPU；指标采集可能多轮重放，需考虑对时间和状态的影响。 | [官方资料](https://docs.nvidia.com/nsight-compute/ProfilingGuide/index.html) |
| OpenTelemetry | 采集与定位；开源 · 多语言分布式遥测 | 跨服务 spans、指标与日志的采集和关联。 | SDK / 自动插桩 + Collector | 需语言 / 框架支持、传播上下文与存储后端；自动插桩覆盖范围不同。 | [官方资料](https://opentelemetry.io/docs/what-is-opentelemetry/) |
| profiler-md | AI 优化工作流；开源 · MIT · Beta | 把性能记录转成 AI 易读 Markdown；附带采集、优化、测试与复测工作流。 | C/C++ 可结合 perf、Callgrind、pprof 等；依赖已有 Agent 与采集工具。 | C/C++ 支持 perf、Callgrind、pprof 等；依赖已有 Agent 和底层工具，并非独立通用验收平台。 | [官方资料](https://github.com/TomerAberbach/profiler-md) |
| AGR | AI 优化工作流；开源 · MIT · Agent 实验工作流 | 修改、编译、基准与正确性检查，按结果保留、修正或回退候选。 | 提供可运行项目、指标、正确性规则与编码 Agent。 | 有 C++/Python 案例；仍需定义指标与验证，不内置覆盖所有语言的统一 profiler。 | [官方资料](https://github.com/JoaquinMulet/Artificial-General-Research) |
| ParaCodex | AI 优化工作流；开源 · MIT · 并行与数值计算 | 串行 C/C++ 与 OpenMP / CUDA 等代码转换、profiling、数值验证和 AI 修复。 | 配置 NVIDIA HPC SDK、nsys、GPU、数值测试与 Agent。 | 偏 HPC；标准运行环境需要 NVIDIA HPC SDK、nsys 和 GPU，不是普通桌面软件验收器。 | [官方资料](https://github.com/Scientific-Computing-Lab/ParaCodex) |
| Atrex Kernel Agent | AI 优化工作流；开源 · Apache-2.0 · GPU 算子 | GPU 编码、profile、正确性检查、性能验证、隔离实验和候选筛选。 | 配置 GPU 环境、算子任务、正确性与性能评测。 | 支持 CUDA 等算子工作流；不是任意 CPU C++ 工程的零配置测试修复平台。 | [官方资料](https://github.com/alibaba/atrex-kernel-agent) |

## 如何选

- C/C++ 普通计算慢：用重复基准建立问题，再由 perf / VTune / WPR 等采样，关键阶段可补 Tracy。
- 偶发帧卡顿、线程同步和业务阶段：Tracy 的按需区间与事件时间轴有价值；系统范围追踪可补 Perfetto / ETW。
- 分配与堆峰值：heaptrack / Massif；GPU 系统协同看 Nsight Systems，CUDA kernel 内部指标看 Nsight Compute。
- Web / Python 分别看 Chrome DevTools、Lighthouse CI、Scalene 等；分布式等待用 OpenTelemetry 等关联服务证据。
- AI 优化：profiler-md 更偏可读证据与技能流程，AGR 偏实验循环，ParaCodex / Atrex 偏并行计算与 GPU 算子。

## 接入与自动化边界

免逐函数埋点仍可能需要权限、符号、启动分析器、安装采集组件或配置场景。C++ 字样不等于任意 Windows 原生工程已兼容；WSL 的 Linux 构建与 Windows 原生 exe 分别看待。

Tracy v0.14.1 手册已有 Assist 与独立 MCP 服务。分析接口不等于内置完整测试与源码修复流程；自动化验收依赖固定负载、业务正确性、性能预算和重复测量。

本次没有核实任意工程零配置测试定位修复的成熟通用项目，结论限定于本轮核对范围。

## 补充官方资料

- [Massif 堆分析手册](https://valgrind.org/docs/manual/ms-manual.html)：与 Callgrind 的调用图和指令成本分开理解。
- [Tracy v0.14.1 手册](https://github.com/wolfpld/tracy/blob/v0.14.1/manual/tracy.tex)：语言、接入、采样、Assist 与 MCP。
