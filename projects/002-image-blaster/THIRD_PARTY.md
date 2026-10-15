# 来源与许可

本文件仅记录 002 子项目，不为研究总仓库选择统一开源许可证。

## image-blaster

- 上游：<https://github.com/neilsonnn/image-blaster>。
- 固定提交：`4acb43ba126a12358f71838d1b1a05e856b10eaf`。
- MIT，Copyright (c) 2026 Neilson Koerner-Safrata。
- 保留 [上游 README](references/upstream-README.md)、[完整许可证原文](references/upstream-LICENSE) 与 [固定版本证据索引](references/sources.json)。许可证原文中的拼写原样保留。
- 本研究未复制上游应用、模型资产、图片、视频或音频；网页及架构图由本轮自行实现。文档包含接口名、路径与少量用于说明机制的字段。
- 上游 MIT 不自动授予外部模型服务使用额度，也不代表所有生成资产具有统一许可。

## 既有研究

- 本仓库 001 AetherViz Master，研究上游 `a1c005f86e9aca18e75917bd5eb38f454bd24a68`。
- 1014 仓库 007 月门水庭，Atlas 方法研究版本 `b283a80dcb6db9068ba368fedfca783f5164ba06`。
- 1014 仓库 011 ancient-rap-battle，版本 `e5e40fa3612777133a141c8448122dd0fd45e4cc`。
- 1014 仓库 006 随机门，本地原创体验研究；Four-Seasons 参考版本 `23e276eda11e421631df3f4b726a066d59845c91`。
- 比较部分仅总结已有文字记录，未复制其他项目的媒体或模型；三维演示依赖另见下节。来源路径、日期与验证差异保存在 [prior-research.md](references/prior-research.md)。

## 本研究网页

原生 HTML / CSS / JavaScript；房间三维演示使用下列本地依赖。内联 SVG、房间图与三维几何均为本轮自行绘制或构造，用于讲解流程，不是上游模型输出。房间参考图是同一套预制几何渲染成的二维图片，并非上传图片经模型重建所得。

`assets/cover.jpg`、`pipeline.jpg`、`comparison.jpg`、`mobile.jpg`、`workflow-understanding.jpg`，以及 `room-demo-*.jpg` 为本研究网页实际运行截图。

`web/assets/image-blaster-overview-v1.png` 为内置 imagegen 工具制作的能力全景信息图，依据本项目源码分析和三个房间演示截图重新排版。它不是上游模型输出，也不是付费生成效果的验证证据；[生成提示词](web/assets/image-blaster-overview-prompt.txt)随项目保存。未调用 image-blaster 的生成服务。

`assets/research-map.png` 是上述原图的相同副本，作为仓库索引与 README 的引导图，未另行修改生成内容。

## Three.js 与 OrbitControls

- 版本：`three@0.134.0`，上游 [r134](https://github.com/mrdoob/three.js/tree/r134)。
- 文件：`web/vendor/three.min.js`、`web/vendor/OrbitControls.js`；从本仓库 001 已核对的依赖副本复制，未修改。
- MIT，Copyright © 2010–2021 three.js authors；保留 [完整原文](web/vendor/three-LICENSE.txt)。
- 应用依赖保存在 002 自身目录，没有引入根目录共享依赖。
