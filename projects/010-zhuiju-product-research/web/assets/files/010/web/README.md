# 010 · 中文交互研究网页

入口为 [index.html](index.html)。原生 HTML、CSS、JavaScript，包含八个研究章节、007 实时演示入口、三类能力切换、历史探索步骤、真实来源链路、三种流量路径、片源方式筛选、视频分发成本估算、Filmhub 专题、产品路线和完整资料阅读器。

阅读研究内容时使用固定数据。点击“加载真实搜播 Demo”后，页面内嵌原来的 007 播放器，实时查询上游；选集后加载上游 CDN 媒体。历史截图和报告继续独立保留，不替代当前响应。010 直接复用 007 后端与播放器代码，没有复制一份新的采集或播放实现。

## 依赖与准备

阅读静态研究网页无需 Node、npm、后端或外部 CDN。完整阅读资料已经预渲染并打包在 `assets/research-data.js`。修改研究 Markdown 后，在仓库根目录重新打包：

```powershell
python -m pip install -r projects/010-zhuiju-product-research/web/requirements.txt
python projects/010-zhuiju-product-research/tools/prepare_web.py
```

Python-Markdown 是开发时文档转换依赖，仅由子项目管理。打包器需要本仓库的 007 历史资料，生成的静态网页则可独立分发。它复制被引用的本地附件并保留来源目录结构，记录见 [web-package.json](../references/web-package.json)。不需要下载影片。

## 启动研究页与真实演示

在仓库根目录执行：

```powershell
python -m pip install -r projects/010-zhuiju-product-research/requirements.txt
python projects/010-zhuiju-product-research/server.py --port 8871
```

打开 `http://127.0.0.1:8871/projects/010-zhuiju-product-research/#live-demo`，点击“加载真实搜播 Demo”。独立播放器为 `http://127.0.0.1:8871/live-demo/`。一个服务同时提供研究页、007 播放器和原有 API，无须跨端口请求或改写片源。

`server.py` 通过本地模块导入复用 007 的请求校验、缓存、接口和媒体限制，只增加研究静态文件挂载、播放器路径及 `/api/research-demo` 能力标识。仅监听 `127.0.0.1`，保留本机同源检查，拒绝路径穿越和目录列举。选集后的媒体传输仍为原播放器的上游直连。用 Ctrl+C 停止服务。

## 只阅读静态网页

在仓库根目录执行：

```powershell
python -m http.server 8870 --bind 127.0.0.1 --directory projects/010-zhuiju-product-research/web
```

浏览器访问 `http://127.0.0.1:8870/`；用 Ctrl+C 停止。也可直接打开 `web/index.html` 阅读研究内容；外部来源链接仍需网络。静态 HTTP 服务没有实时 API，演示入口会显示联合服务启动方法；公网静态站点不会自动探测访问者的本机服务。

## 汇总构建与生产产物

```powershell
python scripts/projects.py check
python scripts/build_web.py
```

现有构建器会将 `index.html`、`styles.css`、`app.js` 和完整 `assets/` 复制到 `_site/projects/010-zhuiju-product-research/`，总导航自动收录本页。研究静态资源采用相对路径，阅读器用 `#read/<文档ID>`，可在子路径刷新。`/live-demo/` 与 `/api/` 属于本地联合服务，不会被静态构建器伪装成 Pages 功能。

本轮按 [仓库部署约定](../../../docs/deployment.md)通过现有 Pages Actions 发布研究页，部署及访问验证后才登记真实 URL。发布范围包括研究章节、全景图原图与 SVG、资料阅读器、来源筛选、历史搜播证据与成本计算；实时搜播后端继续本机运行。

首页引导图使用本次生成的 `assets/research-overview-20261019.png` 原图，提供完整图弹窗和 PNG / SVG 下载。图中“未公开部署”为制图时的历史状态，不改写原图；网页发布状态以发布记录为准。

## 数据口径与维护

- 网页整理日：2026-10-19；供应商资料及价格快照：2026-10-16；播放实验：2026-10-15。
- 成本计算使用与 `tools/estimate_cost.py` 相同的假设；只估算视频基础设施，不当作总预算或正式报价。
- 无效输入不会显示估算值；Volume 超出首 500 TB 时停止外推该档单价。
- 研究说明、第三方影片画面、上游 CC BY 4.0 文件及商业服务资料各自保留归属，见 [THIRD_PARTY.md](../THIRD_PARTY.md)。
- 浏览器交互、桌面/手机布局与静态资源校验记录见 [web-verification.json](../references/web-verification.json)。
- 后续接入的实时搜索、首两集播放及路由限制记录独立放在 [live-demo-integration.json](../references/live-demo-integration.json)，保留最初静态页检查。
