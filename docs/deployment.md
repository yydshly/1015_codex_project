# 多个 Web 的部署约定

001 AetherViz Master 与 002 image-blaster 的研究网页已于 2026-10-15 部署并实际访问验证。使用 GitHub Pages Actions，只发布已提交项目的静态构建产物；其他本地未提交研究不纳入发布。

## 构建与发布

在仓库根目录执行 `python scripts/projects.py check`、`python scripts/build_web.py`，产物为 `_site/`；可用本地 HTTP 服务预览。`.github/workflows/pages.yml` 在 main 的项目、索引或构建变更时自动构建并发布，也支持手动触发。每个子项目使用自己的依赖，静态图片、文档与许可随构建复制。001 的总览入口及 002 的能力长图均保留原图下载。

## 一个 Pages 站点，多个应用入口

GitHub Pages 每个仓库提供一个站点，可以将多个静态 Web 构建到不同子路径。已部署的站点根地址为：

```text
https://yydshly.github.io/1015_codex_project/
```

总导航与以下两个项目均已上线并验证，采用以下映射：

| 内容 | 仓库源目录 | 汇总构建目录 | 站点路径 |
| --- | --- | --- | --- |
| 总导航页 | `scripts/build_web.py` 从 `projects.json` 生成 | `_site/index.html` | `/1015_codex_project/` |
| 001 AetherViz | `projects/001-aetherviz-master/web/` | `_site/projects/001-aetherviz-master/` | `/1015_codex_project/projects/001-aetherviz-master/overview.html` |
| 002 image-blaster | `projects/002-image-blaster/web/` | `_site/projects/002-image-blaster/` | `/1015_codex_project/projects/002-image-blaster/` |

总导航从 `projects.json` 读取展示信息，保持与仓库首页一致；真实演示地址只在部署并验证成功后登记。

## 接入与发布应用时

1. 在对应的 `web/README.md` 中写清依赖、开发、构建命令和产物目录。
2. 为该应用设置正确的资源基路径，例如 Vite 的 `base` 使用 `/1015_codex_project/projects/001-example-repo/`；具体配置以实际技术栈为准。
3. 将各应用生产产物复制到对应的 `_site/projects/NNN-slug/`，生成总导航页，并在 `_site/` 添加 `.nojekyll`。
4. 在本地按上述子路径验证静态资源、页面跳转和刷新行为。SPA 优先使用 hash 路由；使用 history 路由时需处理静态站点的深层链接回退。
5. 在仓库 Settings → Pages 中选择 GitHub Actions 作为发布来源，补充构建、上传 Pages 产物与部署工作流。
6. 成功部署并验证后，把真实地址写入 `projects.json` 的 `demo_url`，再同步首页。

每个应用独立管理依赖和锁文件。不要把整个仓库直接作为网页产物上传，应只发布验证过的 `_site/` 内容。

## 需要服务端的项目

GitHub Pages 托管静态 HTML、CSS、JavaScript 等文件。需要持久服务端、数据库或运行时 API 的项目，应单独选择部署平台，按项目记录前后端地址与配置方式，并在首页索引中使用真实的外部演示链接。

## 官方参考

- [GitHub Pages 的站点类型与地址规则](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [使用 GitHub Actions 自定义 Pages 发布流程](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## 001 · aetherviz-master 发布

源库：[aetherviz-master](https://github.com/andyhuo520/aetherviz-master)。通过提示词规范指导 AI 生成生物、物理、化学等互动课件，可编排为系列课程。

`python scripts/build_web.py` 生成 `_site/`。001 的研究入口为 `projects/001-aetherviz-master/overview.html`，互动课件入口为 `projects/001-aetherviz-master/`。总览、下载长图、本地依赖与来源说明一起发布。已于 2026-10-15 部署并实际访问验证，正式地址已登记到索引。

`.github/workflows/pages.yml` 在 main 的项目、索引或构建变更时发布，也支持手动触发。只上传 `_site/`；其他项目按各自提交与验证进度接入。

实际发布：2026-10-15，首次发布提交 `b7b8c15`，Pages 任务 `38721920976` 成功。[在线研究总览](https://yydshly.github.io/1015_codex_project/projects/001-aetherviz-master/overview.html) · [互动课件](https://yydshly.github.io/1015_codex_project/projects/001-aetherviz-master/)。总导航、总览、三个案例及长图资源均已访问验证。

## 002 · image-blaster 实际发布

2026-10-15：内容提交 `6acb94b` 已推送并部署，[Pages 任务 38724012877](https://github.com/yydshly/1015_codex_project/actions/runs/38724012877) 成功。[研究与交互演示](https://yydshly.github.io/1015_codex_project/projects/002-image-blaster/) 已实际访问，总导航、长图、样式、脚本、三维依赖与扩展文档均返回 200，长图与本地原图一致。

引导图使用本研究生成的能力全景图；页面说明库的能力、外部模型分工、工程价值与扩展建议。房间是预制机制演示，未运行付费生成 API。只接入 002，其他未提交项目保留在工作区。真实地址在部署成功后回填索引。
