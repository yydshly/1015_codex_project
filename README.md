<p align="center">
  <img src="assets/banner.svg" alt="GitHub Research Lab：发现、拆解、复现与沉淀" width="100%" />
</p>

# GitHub Research Lab

我的 GitHub 优秀项目研究总仓库。把遇到的好项目按顺序收录，记录它解决的问题、值得学习的设计，以及亲手运行和改造后的结论。

**从这里开始：** [一句话导读](#一句话认识每个项目) · [能力与原理速查](#能力原理与价值速查) · [项目预览](#项目预览) · [研究与收录规范](docs/project-guide.md) · [新增项目](#新增一个研究项目) · [Web 部署约定](docs/deployment.md)

## 项目索引

先看每个项目的一句话介绍，找到感兴趣的方向；再用速查表回顾能力、原理与价值，最后进入研究文档或演示。编号表示收录顺序，分配后保持不变，归档时保留记录。

同源研究分开保留：**007 / 010** 分别侧重搜播实测与产品全链路，**008 / 014** 分别侧重规则实验与能力总览。

<!-- PROJECTS:START -->

已收录 **14** 个项目，按收录编号升序展示。

### 一句话认识每个项目

- **[001 · aetherviz-master](projects/001-aetherviz-master/README.md)**：用提示词规范指导 AI 制作互动课件，为知识讲解与系列课程提供可复用的制作参考。
- **[002 · image-blaster](projects/002-image-blaster/README.md)**：把场景图拆成可独立生成和调整的三维资产，为场景制作提供局部返工与任务恢复的工作流参考。
- **[003 · er-mario](projects/003-er-mario/README.md)**：把马里奥的运动与动画接入法环，展示跨游戏复用成熟动作、分离角色行为与外形的思路。
- **[004 · obsidian](projects/004-obsidian/README.md)**：让同一批三维碎片在不同形态间重组，为片头、品牌宣传与舞台视觉提供可复用的动画方法。
- **[005 · Pulse](projects/005-pulse/README.md)**：汇总本地 AI Agent 的模型与 Token 用量，为自建统计和成本观察模块提供采集、校正与计价参考。
- **[006 · GitNexus](projects/006-gitnexus/README.md)**：把源码和跨文件关系整理成可查询的代码知识索引，为接手仓库、变更分析和 AI 上下文提供依据。
- **[007 · awesome-zhuiju-free](projects/007-zhuiju-source-demo/README.md)**：沿资源配置找到影片接口并实现本地搜片、选集和播放，为验证搜播链路提供可运行样例。
- **[008 · boss-agent-cli](projects/008-boss-agent-cli/README.md)**：拆解 BOSS 职位发现、福利筛选与沟通工具，用离线实验帮助理解匹配误差和风控停止条件。
- **[009 · tracy](projects/009-tracy-performance/README.md)**：采集程序真实运行的性能证据，为开发者和编码 Agent 定位瓶颈、比较优化效果提供依据。
- **[010 · awesome-zhuiju-free](projects/010-zhuiju-product-research/README.md)**：从影视资源目录和搜播实验梳理视频产品全链路，帮助判断内容、接口、分发与运营还需补齐什么。
- **[011 · Octop](projects/011-octop/README.md)**：把聊天、网页和定时任务接入自建 AI 助手服务，为团队共享知识、工具与任务产物提供平台参考。
- **[012 · smart-excalidraw-next](projects/012-smart-excalidraw-next/README.md)**：将文字、文档与截图组织成可编辑图表，为流程梳理、架构沟通和知识表达提供 AI 制图参考。
- **[013 · romm](projects/013-romm/README.md)**（已归档）：把自备或自研游戏整理成可检索的作品库，复用资料、权限和游玩入口管理，减少重复搭建。
- **[014 · boss-agent-cli](projects/014-boss-agent-overview/README.md)**：总览 BOSS 求职与招聘工具的能力和数据路径，为职业方向比较与个人差距探索提供扩展思路。

### 能力、原理与价值速查

**能力**看能做什么，**原理**看如何实现，**价值**看值得借鉴什么；**边界**说明验证范围或使用条件。点击项目名或「研究」查看完整记录，点击「演示」进入研究网页。

| 编号 | 项目 | 源库 | 摘要 | 状态 | 入口 |
| --- | --- | --- | --- | --- | --- |
| 001 | [AetherViz Master 课件生成规范研究](projects/001-aetherviz-master/README.md) | [andyhuo520/aetherviz-master](https://github.com/andyhuo520/aetherviz-master) | **能力**：指导 AI 生成含动画、参数操作与图表的互动课件。<br>**原理**：教学主题 → 外部 AI 按 Skill 编写网页 → 浏览器运行。<br>**价值**：沉淀教学结构与交互规范，便于逐课生成、统一课程风格。<br>**边界**：本研究补充三个案例；尚未验证相比普通提示词的稳定增益。 | 已完成 | [研究](projects/001-aetherviz-master/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/001-aetherviz-master/overview.html) |
| 002 | [image-blaster 图生三维工作流研究](projects/002-image-blaster/README.md) | [neilsonnn/image-blaster](https://github.com/neilsonnn/image-blaster) | **能力**：拆分场景图，生成并组合背景、独立物体与声音。<br>**原理**：Claude Code 按技能调度外部模型，脚本记录请求和本地资产。<br>**价值**：资产解耦后可单独替换、重试和调整，减少整场重做。<br>**边界**：布局仍需人工调整；自动布局与质量验收是扩展方向。 | 已完成 | [研究](projects/002-image-blaster/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/002-image-blaster/) |
| 003 | [ER Mario 跨游戏动作系统研究](projects/003-er-mario/README.md) | [deltarooo/er-mario](https://github.com/deltarooo/er-mario) | **能力**：将《超级马里奥 64》的角色运动与动画接入《艾尔登法环》。<br>**原理**：复用 libsm64，经碰撞、骨骼、战斗与事件适配连接宿主游戏。<br>**价值**：把行为、身体外形与世界适配分开，减少动作系统重复开发。<br>**边界**：本研究为七模型与场景机制演示，未运行原模组验证。 | 已完成 | [研究](projects/003-er-mario/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/003-er-mario/overview.html) |
| 004 | [Obsidian 程序化碎片变形研究](projects/004-obsidian/README.md) | [iamtechartist/obsidian](https://github.com/iamtechartist/obsidian) | **能力**：实现碎片变形与声画循环；本研究补充四种形态和 MP4 导出。<br>**原理**：表面碎裂 → 目标采样匹配 → GPU 按时间计算碎片姿态。<br>**价值**：复用同一组碎片表达形态变化，支持视觉叙事与互动预览。<br>**边界**：属于程序化视觉效果；科学模拟与真实装配需另建模型和约束。 | 已完成 | [研究](projects/004-obsidian/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/004-obsidian/#understanding) |
| 005 | [Pulse 本地 Agent 用量统计研究](projects/005-pulse/README.md) | [qunqin24/Pulse](https://github.com/qunqin24/Pulse) | **能力**：按模型归集多种 Agent 的 Token 用量与 API 等价费用。<br>**原理**：读取日志、数据库和导出记录，处理累计差分、去重与缓存重叠。<br>**价值**：复用来源适配、标准记录与聚合方法，便于扩展统计模块。<br>**边界**：等价费用不等于实际账单，统计覆盖取决于来源与记录完整性。 | 已完成 | [研究](projects/005-pulse/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/005-pulse/overview.html) |
| 006 | [GitNexus 代码知识索引与 AI 工具接入研究](projects/006-gitnexus/README.md) | [abhigyanpatwari/GitNexus](https://github.com/abhigyanpatwari/GitNexus) | **能力**：经 CLI / MCP 提供代码检索、调用上下文和候选变更影响。<br>**原理**：解析源码与跨文件关系，构建 LadybugDB 索引后按任务查询。<br>**价值**：让开发者和 Agent 获取可回到源码核对的结构信息。<br>**边界**：已做小样本验证；静态关系不等于执行轨迹，大项目收益待验证。 | 已完成 | [研究](projects/006-gitnexus/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/006-gitnexus/) |
| 007 | [追剧资源接口验证与网页播放 Demo](projects/007-zhuiju-source-demo/README.md) | [laoma528/awesome-zhuiju-free](https://github.com/laoma528/awesome-zhuiju-free) | **能力**：本研究实现本地搜索、详情、选集与 HLS 播放 Demo。<br>**原理**：从源库目录发现公开配置，再连接 HTTP 影片接口与媒体地址。<br>**价值**：把资源线索落实为可复测的接口适配和网页播放流程。<br>**边界**：首两集 1080p 曾实测；不代表全片库持续可用，Demo 仅本地运行。 | 已完成 | [研究](projects/007-zhuiju-source-demo/README.md) |
| 008 | [BOSS Agent CLI 招聘工作流与风控边界研究](projects/008-boss-agent-cli/README.md) | [can4hou6joeng4/boss-agent-cli](https://github.com/can4hou6joeng4/boss-agent-cli) | **能力**：将职位发现、规则筛选和沟通流程封装为 Agent 工具。<br>**原理**：复用登录会话与浏览器环境访问接口，本地规则处理结果。<br>**价值**：通过福利语义探针与风险锁实验，理解工具可靠性和停止机制。<br>**边界**：仅做离线实验，未验证真实登录、在线搜索或消息送达。 | 已完成 | [研究](projects/008-boss-agent-cli/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/008-boss-agent-cli/) |
| 009 | [Tracy 运行时性能定位与 AI 优化研究](projects/009-tracy-performance/README.md) | [wolfpld/tracy](https://github.com/wolfpld/tracy) | **能力**：定位 CPU 热点、线程与锁等待、已接入的 GPU 和内存问题。<br>**原理**：结合调用栈采样、区间埋点与运行事件，还原耗时和等待关系。<br>**价值**：支持优化前后复测，可作为自动性能回归工具的采集基础。<br>**边界**：需按语言和平台接入；自动回归组件是设想，完整质检还需其他测试。 | 已完成 | [研究](projects/009-tracy-performance/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/009-tracy-performance/) |
| 010 | [追剧资源库与视频产品全链路研究](projects/010-zhuiju-product-research/README.md) | [laoma528/awesome-zhuiju-free](https://github.com/laoma528/awesome-zhuiju-free) | **能力**：源库整理资源入口；本研究串联搜播验证与视频产品规划。<br>**原理**：JSON 目录、维护者审核与定时 HTTP 检测维护入口；配置 → API → HLS。<br>**价值**：把产品拆为内容授权、接口适配、观看体验、存储分发与盈利验证。<br>**边界**：目录与播放成功不代表内容授权；真实搜播需启动本地服务。 | 已完成 | [研究](projects/010-zhuiju-product-research/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/010-zhuiju-product-research/) |
| 011 | [Octop 自建 AI 助手平台研究](projects/011-octop/README.md) | [TencentCloud/Octop](https://github.com/TencentCloud/Octop) | **能力**：接入多种入口，生成资料回答、简报、报告或代码差异。<br>**原理**：后台整合模型、记忆、知识库与工具执行，并可经 MCP、ACP 等扩展。<br>**价值**：支持多人管理、内网业务接入，以及模型和源码的自主控制。<br>**边界**：本研究未运行 Octop 实例；部署者需承担权限、升级与恢复维护。 | 已完成 | [研究](projects/011-octop/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/011-octop/) |
| 012 | [Smart Excalidraw 场景与图表能力研究](projects/012-smart-excalidraw-next/README.md) | [liujuntao123/smart-excalidraw-next](https://github.com/liujuntao123/smart-excalidraw-next) | **能力**：支持流程、架构、ER、思维导图、甘特等图表场景。<br>**原理**：AI 输出图形 JSON，经部分修复和箭头调整，由 Excalidraw 渲染。<br>**价值**：把描述转为可继续编辑的图形，便于沉淀模板与协作表达。<br>**边界**：研究含 22 类规范与六个构造场景，未调用模型验证生成质量。 | 已完成 | [研究](projects/012-smart-excalidraw-next/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/012-smart-excalidraw-next/) |
| 013 | [RomM 游戏库管理与价值边界研究](projects/013-romm/README.md) | [rommapp/romm](https://github.com/rommapp/romm) | **能力**：管理游戏分类、封面简介、收藏、用户权限与兼容的游玩入口。<br>**原理**：扫描文件并建立索引，匹配资料，再连接模拟器或客户端与存档。<br>**价值**：适合已有游戏内容的作品管理、家庭收藏与多设备访问。<br>**边界**：不附带游戏；直接运行和同步需兼容，HTML5 / PC 游戏需另评估；未部署实测。 | 已归档 | [研究](projects/013-romm/README.md) |
| 014 | [BOSS Agent CLI 能力总览与职业探索研究](projects/014-boss-agent-overview/README.md) | [can4hou6joeng4/boss-agent-cli](https://github.com/can4hou6joeng4/boss-agent-cli) | **能力**：将搜索、筛选、候选池、简历与沟通组织为 CLI / Python API / MCP 工具。<br>**原理**：复用网页登录态，经 HTTP、浏览器 fetch 和网络监听取数，再做本地处理与可选 AI 分析。<br>**价值**：为职业画像、方向比较与差距分析提供工具基础和扩展参考。<br>**边界**：展示为合成原型；扩展受平台风控、接口变化、权限与样本偏差约束。 | 已完成 | [研究](projects/014-boss-agent-overview/README.md) · [演示](https://yydshly.github.io/1015_codex_project/projects/014-boss-agent-overview/) |

### 项目预览

#### 001 · AetherViz Master 课件生成规范研究

[![AetherViz Master 课件生成规范研究 项目预览](projects/001-aetherviz-master/assets/research-map.jpg)](projects/001-aetherviz-master/README.md)

用提示词规范指导 AI 制作互动课件，为知识讲解与系列课程提供可复用的制作参考。

标签：AI Skill · 教育可视化 · Three.js

#### 002 · image-blaster 图生三维工作流研究

[![image-blaster 图生三维工作流研究 项目预览](projects/002-image-blaster/assets/research-map.png)](projects/002-image-blaster/README.md)

把场景图拆成可独立生成和调整的三维资产，为场景制作提供局部返工与任务恢复的工作流参考。

标签：图生3D · AI工作流 · 源码研究

#### 003 · ER Mario 跨游戏动作系统研究

[![ER Mario 跨游戏动作系统研究 项目预览](projects/003-er-mario/assets/er-mario-overview.png)](projects/003-er-mario/README.md)

把马里奥的运动与动画接入法环，展示跨游戏复用成熟动作、分离角色行为与外形的思路。

标签：游戏模组 · 跨引擎整合 · 交互演示

#### 004 · Obsidian 程序化碎片变形研究

[![Obsidian 程序化碎片变形研究 项目预览](projects/004-obsidian/assets/obsidian-understanding.png)](projects/004-obsidian/README.md)

让同一批三维碎片在不同形态间重组，为片头、品牌宣传与舞台视觉提供可复用的动画方法。

标签：Three.js · 程序化动画 · 交互演示

#### 005 · Pulse 本地 Agent 用量统计研究

[![Pulse 本地 Agent 用量统计研究 项目预览](projects/005-pulse/assets/research-map.png)](projects/005-pulse/README.md)

汇总本地 AI Agent 的模型与 Token 用量，为自建统计和成本观察模块提供采集、校正与计价参考。

标签：Agent 用量 · 模型统计 · 产品参考

#### 006 · GitNexus 代码知识索引与 AI 工具接入研究

[![GitNexus 代码知识索引与 AI 工具接入研究 项目预览](projects/006-gitnexus/assets/cover.svg)](projects/006-gitnexus/README.md)

把源码和跨文件关系整理成可查询的代码知识索引，为接手仓库、变更分析和 AI 上下文提供依据。

标签：代码图谱 · 静态分析 · MCP

#### 007 · 追剧资源接口验证与网页播放 Demo

[![追剧资源接口验证与网页播放 Demo 项目预览](projects/007-zhuiju-source-demo/assets/research-overview-20261019.png)](projects/007-zhuiju-source-demo/README.md)

沿资源配置找到影片接口并实现本地搜片、选集和播放，为验证搜播链路提供可运行样例。

标签：影视接口 · 网页播放 · 端到端验证

#### 008 · BOSS Agent CLI 招聘工作流与风控边界研究

[![BOSS Agent CLI 招聘工作流与风控边界研究 项目预览](projects/008-boss-agent-cli/assets/cover.svg)](projects/008-boss-agent-cli/README.md)

拆解 BOSS 职位发现、福利筛选与沟通工具，用离线实验帮助理解匹配误差和风控停止条件。

标签：招聘自动化 · MCP · 风控分析

#### 009 · Tracy 运行时性能定位与 AI 优化研究

[![Tracy 运行时性能定位与 AI 优化研究 项目预览](projects/009-tracy-performance/assets/understanding-map.png)](projects/009-tracy-performance/README.md)

采集程序真实运行的性能证据，为开发者和编码 Agent 定位瓶颈、比较优化效果提供依据。

标签：性能分析 · C/C++ · AI 自动优化

#### 010 · 追剧资源库与视频产品全链路研究

[![追剧资源库与视频产品全链路研究 项目预览](projects/010-zhuiju-product-research/assets/research-overview-20261019.png)](projects/010-zhuiju-product-research/README.md)

从影视资源目录和搜播实验梳理视频产品全链路，帮助判断内容、接口、分发与运营还需补齐什么。

标签：片源研究 · 视频分发 · 产品与商业化

#### 011 · Octop 自建 AI 助手平台研究

[![Octop 自建 AI 助手平台研究 项目预览](projects/011-octop/assets/octop-understanding-overview-20261020.png)](projects/011-octop/README.md)

把聊天、网页和定时任务接入自建 AI 助手服务，为团队共享知识、工具与任务产物提供平台参考。

标签：AI 助手平台 · Agent 原理 · 产品对比

#### 012 · Smart Excalidraw 场景与图表能力研究

[![Smart Excalidraw 场景与图表能力研究 项目预览](projects/012-smart-excalidraw-next/assets/smart-excalidraw-understanding-20261020.png)](projects/012-smart-excalidraw-next/README.md)

将文字、文档与截图组织成可编辑图表，为流程梳理、架构沟通和知识表达提供 AI 制图参考。

标签：AI图表 · 场景研究 · Excalidraw

#### 013 · RomM 游戏库管理与价值边界研究

[![RomM 游戏库管理与价值边界研究 项目预览](projects/013-romm/assets/romm-understanding-20261020.png)](projects/013-romm/README.md)

把自备或自研游戏整理成可检索的作品库，复用资料、权限和游玩入口管理，减少重复搭建。

标签：游戏库管理 · 自部署 · 价值边界

#### 014 · BOSS Agent CLI 能力总览与职业探索研究

[![BOSS Agent CLI 能力总览与职业探索研究 项目预览](projects/014-boss-agent-overview/assets/boss-agent-panorama.png)](projects/014-boss-agent-overview/README.md)

总览 BOSS 求职与招聘工具的能力和数据路径，为职业方向比较与个人差距探索提供扩展思路。

标签：招聘工具原理 · 职业探索 · Agent工具

<!-- PROJECTS:END -->


## 新增一个研究项目

在仓库根目录执行（Python 3.10+，无需安装第三方依赖）：

```sh
python scripts/projects.py new example-repo --name "示例项目" --repo "https://github.com/owner/example-repo" --summary "一句话说明项目用途与研究价值"
```

此处仅演示命令，示例不会计入真实索引。工具会分配下一个编号，创建研究目录、笔记和封面占位图，并同步首页。

```text
projects/001-example-repo/
├── README.md       # 摘要、上游链接、图片与研究结论
├── notes.md        # 环境、复现过程、源码阅读与实验记录
├── assets/         # 封面、截图、示意图
├── src/            # 自己的实验与实现
└── web/            # 可选的 Web 演示与构建说明
```

在 `projects.json` 中维护一句话 `summary`，用 `summary_details` 分别填写能力、原理、价值与边界（见[摘要格式规范](docs/project-guide.md#图片与摘要)）；修改后执行：

```sh
python scripts/projects.py sync
python scripts/projects.py check
```

## 仓库导航

| 入口 | 用途 |
| --- | --- |
| [projects/](projects/README.md) | 各子项目独立的研究文档、图片和实验 |
| [projects.json](projects.json) | 首页索引的数据源，集中维护顺序与摘要 |
| [templates/project/](templates/project/README.md) | 新建研究项目使用的模板 |
| [研究规范](docs/project-guide.md) | 编号、研究步骤、图片与来源记录 |
| [部署说明](docs/deployment.md) | 多个 Web 的路径、构建与部署约定 |

## 维护原则

- 首页保留简短导读；详细分析和运行方式写在各子项目中。
- 每个项目保留上游仓库、研究版本和许可证信息；引用的图片注明来源。
- 优先保存自己的笔记与实验；确需引入上游代码时，记录版本并遵守其许可证。
- 演示地址仅在实际部署并验证后填写，项目状态以真实研究进度为准。
