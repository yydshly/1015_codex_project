# 架构与模型分工

## 先理解它的工程价值

**先理解和拆分，再分别生成，最后组合成场景。** 例如，输入一张包含桌子、椅子和花瓶的房间照片，Claude 先理解环境和物体，确认哪些要独立生成。图片编辑模型分别制作移除选定物体的背景图，以及每个物体的参考图。

背景图用于生成可探索环境（高斯泼溅外观与碰撞网格），物体参考图用于生成各自的三维网格。最后把环境、独立模型和声音加载到同一场景，调整布局并提供交互。

独立资产让椅子可以单独移动、花瓶可以单独替换，某个模型不好也能单独重做。拆分依赖图像理解与生成式编辑，不能理解成无损精确分割；组合仍需人工调整位置与比例，尚未自动准确恢复原图布局。核心三维生成仍来自外部模型。

## 五层架构

1. **Claude Code 控制层**：Rules 规定顺序，Skills 定义单项任务，Agents 在后台执行生成。代理使用 `model: inherit`，未固定 Claude 版本。
2. **JavaScript 脚本层**：封装图片编辑、物体、环境、音效的输入和文件处理，以 HTTP 请求访问外部服务。
3. **模型服务层**：World Labs 负责环境；FAL 提供图片编辑、物体和声音接口。
4. **本地数据层**：`worlds/<slug>/` 的目录、JSON 和二进制资产保存项目状态。
5. **网页交互层**：React / Three.js 显示，Spark 绘制高斯泼溅，Rapier 提供刚体与碰撞。

总流程主要由 Claude 按文档推进。生成代理后台运行，但代理内部的脚本同步等待结果。这不是仓库自建的一套常驻分布式任务引擎。

## 模型与接口

| 模型 | 固定版本代码中的接口 | 职责与默认参数 |
| --- | --- | --- |
| Claude | 运行 Claude Code 的模型；Agent 为 `inherit` | 观察源图、描述对象、写提示词、安排脚本 |
| Nano Banana 2 | `fal-ai/nano-banana-2/edit` | 默认图片编辑；物体参考图路径默认请求 1K、1:1 PNG |
| GPT Image 2 | `openai/gpt-image-2/edit` | 可选图片编辑；经 FAL 调用，默认 medium、auto size |
| Marble 1.1 | `https://api.worldlabs.ai/marble/v1`；`model: marble-1.1` | 场景图 + 文字生成静态环境 |
| Hunyuan 3D | `fal-ai/hunyuan3d-v3/image-to-3d` | 默认独立物体；50,000 面、PBR、Normal；支持 40,000–1,500,000 的面数参数范围 |
| Meshy v6 | `fal-ai/meshy/v6/image-to-3d` | 可选物体生成；30,000 面，开启重网格、纹理、PBR，默认关闭绑定和动画 |
| ElevenLabs SFX v2 | `fal-ai/elevenlabs/sound-effects/v2` | 文字生声音；默认 MP3 44.1 kHz / 128 kbps |

这些是研究提交里的配置，不是对当前服务可用性、模型性能或价格的承诺。FAL 是调用平台，不是另一种模型。密钥分别为 `WORLD_LABS_API_KEY` 和 `FAL_KEY`，网页讲解不需要密钥。

## 一次完整流程

1. `project-state.mjs --stage-input` 创建项目并将 `input/` 文件移入稳定的 `source/`。
2. Claude 直接看源图。写逐图 JSON，合并 `image.json`，经确认后写每个物体的 `object.json`。
3. 用图片编辑模型移除选定物体，得到 clean plate。该图作为环境生成输入。
4. 为 Marble 编写空环境文字。图片去掉的物体也要从文字中扣除，避免重新生成。提交世界任务，轮询并下载 `.spz`、碰撞 `.glb`、全景与缩略图。
5. 每个物体单独执行：原图 → 白底单物体参考图 → Hunyuan / Meshy。可并发多个物体代理，每个代理只负责一个物体。
6. 根据 `image.json` 编写环境声，根据物体材质编写撞击声。技能默认请求两段 10 秒环境音、每物体四段 1 秒音效。非循环音频经过 FFmpeg 静音处理与响度标准化，循环原样保留。
7. Vite 插件扫描本地资产并通知网页刷新。用户调整物体与场景，保存 `scene.json`。

图片清理与物体参考图制作依赖生成式编辑，不是精确分割或自动深度恢复。前景分离能避免“背景已有花瓶，又放入一个独立花瓶”的重复。

## 数据契约

| 内容 | 文件 | 原则 |
| --- | --- | --- |
| 项目身份 | `project.json` | 名称、slug、时间等基础信息 |
| 图像理解 | `source/<图>.json` 与 `image.json` | 可见证据、描述、材质、候选对象 |
| 物体身份与意图 | `output/<物体>/object.json` | 不把任务运行状态混入物体身份 |
| 请求生命周期 | `.N-<slug>__image-request.json` / `__model-request.json` 等 | request ID、接口、状态、输出与远端来源 |
| 实际资产 | `N-<slug>.png/.glb/...` | 保留版本，不默认覆盖旧结果 |
| 场景实例 | `scene.json` | assetId、位置、旋转、缩放、物理模式、光照等 |

公共 FAL 层使用 `submitFalQueue → pollFalQueue → getFalQueueResult`。本地图片转换为 data URI 等输入；提交后立刻保存 request ID。重启可利用已有请求继续查询，已有模型默认跳过。

`--reference-only` 只生成参考图；`--regenerate` 复用参考图重做模型；`--regenerate-reference` 重做参考与模型。`ensure-local-assets.mjs` 从已保存远端结果补下载，区别于再次生成。

这些机制能减少重复工作，但不能据此宣称拥有完整幂等、超时、取消、重试退避、缓存失效或分布式调度保证。

## 网页运行

- `SplatRenderer.tsx`：使用 Spark 加载 `.spz`。
- `WorldCollider.tsx`：固定三角网格碰撞体，处理世界坐标方向与比例。
- `SceneObject.tsx`：加载独立网格，主要使用盒形碰撞体和空间音效。
- `placements.ts`：无保存布局时默认网格排列。
- `PlacementEditor.tsx`：平移、旋转、缩放、复制、删除、撤销等，保存到本地接口。
- `app/vite.config.ts`：扫描 `worlds/`、提供 `/__worlds`、`/__scene-project` 及本地资源，监听变化。

生成 API 不在浏览器运行。开发服务器的保存接口不能直接当作静态部署后的持久编辑后端；生产模式主要读取打包的场景数据。这里的网页原型也没有远程多人编辑或在线三维生成服务。

固定版本的源码路径与链接见 [证据索引](references/sources.json)。

## 研究网页中的房间演示

这是本轮新增的机制演示，与上游生成系统分开：`web/models.js` 用 Three.js 构造一个预制房间和独立的桌、椅、花瓶。先在浏览器中把完整场景渲染为二维参考图，再隐藏三个物体得到空背景；物体单独渲染成参考图缩略图。

“分别生成”阶段用点状环境和线框物体展示不同资产，随后提供默认网格布局、预设房间位置和独立物体编辑。背景与模型均为本地构造，阶段切换不执行图片理解、图片编辑或三维生成。场景中的预设摆位不证明上游具备自动布局能力。
