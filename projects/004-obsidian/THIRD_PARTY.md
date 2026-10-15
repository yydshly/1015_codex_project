# 来源与第三方许可

本文件只说明 004 子项目引入的第三方材料，不为整个研究仓库选择许可证。

## Obsidian

- 作者与来源：[iamtechartist/obsidian](https://github.com/iamtechartist/obsidian)
- 固定提交：`74510f112c0a7e4318f688b851523105ec4f79e4`
- 版权：**Copyright (c) 2026 Techartist**
- 许可证：MIT，完整原文位于 [web/vendor/obsidian/LICENSE](web/vendor/obsidian/LICENSE)，证据副本位于 [references/upstream-LICENSE](references/upstream-LICENSE)。
- 未修改的主程序与 README 位于 `references/upstream-index.html` 和 `references/upstream-README.md`。
- 本地运行副本 `web/vendor/obsidian/index.html` 保留原作及版权，增加本地 import map、扩展模块导入、GPU 状态分支、帧更新 / 镜头 / 焦点 / 画质 / HUD 钩子及同源控制桥。原作模式保留巨石、教堂、鲸鱼、剪辑和音效；扩展模式复用其碎片几何、材质、阴影与镜面。
- 适配范围由 `tools/adapt_upstream.py` 明确列出并可离线重建，原始上游快照保持不变。
- `web/poster.jpg` 及 `assets/` 中原作画面来自本地运行该固定版本，保留作者署名。

## Three.js

- 来源：官方 npm 包 `three@0.186.1`，与固定上游 import map 一致。
- 项目：[mrdoob/three.js](https://github.com/mrdoob/three.js)
- 版权：**Copyright © 2010-2026 three.js authors**
- 许可证：MIT，完整原文见 [web/vendor/three/LICENSE](web/vendor/three/LICENSE)。
- 原样保留构建模块与引用的 addons。压缩包 SHA-512 与模块清单见 [references/sources.json](references/sources.json)。

## 本研究新增内容

中文页面、样式、文档、控制适配器、资源准备工具、三维采样器与 GPU 扩展为本仓库新增。四种扩展不是上游原生功能。代码位于 `web/assets/extension-shapes.mjs`、`extension-system.mjs`、`studio-controls.mjs` 与 `tools/`。未新增第三方图片、字体文件、音频文件或根目录 npm 应用依赖。

## 三期 WebM 封装（历史材料）

- 来源：[Vanilagy/webm-muxer](https://github.com/Vanilagy/webm-muxer)，官方 npm 包 `webm-muxer@5.1.4`。
- 版权：Copyright (c) 2022 Vanilagy。
- MIT 许可原文保留在 [web/vendor/webm-muxer/LICENSE](web/vendor/webm-muxer/LICENSE)，ES module 与 README 原样保存。
- 包 SHA-512 与逐文件 SHA-256 见 [references/export-dependency.json](references/export-dependency.json)，通过 `tools/vendor_export.py` 可复现。
- 该库已停止维护。此处固定使用其 WebM 封装，不下载额外编码器；浏览器 WebCodecs 承担视频编码。未修改第三方模块。
- 本仓库新增完整时间线、相邻目标 GPU 变形、解析镜头、逐帧导出控制、取消 / 恢复与容器时长校正。完整动画和四种扩展均属于本地适配功能。

## 当前 MP4 / WebM 声画封装：Mediabunny

- 官方来源：[Vanilagy/mediabunny](https://github.com/Vanilagy/mediabunny)，固定 npm 包 `mediabunny@1.61.4`。
- 作者 Vanilagy，MPL-2.0。完整许可见 [web/vendor/mediabunny/LICENSE](web/vendor/mediabunny/LICENSE)。
- 未修改的 browser bundle、README、包元数据与对应 `src/` TypeScript 源文件随项目保存；来源包与逐文件哈希见 [references/media-dependency.json](references/media-dependency.json)。`tools/vendor_media.py` 可校验后复现。
- 用于浏览器 WebCodecs 声画编码与 MP4 / WebM 封装，不采集声音或下载额外编码器。该文件级许可证只作用于对应第三方代码，不为整个仓库设置统一许可证。
- 原作音效仍来自上游 MIT 合成器。离线时钟 / 输出接入、四种新增合成声音、混音、时间线同步、试听与带声音导出为本研究新增，无外部音乐素材。
