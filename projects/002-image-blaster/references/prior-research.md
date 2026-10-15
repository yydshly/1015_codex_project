# 既有研究取证记录

查阅日期：2026-10-15。本文件是对已有研究文档的归纳快照，避免网页引用跨工作区的本地路径或假设它们已发布。没有复制其他项目的媒体或应用。

## 本仓库 001 · AetherViz Master

- 本地记录：`F:/codex_project/1015_codex_project/projects/001-aetherviz-master/README.md`、`capabilities.md`。
- 上游：[andyhuo520/aetherviz-master](https://github.com/andyhuo520/aetherviz-master/tree/a1c005f86e9aca18e75917bd5eb38f454bd24a68)，固定版本 `a1c005f86e9aca18e75917bd5eb38f454bd24a68`。
- 研究记录说明上游由 README、SKILL 和许可证构成，核心是指导外部 AI 生成教学网页的规范。
- 本地研究实现三个固定课件：牛顿第二定律、正弦函数和水分子结构；已运行并有截图、数值与交互核对。
- 区分：本地课件是研究实现，不是上游自带服务，也未证明任意主题批量生成成功。
- 比较用途：Skill 指导写代码，与 Skill 调用媒体生成模型。

## 1014 仓库 007 · Atlas / 月门水庭

- 本地记录：`F:/codex_project/1014_codex_project/projects/007-autumn-courtyard-blender/README.md`、`RESEARCH.md`。
- 方法研究上游：[xikhar/atlas](https://github.com/xikhar/atlas/tree/b283a80dcb6db9068ba368fedfca783f5164ba06)，固定版本 `b283a80dcb6db9068ba368fedfca783f5164ba06`。
- 本地实验先用 ImageGen 制作原创参考图，再由 AI 观察画面、编写 Blender Python，实际执行、渲染并修改，得到可编辑 `.blend` 和导出 GLB。
- 记录明确未调用直接输出网格的专用图生三维服务；已有真实渲染、侧视和网页旋转缩放等交互证据。
- Atlas 上游支持图生三维工具、Blender 脚本和程序几何多路线；本地只选其中一条方法进行实验，未复制 Atlas 场景或脚本。
- 区分：这是参考图指导的近似场景，隐藏部分与尺寸靠判断补建，不是精确三维重建。
- 比较用途：专用模型生成媒体资产，与 AI 编写可编辑几何代码。

## 1014 仓库 011 · ancient-rap-battle

- 本地记录：`F:/codex_project/1014_codex_project/projects/011-ancient-rap-battle/README.md`、`RESEARCH.md`。
- 上游：[10291124jcjc-dotcom/ancient-rap-battle](https://github.com/10291124jcjc-dotcom/ancient-rap-battle/tree/e5e40fa3612777133a141c8448122dd0fd45e4cc)，固定版本 `e5e40fa3612777133a141c8448122dd0fd45e4cc`。
- 研究记录核对 Claude Code Skill、模板和 Python 脚本：歌曲由用户在 Suno 制作，参考图由用户在 Midjourney 准备，视频脚本调用 MiniMax H3，再按时间轴处理候选、选片、偏移和剪辑。
- 自动音轨相关性检查与可选嘴部检查是有限筛查，不保证口型、身份和动作正确。
- 区分：已有上游原作引用和本地说明网页，MiniMax 付费调用与完整生产没有实测。
- 比较用途：多模型工作流的拆分、返工、验证与生产价值。

## 1014 仓库 006 · 随机门

- 本地记录：`F:/codex_project/1014_codex_project/projects/006-random-doors/README.md`。
- 归属：本地原创体验研究；概念来自 Techartist 原帖；程序场景参考 [iamtechartist/Four-Seasons](https://github.com/iamtechartist/Four-Seasons/tree/23e276eda11e421631df3f4b726a066d59845c91)，固定版本 `23e276eda11e421631df3f4b726a066d59845c91`。
- 已有六处可互动地点、随机内容、回应、手记和回访。当前版本主要使用制作阶段生成并保存本地的原画与互动层，保留旧 Three.js 场景；运行时不调用外部模型。
- 区分：它不是通用三维生成库，不把六处地点都当作可漫游三维世界；情绪、留存和商业效果没有得到验证。
- 比较用途：资产生成解决素材，故事和体验规则解决用户为什么参与与回访。

## 比较纪律

- 只比较已有记录支持的机制与产物。
- 不把某个本地实验路径扩大为上游全部能力。
- 不把静态说明网页或引用成片等同于付费生产链路复现。
- 不给出未经测量的模型质量、速度、价格或商业回报排行。
