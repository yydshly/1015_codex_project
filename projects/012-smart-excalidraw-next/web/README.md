# 012 · 场景研究网页

中文静态展示页。HTML / CSS / JavaScript 负责研究内容、筛选和步骤切换；一个 React 岛集成真实 Excalidraw 0.18.0，负责图形渲染、编辑、SVG 与 `.excalidraw` 导出。预设场景并非模型实测输出。

## 本地运行

在仓库根目录：

```powershell
python scripts/build_web.py
python -m http.server 8884 --directory _site --bind 127.0.0.1
```

打开 `http://127.0.0.1:8884/projects/012-smart-excalidraw-next/`。也可以用静态服务器直接托管本 `web/` 目录。画布包含 ES 模块，使用 HTTP 服务预览，不直接双击 HTML。

## 修改与重建

- 页面结构：`index.html`；样式：`styles.css`。
- 所有研究文案与六套样例数据：`assets/research-data.js`。
- 场景、图种、步骤与来源交互：`app.js`。
- 真实画布组件：`../src/canvas.jsx`。
- 预打包的浏览器依赖、字体与许可证：`vendor/`。

只有修改画布组件或依赖才需重建。在本子项目目录执行：

```powershell
npm ci
npm run build
```

`../tools/build-canvas.mjs` 用 esbuild 将画布打包到 `web/vendor/`，并保存本地字体和依赖许可声明。无需修改仓库根目录依赖与构建脚本。构建产物随本子项目保存，现有 Pages Actions 可以直接发布静态资产。

## 交互

- 引导区使用本次绘制的完整全景 PNG；弹窗滚动、原尺寸阅读、PNG / SVG 下载，保留原始文件。

- 六个业务场景切换，三类输入方式说明；提示词复制。
- 真正可编辑的 Excalidraw 图形，场景重置、SVG 与原生文件导出。
- 22 类图表按用途筛选、关键词搜索、空结果提示和图种说明。
- 五步原理切换、方向键导航与固定版本源码链接。
- 六个扩展场景说明输入资料、目标效果与必要开发条件。
- 主要源文件本地快照、笔记下载、验证范围与许可说明。

切换场景会重置画布，修改不做跨场景保存，请在切换前下载需要保留的内容。本页没有 API Key 输入、AI 调用或后端。文本 / 文件 / 图片切换展示输入路径，不执行任意内容生成或图片识别。

## 构建与发布

根目录 `python scripts/build_web.py` 将 `index.html`、`styles.css`、`app.js`、`assets/`、`vendor/`、研究文档与源码快照复制到 `_site/projects/012-smart-excalidraw-next/`。使用相对资源路径和 hash 章节锚点，兼容 Pages 子目录。

尚未部署，不预填 `demo_url`。发布规范见 [docs/deployment.md](../../../docs/deployment.md)。
