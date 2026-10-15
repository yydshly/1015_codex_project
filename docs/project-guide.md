# 研究与收录规范

## 新增研究项目

在仓库根目录运行，替换命令中的示例信息：

```sh
python scripts/projects.py new example-repo --name "示例项目" --repo "https://github.com/owner/example-repo" --summary "研究它解决的问题与核心设计" --tag "开发工具" --tag "Web"
```

命令从 `projects.json` 现有编号与项目目录中选取最大编号加一，创建 `projects/001-example-repo/` 并同步首页。`slug` 使用小写英文、数字和连字符；编号为 `001` 至 `999`。

模板保存在 `templates/project/`，可按实际研究需要扩展。示例中的仓库地址需要替换为真实上游，工具只检查格式，不判断上游内容或许可证。

## 编号与索引

- 编号表示收录顺序，首次分配后固定，不因状态或标题变化而改变。
- 首页始终按编号升序展示，即使 JSON 条目次序改变也不会影响展示顺序。
- 不再研究的项目使用 `archived`；保留条目和目录，避免复用旧编号。
- 目录统一为 `projects/NNN-slug/`。同一个仓库持续研究时，直接更新现有条目。
- 标题、摘要、状态、标签、封面与演示链接统一在 `projects.json` 维护；详细结论写在子项目 README 与笔记中。

| 状态值 | 首页显示 | 含义 |
| --- | --- | --- |
| `planned` | 待研究 | 已收录，尚未开始 |
| `researching` | 研究中 | 正在复现或阅读源码 |
| `completed` | 已完成 | 本轮研究目标已达成 |
| `archived` | 已归档 | 暂停维护并保留成果 |

更新索引：

```sh
python scripts/projects.py sync
python scripts/projects.py check
```

`sync` 只更新顶层 README 的 `PROJECTS:START` 与 `PROJECTS:END` 标记之间的内容。`check` 检查登记信息、目录、必要文档、图片路径和首页是否同步，任何错误都会返回非零退出码。推送和提交合并请求时会自动运行检查。

## 图片与摘要

每个子项目创建时都有明确标记为占位图的 `assets/cover.svg`。跑通项目后补充真实截图，例如 `assets/cover.png`，并同步修改子项目 README 与 `projects.json` 的 `cover`。

`cover` 使用相对子项目目录的路径，例如 `assets/cover.png`。支持 SVG、PNG、JPEG、WebP 与 GIF；建议横向截图并在文档中说明展示内容。引用上游截图时记录原始链接、版本与许可。

首页展示「编号、标题、摘要、状态、研究入口、上游入口、演示入口」和封面。摘要应说明用途或研究价值，避免把长篇研究记录放到首页。

## 推荐研究步骤

1. 确认上游仓库、研究 tag / commit、许可证和希望验证的问题。
2. 跑通最小示例，记录真实环境与操作，保存截图。
3. 阅读入口与核心模块，用文件位置和运行结果记录依据。
4. 完成至少一个实验或改造，将自己的实现放到项目内。
5. 更新结论、状态、封面；有 Web 时再补充实际部署地址。

上游源代码需要单独克隆时，优先放在本仓库之外。确需纳入研究目录时，清楚标记来源、版本与许可，并按具体情况选择少量代码引用、依赖或 Git submodule。
