# 004 · Obsidian 程序化碎片变形研究：Web 演示

原生 HTML / CSS / JavaScript。原作使用 Three.js 0.186.1 与 GLSL 3，依赖已保存到 `vendor/three/`；`vendor/obsidian/` 保存本地适配的上游实现与许可证。无需 npm 安装或后端，首次启动不连接 CDN。

## 启动与构建

仓库根目录：

```sh
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8084 --bind 127.0.0.1 --directory _site
```

访问 <http://127.0.0.1:8084/projects/004-obsidian/>。所有资源使用相对路径，页内导航使用锚点。必须通过 HTTP 服务打开 ES modules，不能用 `file://`。

生产输出为 `_site/projects/004-obsidian/`；Pages 子路径 `/1015_codex_project/projects/004-obsidian/`。第三方必要模块作为 vendored 源码保留在项目内；不提交 npm 的 node_modules 或构建产物。尚未发布线上地址。

## 操作与范围

- 默认低画质自动启动 48 秒完整循环；减少动态效果设置下等待手动启动。
- 原作模式下的五个定格按钮会暂停并定位；“继续播放”恢复循环。自由视角支持拖动、缩放和平移。
- 三档画质会重新生成对应碎片；下方显示实际数量。声音在原画面内明确开启。
- “关闭演示”卸载 iframe；重新启动会再次初始化。标签隐藏时暂停，回来后由用户恢复。
- 上方模式栏可切换原作、星系、龙卷、双螺旋和文字；四种扩展共用原作 GPU 三维碎片、材质、阴影和镜面。旁边提供几何参数、聚合度、旋转速度、碎片尺寸和扰动。
- 文字支持最多 8 个字符，具有正面、背面和侧边；可调整厚度 / 宽度，并用自由视角检查立体结构。
- “独立打开”使用所选形态的默认参数；完整调参面板位于本研究页。
- 切换与几何参数修改以 GPU 当前姿态为过渡起点。暂停后修改直接显示；“散开再重组”会恢复播放并从散开状态聚合。切换画质会同步重建目标数量。
- 场景筛选展示 12 个扩展方向；原理区提供四步说明。
- “完整循环”按原作 18 秒 → 星系 7 秒 → 龙卷 7 秒 → 双螺旋 7 秒 → 文字 7 秒 → 回归巨石 2 秒编排。每个新阶段前 2 秒过渡，镜头连续环绕 / 升降；结尾接回开场。章节按钮和时间轴可暂停定位。
- 在单形态模式修改参数后，完整循环与视频导出使用这四组参数。重新播放完整循环从 0 秒开始。
- 点击“开启声音”后试听完整声轨，可调音量，暂停 / 定位时声音同步停止 / 跳转。原作的声音来自保留的合成器；新增星系泛音 / 星尘钟、龙卷风场 / 低频风压、双螺旋左右声部 / 脉冲、文字细点 / 落定和弦，2 秒交叉淡化接回原作和弦。单形态模式试听相应段落。
- “导出完整视频”使用当前画质，默认生成完整 48 秒带声音 MP4（H.264 / AAC，48 kHz 立体声），也可选择 WebM（VP9 / Opus）或取消声音。支持 720p / 1080p、24 / 30 fps，采用上方音量。试听静音与导出声音开关独立。
- 画面按固定时间逐帧渲染，完整音轨从同一时间零点编码，设备耗时不改变声画时长。完成后自动下载并显示视频预览，可再次下载；可取消，随后恢复原预览位置、播放状态、自由视角与声音。
- 视频编码需要 WebCodecs，在新版 Chrome / Edge 的 localhost / HTTPS 页面使用。编码不受支持时显示明确说明；无摄像头 / 麦克风权限，不上传数据。原作 `?capture` 录制入口仍保留，PNG 序列本轮未实测。

三维演示需要 WebGL 2 和 `EXT_color_buffer_float`，不支持时显示错误提示；中文研究内容仍可阅读。首次几何生成与着色器编译可能较慢，未承诺所有设备固定帧率。

## 检查与依赖复现

```sh
node --check projects/004-obsidian/web/app.js
node --check projects/004-obsidian/web/assets/extension-system.mjs
node --check projects/004-obsidian/web/assets/studio-controls.mjs
node --test projects/004-obsidian/tests/*.test.mjs
python projects/004-obsidian/tools/verify.py
python scripts/projects.py check
python scripts/build_web.py
```

如需从固定版本重新下载第三方资源：

```sh
python projects/004-obsidian/tools/vendor_upstream.py
```

此操作联网，校验 npm 包 SHA-512，保存实际引用模块闭包与许可证，并重新生成本地适配副本。验证记录见 [notes.md](../notes.md)。

当前声画封装依赖 `mediabunny@1.61.4`（MPL-2.0），未修改的 bundle、对应 TypeScript 源文件和完整许可保存在子项目 `vendor/mediabunny/`。运行 `python projects/004-obsidian/tools/vendor_media.py` 可按固定包 SHA-512 和逐文件 SHA-256 恢复，无根目录 npm 依赖。原 `webm-muxer@5.1.4` 与时长修正仅保留为三期历史实现 / 验证材料，当前导出使用 Mediabunny 的 MP4 / WebM 封装。

只修改接入钩子或控制桥时，可离线重新生成适配副本：`python projects/004-obsidian/tools/adapt_upstream.py`。三维模块位于 `web/assets/`，汇总构建会原样复制。固定上游快照与第三方模块不被覆盖修改。

完整约定见[多 Web 部署说明](../../../docs/deployment.md)。

## 理解总览图

页面 `#understanding` 汇总研究共识，区分上游已有、本研究已实现、后续扩展三类内容。`assets/understanding/obsidian-understanding.svg` 是 1920 × 4280 的独立长图，含七张实际成片画面；另有文字解读、可缩放 / 分段定位的阅读窗口和本地 PNG 下载。使用现有页面样式，无新增第三方依赖。

离线更新图文：`python projects/004-obsidian/tools/build_understanding.py`。已保存的 JPEG 帧足以重建 SVG，不需要样片。带 `--extract` 时需要本地忽略的 `exports/obsidian-complete-48s-720p-sound.mp4` 与 ffmpeg，按固定时间抽帧；更新后运行汇总构建并检查页面。PNG 从页面下载按钮生成，保持与当前 SVG 一致；`assets/understanding/obsidian-understanding.png` 保存了一份当前导出，修改 SVG 后也应通过页面重新下载更新。
