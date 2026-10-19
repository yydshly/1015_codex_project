# 来源、归属与许可边界

## 上游目录及精选源码快照

- 项目：[awesome-zhuiju-free](https://github.com/laoma528/awesome-zhuiju-free)。
- 作者/维护者：laoma528 及上游贡献者；贡献记录以原仓库为准。
- 固定提交：`d1049a3af73c068c390decc92eebe9bff84d52a0`。
- 上游许可：Creative Commons Attribution 4.0 International，原文保留于 [references/upstream/LICENSE](references/upstream/LICENSE)。
- 本项目保存 17 个精选文件供研究核对，文件内容未作改写；来源 URL、哈希与捕获时间见 [manifest](references/upstream-manifest.json)。
- 中文研究说明、统计、架构图和成本工具为本研究新增；不将它们冒充上游已有实现。

目录和相关源码的许可不延伸为目录内第三方影片、海报、商标、字幕、网站、配置或接口的授权。不为整个多项目仓库选择或更改统一许可证。

## 007 的关联证据

007 的实现、HLS.js 及其许可说明仍以 [007 THIRD_PARTY.md](../007-zhuiju-source-demo/THIRD_PARTY.md)为准。本项目链接已有报告；本地联合服务通过导入和文件路由复用 007 代码与播放器依赖，不另行复制或去除其许可。

README 引用的实际播放截图来自 007，展示了当时第三方画面。影片画面权利归其相应权利人；截图作为有限技术验证记录，不作宣传授权或内容再分发许可的证明。未在 010 保存完整影片或视频分片。

## 外部商业服务资料

Filmhub、Bunny、Cloudflare、Google/YouTube、Pexels、Pixabay 等文档、品牌与商标归相应权利人。我们主要记录事实、简短说明和原文链接，不复制其整站文档，也未与其建立已确认的供应关系。

公开条款、价格和帮助页可能更新；本项目注明核查日期与适用对象，不替代后续签署的合同。供应商管理密钥、账号和报价不应写入公开研究仓库。

## 开放电影

Big Buck Bunny、Sintel 仅作为已找到明确许可依据的候选作品，在来源文档链接其制作方许可页面。010 没有打包或托管这些电影；后续实际使用时需核查具体文件、署名、完整片尾、商标排除项等条件。

## 本项目封面

`assets/cover.svg` 是本研究用 SVG 代码绘制的资源发现、授权、产品和分发关系图，未使用外部照片、商标或影片画面。它是原创研究示意图，不是视频云服务或上游产品的界面截图。

## 网页与文档转换

2026-10-19 新增的 `web/index.html`、`styles.css`、`app.js`、站点图标和页面内关系示意由本研究编写。研究主页面未复制上游网站界面，不加载第三方字体、前端库或跟踪脚本。用户主动加载的 007 播放器使用其本地 HLS.js，沿用 007 的许可说明。`web/assets/playback-evidence.jpg` 是前述 007 历史截图的副本，权利边界相同。

`tools/prepare_web.py` 在开发时使用 [Python-Markdown](https://python-markdown.github.io/)（BSD 3-Clause）把本研究 Markdown 转换为 HTML；依赖声明独立放在 `web/requirements.txt`。浏览器产物没有打包其 Python 运行代码。生成的附件保留上游原始许可证、007 来源说明与原文件名。

## 2026-10-19 研究全景长图

`assets/research-overview-20261019.png` 和同名 SVG 为本研究根据既有文档与实测报告精确排版绘制的八部分长图。内置 imagegen 尝试遇到网络错误，最终采用原创 SVG 排版并由 Pillow 导出 PNG，没有使用图像 API CLI。构图和内容稿保留在 `assets/research-overview-prompt.txt`，实际绘图源代码为 `tools/draw_overview.py`。

图中的播放器是代码绘制的界面示意，不作为新截图；验证数字来自 `references/live-demo-integration.json`。图中使用本机字体渲染，未分发字体文件。该图不改变上游、第三方影片、服务条款及商标的权利归属，也不为整个仓库增加统一许可证。
