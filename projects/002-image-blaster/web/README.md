# 002 · image-blaster 研究网页

原生 HTML / CSS / JavaScript，三维房间演示使用项目内保存的 Three.js r134 与官方 OrbitControls。无需 npm 安装、CDN、在线模型调用或密钥输入。

## 构建与启动

在仓库根目录：

```sh
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8082 --bind 127.0.0.1 --directory _site
```

访问 <http://127.0.0.1:8082/projects/002-image-blaster/>。源码入口 `web/index.html`；汇总产物 `_site/projects/002-image-blaster/`。资源均为相对路径，锚点切换无 history 回退要求。默认研究内容在 HTML 中，流程详情与逐项对比通过本地 JavaScript 切换。

## 交互

- 能力全景长图：作为首屏引导图，在定位章节提供预览、原图与 PNG 下载；位于 `assets/image-blaster-overview-v1.png`，随静态构建复制，离线可读。
- 房间四步演示：从完整房间图片到空背景和三张参考图，再查看独立网格与组合场景；支持播放、暂停、上/下一步和键盘切换。
- 三维操作：拖动旋转、滚轮或双指缩放；组合阶段先按网格摆放，可切换到预设布局，单独移动绿椅和切换花瓶版本。
- 房间图是预制三维场景本地渲染的二维图片，参考图和模型均预先构造；不调用抠图、图生三维、声音或物理仿真服务。点状环境只是表示方式示意，不是实际高斯泼溅。
- 八步流程：点击步骤查看输入、执行者、输出、边界及固定版本源码；支持键盘上下移动。
- 模型表：区分默认和可选提供商，并说明 FAL 的平台角色。
- 逐项对比：切换 Atlas / 月门水庭、古人说唱、AetherViz 和随机门。
- 完整矩阵、价值判断、证据与验证范围均可直接阅读。
- 扩展方向：质量验收、辅助布局、成本面板、混合建模、叙事互动和在线协作；明确标注为研究建议，提供验收方法。
- “展开全部证据”按钮统一展开或收起来源说明。

所有交互用于研究说明，不会提交上游生成请求。浏览器本身不需要联网即可读主体内容；打开上游源码链接需网络。

房间几何与交互逻辑位于 `models.js`，已有研究页面逻辑位于 `app.js`。Three.js、控制器和 MIT 原文保存在 `vendor/`，随现有构建脚本复制。没有 WebGL 时显示静态房间示意与兼容性说明。

## 发布

已于 2026-10-15 通过现有 Pages 工作流部署并访问验证：[线上研究与交互演示](https://yydshly.github.io/1015_codex_project/projects/002-image-blaster/)。路径为 `/1015_codex_project/projects/002-image-blaster/`；`demo_url` 已在验证成功后更新。后续按 [部署约定](../../../docs/deployment.md) 发布。

构建保留能力、架构、比较文档、第三方说明和 references 来源。验证见 [notes.md](../notes.md)。
