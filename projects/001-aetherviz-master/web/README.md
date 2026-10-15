# AetherViz · Web 演示

三个实际运行的静态交互课件，共享入口，以 hash 切换。普通使用无需安装依赖；脚本、样式与 KaTeX 字体已保存到 `vendor/`。

## 本地启动

仓库根目录：

```sh
python -m http.server 8080 --bind 127.0.0.1
```

- 入口：<http://127.0.0.1:8080/projects/001-aetherviz-master/web/>
- 力学、函数、分子入口分别加 `#newton`、`#sine`、`#molecule`。
- [研究总览图](overview.html)：汇总能力、原理、价值边界、真实截图及课程扩展方向；顶部支持下载完整 JPG 长图和浏览器打印 / PDF。

也可直接打开 `index.html`。普通脚本不依赖模块服务器或后台 API。三维案例需要 WebGL；无法启动时显示说明，二维案例和参数计算仍可使用。

## 技术与文件

| 文件 | 用途 |
| --- | --- |
| `index.html` | 页面骨架、学习区、说明弹窗 |
| `styles.css` | 桌面与小屏布局 |
| `models.js` | 分段运动、碰撞/摩擦解析模型、能量核算、历史采样、动画时间差、正弦与参考几何 |
| `app.js` | 实验、控件、动画、图形与测验 |
| `overview.html` / `overview.css` / `overview.js` | 响应式研究总览；`?poster=1` 提供 1440 px 固定宽度的长图导出布局 |
| `assets/overview/` | 本轮三个真实案例截图与导出的完整研究长图 |
| `vendor/` | Three.js 0.134.0、官方 OrbitControls、KaTeX 0.16.11、字体与许可证 |
| `scripts/vendor.cjs` | 从锁定 npm 包重新复制依赖 |
| `tests/models.test.cjs` | 26 项数值、碰撞守恒/能量/边界、讲解时间与动画启动回归检查 |

Python 3.10+ 用于静态服务与构建；维护依赖、运行数值检查时使用 Node.js 22。普通访问不需要 Node.js。

## 依赖维护与检查

仅重建 `vendor/` 时，在本目录执行：

```sh
npm ci --no-audit --no-fund
npm run vendor
npm test
node --check app.js
```

保留 `package-lock.json` 并检查 vendor 与许可证变化。Three.js r134 用于固定研究条件，没有声称它是当前最新版本。浏览器验证步骤见 [notes.md](../notes.md)；数值测试不能替代画面检查。

## 实际操作

- 进入课件默认自动演示，点击暂停可接管；尊重系统减少动态效果的设置。
- 力学默认 0.25× 分阶段讲解，接触前局部 0.1×；碰前、冲量、碰后在同一物理时刻停留供阅读。五类量的说明随画面更新，支持暂停、上一/下一阶段、直接跳阶段。取消讲解或拖动时间轴可自由回看，“从头讲解”恢复。详见[碰撞完整分析](../collision-analysis.md)。
- 两车与墙场景仍支持六参数、五预设，参数在“调整实验参数”中展开。改参数重开；慢速只改变展示，不改变物理计算，无摩擦时不伪造静止。
- 保留同力比质量、同质量比推力、亲手推车三个无摩擦玩法。手动模式按住按钮或画布上的空格施力，释放后合力归零、保持滑行。这些模式的推力可在运动中改变，改质量从头开始；时间轴回放已记录过程，继续播放会从当前帧续算。
- 函数图的橙点改变相位、绿点改变振幅，曲线采样点可拖动；画布聚焦后左右方向键移动采样点。滑块提供键盘操作替代。
- 分子课件点「拖动氢原子」切正视角，直接拖原子改变键角；空白处保留相机旋转。键角滑块提供键盘操作替代。

## 构建与部署

在仓库根目录：

```sh
python scripts/projects.py check
python scripts/build_web.py
python -m http.server 8081 --bind 127.0.0.1 --directory _site
```

访问 <http://127.0.0.1:8081/projects/001-aetherviz-master/>，检查资源、刷新与三个 hash 入口。

| 项目 | 路径 |
| --- | --- |
| 源码 | `projects/001-aetherviz-master/web/` |
| 产物 | `_site/projects/001-aetherviz-master/` |
| Pages 基路径 | `/1015_codex_project/projects/001-aetherviz-master/` |
| 根导航 | `_site/index.html`，根据 `projects.json` 生成 |

资源采用相对链接，仓库子路径下无需改写脚本。产物只包含运行文件、依赖与来源说明，不发布整个研究仓库。根构建工具目前支持本项目的无编译静态结构，未来其他技术栈需显式接入自己的构建产物。

仓库提供 `.github/workflows/pages.yml` 手动发布工作流。已启用 GitHub Pages Actions 发布，main 的项目、索引或构建变更会自动部署，也可手动运行。2026-10-15 已完成发布并访问验证，`demo_url` 已登记。[在线研究总览](https://yydshly.github.io/1015_codex_project/projects/001-aetherviz-master/overview.html) · [互动课件](https://yydshly.github.io/1015_codex_project/projects/001-aetherviz-master/)。详见[部署约定](../../../docs/deployment.md)。
