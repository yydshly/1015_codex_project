# 来源与许可

本文件只记录 003 子项目，不为研究总仓库选择统一许可证。

## er-mario 与 libsm64

- 上游：[deltarooo/er-mario](https://github.com/deltarooo/er-mario)，v0.4.2 / `11744b855bf546ca0b66dfd09068858feaa18d0e`。
- 研究日期：2026-10-15。自有代码 MIT，Copyright (c) 2026 Delta；[完整许可](references/upstream-LICENSE)。
- 保留 [README 原文快照](references/upstream-README.md) 与 [源码证据索引](references/sources.json)。
- [libsm64](https://github.com/libsm64/libsm64) 在 er-mario 中保留 CC0；[固定提交下的许可快照](references/libsm64-LICENSE)。网页没有编译或嵌入 libsm64。
- 网页根据源码重新实现教学用坐标转换与数学比例模型，未打包模组 DLL。
- 游戏资源不属于模组的 MIT 授权；本项目没有复制 ROM、游戏模型、纹理、动画或声音。

## Three.js 与 OrbitControls

- 固定 `three@0.134.0`，[上游 r134](https://github.com/mrdoob/three.js/tree/r134)。
- 文件：`web/vendor/three.min.js`、`web/vendor/OrbitControls.js`。
- MIT，Copyright © 2010–2021 three.js authors；[完整许可](web/vendor/three-LICENSE.txt)。
- 从本仓库 001 已固定的官方包副本复制，保留文件头与完整许可；003 不依赖 001 的运行路径。

## 作者演示原帖

- 作者 Deltaroo Δ / `@Deltaroo3D`。
- [战斗原帖](https://x.com/Deltaroo3D/status/2105345162771648883)：战斗演示入口。
- [移动原帖](https://x.com/Deltaroo3D/status/2106403168829714692)：移动演示入口。
- 地址通过 [引用页一](https://istenhozott.com/mit-keres-mario-az-elden-ringben/) 与 [引用页二](https://arkade.com.br/mais-um-mod-maluco-deixa-o-mario-atravessar-a-mansao-do-vulcao-de-elden-ring-com-direito-a-pulo-triplo-e-chute-na-parede/) 追溯。引用页仅用于找原帖，不作为技术结论依据。
- 2026-10-15 在浏览器核对两条原帖嵌入内容，均显示媒体因版权方报告被停用。未能播放，未逐帧验证；原帖早于 v0.4.2，不能作为本轮本地实机验证。
- 成品页面仅保留来源与停用状态，已移除媒体嵌入与加载脚本。不下载或镜像视频。

## 原创展示

展厅布局、中文解读、低多边形角色、地形、遗迹、发光树、轨迹与视频入口配图为本研究原创。`assets/cover.jpg`、`mechanism.jpg`、`combat.jpg`、`mobile.jpg` 是本网页实际运行截图；画面是机制示意，没有使用游戏资源。

本研究非 Nintendo、FromSoftware 或其他权利方的官方项目。

## 艾雷教堂场景演示

- 建筑视觉参考：[教堂外观](https://eldendle.com/images/locations/church-of-elleh.jpg)、[教堂内部截图](https://images.steamusercontent.com/ugc/1820021756096495704/95C5A18416EFB449FE3951F2615AC98D14F73403/)。仅在浏览器查看作为参考，没有下载进仓库或用作场景纹理。
- 教堂、马里奥、商人、驮兽、道具与地形为本地重新制作的几何模型；石墙、植物、天空与帽子标记均由程序生成。
- 角色和场景名称对应原作研究对象；未提取 ROM、游戏模型、音乐、动画、语音或纹理。
- `assets/elleh-exterior.jpg` 等新增截图是本地浏览器运行结果，不是法环原作或 er-mario 的实机截图。
- NPC 交互文案、导览路线与地标目标为本演示设计。角色控制参数没有宣称为 SM64 实测数值。
- 新增马里奥、路易吉、索尼克、卡比、史蒂夫与林克的风格化几何模型，用于展示共用控制器与姿态接口；未使用原作模型或动画。相关角色形象与名称的权利归各自权利人，此处不声明拥有这些角色设计。
- `assets/elleh-characters.jpg` 与 `assets/elleh-link.jpg` 为本地角色切换演示的实际运行截图。

## 写实人物：Microsoft Rocketbox

- 来源：[Microsoft Rocketbox 官方仓库](https://github.com/microsoft/Microsoft-Rocketbox)，固定提交 `0943055db6ec570bcef9f2c8b41c9e5467c808f9`，`Assets/Avatars/Adults/Male_Adult_01/`。
- 许可：MIT，Copyright (c) 2020 Microsoft；保留[许可原文](references/rocketbox-LICENSE.txt)，运行资源中也附带 [许可副本](web/assets/rocketbox-LICENSE.txt)。
- 使用 `Male_Adult_01.fbx`，body/head 的 color、normal，以及 opacity 纹理。原始文件路径、Git blob 标识及产物 SHA-256 见[来源记录](references/rocketbox-source.json)。
- 使用 Blender 5.2.2 转为 `web/assets/rocketbox-human.glb`；皮肤和衣物纹理缩至 1024，保留原几何、UV、权重与 80 个关节，统一模型高度为 1.82 米。调整了运行时材质；没有导入或播放原作动画片段。
- `web/elleh/human.js` 将本地共用动作的语义关节方向映射到此骨骼，补充肘膝弯曲。其物理、跳跃时序、翻转和下砸来自本演示控制器。
- 新增的 `web/vendor/GLTFLoader.js`、`SkeletonUtils.js` 均来自 Three.js r134 官方仓库，沿用上方 Three.js MIT 许可。
- `assets/elleh-human-*.jpg` 均为接入此模型后，本地浏览器的实际运行画面。
