# 第三方来源与许可证

本文件记录本子项目来源，不为整个研究仓库选择统一许可证。

## AetherViz Master

- 来源：<https://github.com/andyhuo520/aetherviz-master>。
- 版本：`a1c005f86e9aca18e75917bd5eb38f454bd24a68`。
- MIT，Copyright (c) 2026 andyhu。
- 快照：[SKILL](references/upstream-SKILL.md)、[README](references/upstream-README.md)、[完整许可证](references/upstream-LICENSE)。
- 本研究参考教学结构、技术选型和混合渲染设计；可运行课件由本次研究实现，并非上游现成案例。

## Three.js 与 OrbitControls

- npm：`three@0.134.0`；[上游 r134](https://github.com/mrdoob/three.js/tree/r134)。
- 文件：`web/vendor/three.min.js`、`OrbitControls.js`。
- MIT，Copyright © 2010–2021 three.js authors。
- [完整许可](web/vendor/three-LICENSE.txt)。控制器采用包内官方文件。

## KaTeX

- npm：`katex@0.16.11`；[上游 v0.16.11](https://github.com/KaTeX/KaTeX/tree/v0.16.11)。
- 文件：`web/vendor/katex.min.js`、`katex.min.css`、`fonts/`。
- MIT，Copyright (c) 2013–2020 Khan Academy and other contributors。
- [完整许可](web/vendor/katex-LICENSE.txt)。

## 科学数据与截图

- [NIST CCCBDB：H₂O 实验几何](https://cccbdb.nist.gov/expgeom2x.asp?casno=7732185)，2026-10-15 查阅。引用 O–H 0.958 Å、夹角 104.4776°，教学演示近似为 104.5°。没有复制网站图片。
- 力学与正弦使用文档明确列出的基础关系，假设见研究笔记。
- 碰撞实验参考 [OpenStax 冲量与碰撞](https://openstax.org/books/university-physics-volume-1/pages/9-2-impulse-and-collisions)与[碰撞类型](https://openstax.org/books/university-physics-volume-1/pages/9-4-types-of-collisions)，2026-10-15 查阅。公式、简化假设与验证见 [collision-analysis.md](collision-analysis.md)；没有复制教材插图或大段正文。
- `assets/cover.jpg`、`newton.jpg`、`sine.jpg`、`molecule.jpg`、`mobile.jpg`：2026-10-15 本子项目实际运行截图。
- `assets/collision.jpg`、`collision-analysis.jpg`、`collision-mobile.jpg`：同日第三轮碰撞实验的真实运行截图；封面同步为本轮画面。
- `assets/guided-collision.jpg`、`guided-full.jpg`、`guided-mobile.jpg`：同日第四轮慢速分阶段讲解的真实运行截图；当前封面使用此轮桌面画面。
- `assets/cover.svg` 为新项目模板旧占位图，索引已改用真实截图。
- `web/assets/overview/collision.jpg`、`sine.jpg`、`molecule.jpg`：2026-10-15 本轮直接从研究演示画布区域取得的真实截图；分别为碰撞冲量帧、正弦函数和 104.5° 参考分子结构。
- `web/assets/overview/research-map.jpg`：同日由 `web/overview.html?poster=1` 的完整页面实际截图导出，包含自行整理的研究图解与上述三个案例画面。课程路线和产品扩展明确标为设想，没有复制上游宣传配图。

部署产物保留本文件、上游许可与 vendor 完整许可；原始上游文档快照保存在研究源码目录。

上线记录：`assets/deployed-overview.jpg` 为 2026-10-15 本研究 GitHub Pages 总览页的真实访问截图。`assets/research-map.jpg` 与 `web/assets/overview/research-map.jpg` 为同一张发布用总览图。
