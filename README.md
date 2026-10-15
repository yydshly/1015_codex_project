<p align="center">
  <img src="assets/banner.svg" alt="GitHub Research Lab：发现、拆解、复现与沉淀" width="100%" />
</p>

# GitHub Research Lab

我的 GitHub 优秀项目研究总仓库。把遇到的好项目按顺序收录，记录它解决的问题、值得学习的设计，以及亲手运行和改造后的结论。

**从这里开始：** [项目索引](#项目索引) · [研究与收录规范](docs/project-guide.md) · [新增项目](#新增一个研究项目) · [Web 部署约定](docs/deployment.md)

## 项目索引

编号代表收录顺序，采用 `001`、`002`、`003`……；分配后保持不变。首页按编号升序展示，删除或归档项目时不重排其他编号。

<!-- PROJECTS:START -->

已收录 **1** 个项目，按收录编号升序展示。

| 编号 | 项目 | 源库 | 摘要 | 状态 | 入口 |
| --- | --- | --- | --- | --- | --- |
| 001 | [AetherViz Master 课件生成规范研究](projects/001-aetherviz-master/README.md) | [aetherviz-master](https://github.com/andyhuo520/aetherviz-master) | 通过提示词规范指导 AI 生成生物、物理、化学等互动课件，可按知识顺序组织为系列课程。 | 已完成 | [研究](projects/001-aetherviz-master/README.md) |

### 项目预览

#### 001 · AetherViz Master 课件生成规范研究

[![AetherViz Master 课件生成规范研究 项目预览](projects/001-aetherviz-master/assets/research-map.jpg)](projects/001-aetherviz-master/README.md)

通过提示词规范指导 AI 生成生物、物理、化学等互动课件，可按知识顺序组织为系列课程。

标签：AI Skill · 教育可视化 · Three.js

<!-- PROJECTS:END -->

## 001 · aetherviz-master：课件生成与系列课程

源库：[aetherviz-master](https://github.com/andyhuo520/aetherviz-master)。它通过提示词规范指导 AI 生成生物、物理、化学等学科的互动课件，把文字知识转为动画、参数操作、图表与解释。

其原理是“教学主题 → 外部 AI 按 Skill 编写网页 → 浏览器运行课件”。规范整理了教学结构、渲染选型、视觉与交互要求；可以按知识顺序逐课生成、统一风格并组织成系列课程，课程编排、练习和科学审核需另行设计。

上方引导图汇总了能力、原理、三个研究案例与扩展路线，并区分上游已有、本研究补充和未来设想。详见[研究总览](projects/001-aetherviz-master/web/overview.html)与[完整研究](projects/001-aetherviz-master/README.md)。

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

修改 `projects.json` 中的摘要、状态、标签或图片路径后，执行：

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
