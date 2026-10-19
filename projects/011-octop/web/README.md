# 011 · Octop 研究网页

纯 HTML / CSS / JavaScript，零第三方前端运行依赖，无后端、账户或模型 API。兼容仓库既有 GitHub Pages 子路径，静态资源均为相对路径。

## 运行与构建

在仓库根目录运行：

```powershell
python projects/011-octop/tools/build_research.py
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8872 --directory _site --bind 127.0.0.1
```

访问 `http://127.0.0.1:8872/projects/011-octop/`。目录 `_site/projects/011-octop/` 是汇总构建产物，保持被 Git 忽略。`research.json` 为研究文字的数据源，生成脚本输出浏览器数据、笔记和自绘 SVG；修改内容后重新生成。

只预览源码也可使用 `python -m http.server 8872 --directory projects/011-octop/web --bind 127.0.0.1`。下载资料已随网页保存在 `assets/docs/`，不依赖仓库外的相对路径。

也支持在普通浏览器直接打开 `index.html`，交互数据由同目录静态脚本加载，不依赖 `fetch`、CDN 或网络连接；外部证据链接需要联网。预览服务是可选的。

## 交互与边界

- 八项能力按已有 / Beta / 路线图筛选。
- 三个任务情景、七步链路，可点击和前后导航。
- 部署位置 / 模型位置切换，解释执行与数据流向。
- 四产品对比与三种使用目标建议。
- 六个讨论问题、六条支持键盘导航的扩展路径。
- 来源分类、搜索、无结果状态，以及 Markdown / SVG 下载。
- 窄屏对比表与链路各自在内部滚动，正文不横向溢出；支持减少动态效果偏好。

这些交互是说明性模型，不执行真实 Octop 任务。研究网页验证与上游运行验证分别记录。

## 发布

使用根目录现有 `scripts/build_web.py` 与 `.github/workflows/pages.yml`，子路径为 `/1015_codex_project/projects/011-octop/`。已于 2026-10-20 部署并实际访问：[在线研究网页](https://yydshly.github.io/1015_codex_project/projects/011-octop/)。真实地址在访问成功后回填 `demo_url`。

内容提交 `199d994` 的 [Pages 任务](https://github.com/yydshly/1015_codex_project/actions/runs/39293559756) 成功。线上 84 项页面与资源检查、17 项导航 / 原图 / 上游快照检查通过；本地全景图另有 14 项检查。记录位于子项目 `references/deployed-browser.json`、`references/deployed-verification.json`，线上截图为 `assets/deployed-*.png`。只发布已提交研究，不运行 Octop 后端或真实模型任务。

完整规则见 [多 Web 部署说明](../../../docs/deployment.md)。
