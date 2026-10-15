# Pulse 静态研究页

无第三方运行依赖，使用 HTML、CSS 与浏览器原生 JavaScript。`overview.html` 是研究总览，`index.html` 提供目录入口。原始概览图和来源目录 JSON 位于 `assets/`。

在总仓库根目录执行：

```sh
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8085 --bind 127.0.0.1 --directory _site
```

访问 `http://127.0.0.1:8085/projects/005-pulse/overview.html`。生产产物为 `_site/projects/005-pulse/`，GitHub Pages 子路径 `/1015_codex_project/projects/005-pulse/overview.html`。资源全部使用相对路径，导航使用锚点，不需要服务器路由回退。

交互包括来源目录搜索 / 验证等级筛选、完整引导图查看和合成日志记账示例。目录内容已直接渲染在 HTML 中，关闭 JavaScript 仍能阅读研究。页面不扫描本地 Agent 文件、不请求真实模型或统计服务。

引导图 PNG 与 SVG 原样来自本次对话生成文件，下载无需外部服务。研究源文档与固定版本证据在上级目录及 `references/`；构建工具会保留允许发布的文档与证据。

## 正式部署

[在线研究总览](https://yydshly.github.io/1015_codex_project/projects/005-pulse/overview.html) 已于 2026-10-15 发布并实际访问验证。发布与浏览器检查记录见上级 [notes.md](../notes.md)。
