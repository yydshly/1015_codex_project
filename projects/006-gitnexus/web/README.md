# GitNexus 中文研究网页

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
