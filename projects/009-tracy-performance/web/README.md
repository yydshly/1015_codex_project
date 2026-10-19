# 009 · Tracy 中文研究网页

语言/API 与质量检测补充：新增 #integration-support 对照与 #quality-roadmap，说明官方语言、第三方绑定、GPU API、业务库边界和 SDK 扩展。图形原文件保持不变，页面展示的是设计说明，未实现自动质量检测服务。

原生 HTML、CSS、JavaScript。无 npm 应用依赖、外部字体或运行时 API。页面图形与交互由本项目编写，不是 Tracy WebAssembly 实例。

## 构建与预览

在仓库根目录运行：

~~~powershell
python scripts/projects.py check
node --check projects/009-tracy-performance/web/app.js
python scripts/build_web.py
python -m http.server 8769 --bind 127.0.0.1 --directory _site
~~~

- 入口：<http://127.0.0.1:8769/projects/009-tracy-performance/>
- 源目录：projects/009-tracy-performance/web/
- 产物：_site/projects/009-tracy-performance/
- 预期 Pages 路径：/1015_codex_project/projects/009-tracy-performance/
- 公网发布：2026-10-19 已部署并实际验证，入口为 <https://yydshly.github.io/1015_codex_project/projects/009-tracy-performance/>，demo_url 在成功验证后登记。

沿用[仓库部署约定](../../../docs/deployment.md)。不修改构建器，不上传整个仓库，不把预期路径作为真实演示地址。

## 可操作内容

- 3 个时间轴场景、24 个示意帧、2 种 CPU 记录方式、锁事件开关与区间证据查看。
- 4 个原理页签，支持方向键及 Home / End。
- 22 项产品的层级筛选、语言与平台搜索、空结果反馈。
- 3 个合成候选、0–30% 退化阈值、正确性优先判定。
- 章节导航、FAQ、固定源码链接与研究资料。

所有数字、调用栈、行号和验收结果都标注为机制示意。页面不会分析用户程序或启动 AI 优化。

assets/upstream.js 由 ../src/collect_sources.py 生成，页面可离线展示固定版本。除用户显式点击外部来源外，不发起第三方请求。

## 2026-10-19 补充

新增理解长图与多语言/代码来源说明。原图为 assets/understanding-map.png 与 .svg；支持弹窗滚动、原始尺寸、下载和 Escape 关闭。产品数据由 ../references/products.json 集中维护，运行 ../src/build_overview.py 同步网页数据与图形。新增语言/场景选择，22 项明确输出、接入、差异与边界。

## 正式发布验证

通过仓库既有 Pages Actions 发布，内容提交 417cb4f，首轮任务 39240151135 成功。19 项 HTTP 检查核对页面、文档、导航与源文件一致性；20 项线上交互检查覆盖长图、下载、筛选、时间轴、验收和手机/窄屏。完整引导图原文件也用作导航封面，不使用旧的裁剪图替代。

验证记录位于 ../references/deployment-verification.json 与 deployment-browser.json。src/verify_published.py 可重查线上静态文件，验证网页不等于验证上游性能效果。
