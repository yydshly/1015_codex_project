# GitNexus 中文研究网页

首页 `#overview` 使用前文整理的整体能力与流程引导图，替换结算函数的局部示意。`assets/research-guide.mmd` 保留源内容与连线，`assets/research-guide.svg` 为静态原图，与项目 `assets/cover.svg` 字节一致。点击图片可打开原生 dialog，支持适应宽度、原始尺寸、滚动、Esc 关闭与原图／源文件下载。静态网页无需 Mermaid 运行时；仅复现导出时，`src/render-guide.html` 读取固定 CDN Mermaid 版本，导出后由 `src/finalize-guide.py` 处理章节标题和一致性记录。

研究总览按“能力 → 原理 → 真实效果与验证 → 同类对照 → 研究启发 → 产品方向”组织。`#insights` 的 4 项判断有原始材料链接；`#directions` 的 5 个方向均标为未实现，展开可看工作流、建设缺口和验证方法。`assets/research.css` 提供新章节样式，完整文字在随构建发布的 `extensions.md`。主页面及独立工作台的共享定位总结可直接跳转新章节；更新共享资源时同步更新 HTML 中的版本参数。

原生 HTML / CSS / JavaScript / SVG，无需 npm、CDN、外部字体或模型密钥。`assets/evidence.json` 来自固定版本实跑，原始文件位于项目 references/。

从仓库根目录运行：

```powershell
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8096 --bind 127.0.0.1 --directory _site
```

访问 `http://127.0.0.1:8096/projects/006-gitnexus/`。采用相对资源路径和锚点，支持 Pages 子路径。必须通过 HTTP 加载 JSON，不保证双击 file 模式工作。仅预览网页可将服务 directory 设为本项目 web/；文档和证据完整链接以汇总构建为准。

主要功能为能力介绍、六步原理页签、真实 CALLS 关系探索、源码查看、指标与检查、原始查询和复现边界。同类对照区新增三个工具的重点与运行结构、区别矩阵、相对优势、能力交集及四种可切换任务。支持键盘选点、两组页签方向键、减少动画偏好和响应式布局。

`assets/comparison.css` 和 `assets/comparison.js` 分别实现对照区样式与教学任务切换，随既有 assets/ 汇总构建；无需修改根构建脚本。任务操作只显示预先整理的对照说明，没有执行 Ix / CodeFlow。原有实测数据不随选择改变。

页面不运行上游引擎；点击图谱只在浏览器查询本次记录。更新数据需要重新采集，不能只手改关系或指标。本地 npm 依赖、数据库、解析缓存和凭据不进入发布产物。

能力效果入口 `#showcase`：七个可键盘切换的页签，展示分组、流程、上下文、完整影响、搜索、路径和 diff。`assets/showcase.css / showcase.js / showcase.json` 随 assets/ 复制，无新依赖。数据来自补充 Cypher 查询与隔离实验，原始输出位于 references/showcase-*；流程步骤按数据库顺序显示。搜索框只是过滤固定查询的结果，不表示在线语义搜索。能力覆盖表说明扩展条件及未实跑项。

2026-10-16：主入口 `#showcase / #explorer` 升级为内嵌完整工作台，独立入口 `assets/atlas.html`。`atlas.js / atlas.css / atlas.json / advanced.json / business-probes.json` 全部随 assets/ 复制。无第三方绘图库、CDN、新根依赖。完整 SVG 图谱有缩放、拖动、键盘平移与节点选择；12 类能力共用图和源码检查器，高级部分使用独立真实索引。12 步导览与 Agent 步骤属于教学编排。旧七种页签及简单函数图保留在折叠档案中。
