# 仓库协作约定

- 这是按固定编号组织的多个 GitHub 项目研究仓库，主要使用中文文档。
- 新项目使用 `python scripts/projects.py new ...` 创建，目录为 `projects/NNN-slug/`。
- `projects.json` 是首页索引的数据源。修改后执行 `python scripts/projects.py sync`，不要手改 README 的 `PROJECTS` 标记区。
- 已分配编号保持不变。项目不再研究时优先标记为 `archived` 并保留来源和研究记录。
- 顶层 README 只放导航、摘要与图片，详细内容放入对应子项目。
- 子项目可以独立选择技术栈；不要在根目录强行引入所有项目共享的应用依赖。
- 修改索引工具时运行 `python -m unittest discover -s tests`；常规内容变更运行 `python scripts/projects.py check`。
- Web 项目遵循 `docs/deployment.md`，部署后再填写真实演示地址。
- 不自动选择整个仓库的开源许可证；引入上游代码时保留其许可证与版权声明。
