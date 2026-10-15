/* Research content filters and explanation steps. */
'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const scenarios = [
  ['form', '形态与结构 / 入门', '文字、标志与产品轮廓', '从字体、SVG 或模型采样目标点，组织碎片揭示与重新聚合。', '品牌网站 · 发布会 · 活动片头'],
  ['form', '形态与结构 / 中等', '建筑生长与城市重组', '按楼层、建筑单元分配组装次序，表现从零件到空间的生成过程。', '建筑展陈 · 城市叙事 · 方案展示'],
  ['form', '形态与结构 / 中等', '晶体生长与分子结构', '用晶格、分形或双螺旋定义采样目标，分阶段展示结构形成。', '科学主题装置 · 结构教学示意'],
  ['motion', '运动与自然 / 中等', '星系、星环与吸积盘', '把点群布置成螺旋臂、轨道与盘面，通过速度梯度建立空间层次。', '天文展厅 · 视听演出 · 概念片头'],
  ['motion', '运动与自然 / 中等', '龙卷、涡流与烟羽', '控制高度、半径、角速度与噪声，使碎片产生流动的轮廓。', '气象科普示意 · 影视特效预演'],
  ['motion', '运动与自然 / 进阶', '鱼群、鸟群与群体迁移', '视觉轨迹可用流场扩展；需要个体协同时再接入邻域与避障规则。', '自然主题展陈 · 群体行为教学'],
  ['motion', '运动与自然 / 进阶', '波传播、冲击与涟漪', '让传播时间控制碎片位移和材质，表现波前、衰减与叠加。', '互动地面 · 波动教学 · 舞台视觉'],
  ['interaction', '交互与叙事 / 中等', '声音驱动的重组', '读取音频能量与频段，映射到聚合度、发光与旋转速度。', '音乐可视化 · 舞台背景 · 艺术装置'],
  ['interaction', '交互与叙事 / 进阶', '数据聚集与关系显现', '为点赋予真实数据身份，用位置和分组表达连接与结构变化。', '数据故事 · 研究传播 · 互动报告'],
  ['interaction', '交互与叙事 / 进阶', '鼠标、触摸与身体参与', '把输入位置变成排斥场、吸引场或新的采样目标。摄像头输入另需姿态识别。', '互动橱窗 · 展馆装置 · 网页首屏'],
  ['form', '形态与结构 / 进阶', '产品爆炸图与装配流程', '为每个真实零件保留独立几何与装配关系，替代当前的均匀碎片。', '产品演示 · 培训 · 维修说明'],
  ['interaction', '交互与叙事 / 进阶', '循环、回收与材料再生', '让材料依次变为物件、碎片、资源和新物件，以连续重组表达循环。', '环保展陈 · 品牌叙事 · 公益传播'],
];
function renderScenarios(filter) {
  const selected = scenarios.filter(([category]) => filter === 'all' || category === filter);
  $('#scenario-grid').replaceChildren(...selected.map(([, level, title, description, scene]) => {
    const article = document.createElement('article'); article.className = 'scenario';
    for (const [tag, value, className] of [['span', level, 'eyebrow'], ['h3', title, ''], ['p', description, ''], ['small', scene, '']]) {
      const element = document.createElement(tag); element.className = className; element.textContent = value; article.appendChild(element);
    }
    return article;
  }));
  $('#scenario-count').textContent = `展示 ${selected.length} 个扩展方向。上述为研究建议，完整落地所需改造见“实施路线与完整场景矩阵”。`;
}
$$('[data-filter]').forEach((button) => button.addEventListener('click', () => {
  $$('[data-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button))); renderScenarios(button.dataset.filter);
}));
renderScenarios('all');
const stepDetails = [
  '在巨石表面生成 Voronoi 单元并挤出厚度；用参数化几何构造教堂与鲸鱼。固定随机种子让结构能够复现。',
  '教堂与鲸鱼是采样模板。表面和轮廓产生目标点；按高度与角度匹配碎片，避免完全随机的交叉飞行。每块碎片保存各阶段的目标位置、旋转与尺度。',
  'GPU 读取目标纹理，以碎片编号和当前时间计算位置、旋转及材质。贝塞尔曲线和缓动衔接各阶段；状态由时间直接求出，因此可以拖动进度定位。',
  '碎片合并为一个网格，顶点按编号读取状态。主场景、阴影和镜面分别渲染，再叠加体积光、辉光、景深与调色；36 秒故事经变速与剪切组成约 18 秒循环。',
];
$$('[data-step]').forEach((button) => button.addEventListener('click', () => {
  $$('[data-step]').forEach((item) => item.setAttribute('aria-pressed', String(item === button))); $('#step-detail').textContent = stepDetails[Number(button.dataset.step)];
}));
