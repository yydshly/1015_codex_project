# 能力总览与职业探索网页

原生 HTML/CSS/JavaScript，无包安装、构建依赖、账号或密钥。项目内 assets 包含规则证据、合成样本、固定来源与 MIT 文本。

assets/standalone.html 是可直接用浏览器打开的独立副本，内嵌样式、脚本和数据。源码或样本变化后先运行 `python projects/014-boss-agent-overview/scripts/package_standalone.py` 更新，再汇总构建。

仓库根目录：

```powershell
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8773 --bind 127.0.0.1 --directory _site
```

访问 <http://127.0.0.1:8773/projects/014-boss-agent-overview/>。使用仓库既有构建器：index.html、styles.css、app.js、assets 自动复制；extensions、notes、THIRD_PARTY 与 references 随既有规则保存。来源 008 的实验链接指向同一站点的原项目。

交互：三角色切换、五步原理、六种访问场景、技术对照表展开、三输出视图、城市/双福利筛选、JSON 复制、三职业方向、已有技能勾选、样本核对、六目标与原型之间跳转；tab 支持方向键与 Home/End。新增独立风险章节，architecture.md 随既有构建规则复制。

网页以本研究生成的 boss-agent-panorama.png 原文件作为引导图，提供完整图弹窗、原尺寸 / 适应宽度、关闭与 PNG / SVG 下载。手机和桌面的长图滚动都限制在弹窗内。“我们的理解”先交代业务工具层、三种平台取数路径、效果边界和职业探索价值，再进入详细能力、原理与风险。

独立 HTML 内嵌一次 PNG / SVG 数据并复用到预览和弹窗；同一张原图不做改绘，也不依赖外部图片服务。

`node projects/014-boss-agent-overview/scripts/verify.mjs` 从仓库根目录运行 30 项规则与画像检查。网页所有数据与分析在本地执行；未连接 BOSS 或模型。

GitHub Pages 基路径为 `/1015_codex_project/projects/014-boss-agent-overview/`，所有资源使用相对地址。已于 2026-10-20 部署并实际验证：[正式网页](https://yydshly.github.io/1015_codex_project/projects/014-boss-agent-overview/)。索引 demo_url 在成功发布及线上复核后填写。
