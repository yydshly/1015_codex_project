# 多个 Web 的部署约定

初始化阶段先约定目录与路径。当前没有 Web 应用、线上站点或 Pages 发布工作流；首个应用确定技术栈后再补充实际构建和部署配置。

## 一个 Pages 站点，多个应用入口

GitHub Pages 每个仓库提供一个站点，可以将多个静态 Web 构建到不同子路径。该仓库的默认站点根地址将是：

```text
https://yydshly.github.io/1015_codex_project/
```

地址在启用 Pages 并成功部署后才有效。各应用采用以下映射：

| 内容 | 仓库源目录 | 汇总构建目录 | 站点路径 |
| --- | --- | --- | --- |
| 总导航页 | 后续实现时确定 | `_site/index.html` | `/1015_codex_project/` |
| 第一个应用（示例） | `projects/001-example-repo/web/` | `_site/projects/001-example-repo/` | `/1015_codex_project/projects/001-example-repo/` |
| 第二个应用（示例） | `projects/002-another-repo/web/` | `_site/projects/002-another-repo/` | `/1015_codex_project/projects/002-another-repo/` |

表中的子项目仅用于说明路径，不代表已收录或部署的项目。总导航页届时从 `projects.json` 读取展示信息，保持与仓库首页一致。

## 添加首个应用时

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
