# ER Mario 能力展厅

原生 HTML/CSS/JavaScript + Three.js r134。没有服务端、密钥、构建工具或根目录应用依赖。

研究主入口为 `overview.html`，覆盖库的能力、碰撞/动作/骨骼/战斗适配原理、价值、七人物演示、六个有条件扩展方向与验证范围。保留 `index.html` 为机制展厅、`elleh/` 为可操作场景。

引导图使用 `assets/overview/er-mario-overview.png` 与 SVG，均为生成总览图的原样副本；预览图用于首屏，完整图可在弹窗滚动阅读并下载。总导航由根构建脚本自动识别 `overview.html`。

## 运行

在仓库根目录：

```sh
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8083 --bind 127.0.0.1 --directory _site
```

访问 <http://127.0.0.1:8083/projects/003-er-mario/>。源码可由根目录静态服务的 `/projects/003-er-mario/web/` 访问，也可直接打开 `index.html`。

依赖随目录保存，全部本地交互可离线。所有资源为相对路径，章节使用锚点，支持 Pages 子路径。汇总构建后的“来源与许可”链接指向 `THIRD_PARTY.md`；单独使用 web 目录时请从子项目根目录查看许可。

## 检查

```sh
node --check projects/003-er-mario/web/app.js
node --check projects/003-er-mario/web/models.js
node --test projects/003-er-mario/web/tests/models.test.cjs
python scripts/projects.py check
python scripts/build_web.py
```

检查轨迹有限性与落地、Boss 加成、比例阶段保留 1 HP，以及坐标往返。浏览器验证记录见 [notes.md](../notes.md)。

## 演示范围

- 动作是原创采样轨迹，不运行 libsm64，参数不是实测。
- 碰撞线是原创几何边线，没有 Havok 或游戏碰撞解算。
- 战斗模型不模拟 f32 误差、原生攻击、抗性、失衡和脚本。
- 原帖仅保留直接来源入口，并显示媒体已被 X 停用。
- 减少动态效果时默认暂停；按钮支持键盘。空格播放、方向键切动作、R 回到起点；表单操作不被全局快捷键截获。

## 构建与发布

根构建脚本汇总生产文件、vendor、许可与 references 到 `_site/projects/003-er-mario/`；不复制测试或游戏资源。发布遵循 [部署约定](../../../docs/deployment.md)，成功部署并验证后填写真实 `demo_url`。本轮没有远程发布。

## 艾雷教堂可操作场景

新增源码 `elleh/`，构建后位于 `/projects/003-er-mario/elleh/`。可通过展厅首页的“进入艾雷教堂试玩”进入。

参考、操作与重建边界见 [scene.md](../scene.md)。运行无需额外安装；相对路径复用上一级 `vendor/three.min.js`。控制器检查：

场景已加入七种角色切换与同步动作预览：V 打开面板，1–7 快切。`characters.js` 提供模型与共用姿态适配，`wardrobe.js` 通过同一个角色控制器驱动预览；世界中的控制器不因角色切换而重建。写实人物资源位于 `assets/rocketbox-human.glb`，由 `human.js` 映射骨骼方向。来源与 MIT 许可在子项目 `THIRD_PARTY.md`。

预选写实人物并打开七人对比：`elleh/?character=human&compare=all`。骨骼与蒙皮回归检查：`node --test projects/003-er-mario/web/tests/elleh-human.test.cjs`。

```sh
node --test projects/003-er-mario/web/tests/elleh-controller.test.cjs
node --check projects/003-er-mario/web/elleh/world.js
node --check projects/003-er-mario/web/elleh/game.js
```
