/* Research implementation guided by upstream SKILL.md v5.0; see references/ and THIRD_PARTY.md. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const TAU = Math.PI * 2;
  const models = window.LabModels;
  const lessons = {
    newton: {
      title: '推、撞、停，发生了什么？', description: '从施力加速到碰撞、反弹与停稳，把运动的全过程看清楚。',
      mode: '3D + SVG · 运动与守恒分析', stage: '两车正碰 · 右为正方向',
      defaults: { force: 12, mass: 2, massB: 3, duration: 1, restitution: .6, friction: .08 },
      ranges: [['force', '推力 F', 0, 20, .5, 'N'], ['mass', 'A 车质量', 1, 10, .5, 'kg'], ['massB', 'B 车质量', 1, 10, .5, 'kg'], ['duration', '施力时长', .3, 2, .1, 's'], ['restitution', '恢复系数 e', 0, 1, .05, ''], ['friction', '摩擦系数 μ', 0, .3, .01, '']],
      goals: ['增大推力，比较碰前速度与最终停下的位置', '比较弹性碰撞、粘连碰撞与撞墙', '用动量、冲量和能量解释碰撞后的运动'],
      ideaTitle: '撞上之后，不一定停下',
      idea: '推力让小车加速；撤力后，有摩擦才会逐渐减速。碰撞会在极短时间内重新分配速度。两车粘在一起后仍可能继续滑行，最终停下需要外部摩擦；撞墙则会把动量传给墙与地球。',
      assumption: '碰撞模式：水平一维平动，车长 1.2 m，B 初始中心在 6 m；同一有效摩擦系数，g = 9.81 m/s²，忽略车轮转动能。接触或设定时长到达时撤力。碰撞用瞬时冲量与恢复系数计算，不求接触力峰值。对照与亲推模式仍为无摩擦独立轨道。',
      question: '无摩擦时，两辆车碰后粘在一起，它们一定停下吗？',
      answers: ['一定停下', '总动量非零时会一起继续运动', '只要有碰撞，动量就消失'], correct: 1,
      answer: '两车碰撞瞬间总动量守恒，粘连后的共同速度为总动量除以总质量。摩擦或墙才会改变两车系统的总动量。',
      formula: 'F_{\\mathrm{net}}=ma,\\quad J=\\Delta p', formulaCaption: '力改变速度；碰撞冲量改变动量。右侧为正方向。',
      hint: '改参数会重开碰撞实验。e = 1 理想弹性，e = 0 碰后同速；μ = 0 时不会靠摩擦停下。'
    },
    sine: {
      title: '一条曲线，无限种节奏。', description: '用振幅、角频率和相位，探索正弦曲线的形状。',
      mode: 'SVG · 二维矢量图形', stage: '旋转向量与函数曲线',
      defaults: { amplitude: 1.5, frequency: 1, phase: 0 },
      ranges: [['amplitude', '振幅 A', .5, 2.5, .1, ''], ['frequency', '角频率 ω', .5, 3, .5, ''], ['phase', '初相位 φ', -180, 180, 1, '°']],
      goals: ['改变振幅，观察曲线高度的变化', '改变角频率，观察周期的变化', '改变初相位，观察曲线的水平移动'],
      ideaTitle: '把旋转展开，便是一条波',
      idea: '左侧向量的竖直投影与右侧曲线上的点具有相同的高度。振幅决定波峰有多高，角频率决定曲线有多密，相位决定从哪里开始。',
      assumption: '这里的 x 是自变量，单位为弧度。播放只是扫描 x，不表示真实声波或机械振动；虚线表示当前投影。',
      question: '角频率 ω 从 1 增加到 2，函数周期会怎样？',
      answers: ['周期变为原来的 1/2', '周期变为原来的 2 倍', '周期保持不变'], correct: 0,
      answer: '周期 T = 2π/ω。ω 翻倍，周期减半。',
      formula: 'y=A\\sin(\\omega x+\\varphi)', formulaCaption: '周期 T = 2π/ω；界面以角度输入 φ，计算时转换为弧度。',
      hint: '直接拖动画面中的橙点改变相位、绿点改变振幅；也可以使用滑块。'
    },
    molecule: {
      title: '一滴水里的，微观几何。', description: '旋转、选择和比较，认识水分子的弯曲结构。',
      mode: 'Three.js · 三维球棍模型', stage: 'H₂O · 水分子结构',
      defaults: { angle: 104.5, spin: .35, labels: true },
      ranges: [['angle', 'H–O–H 键角', 60, 150, .5, '°'], ['spin', '自动旋转', 0, 1, .05, 'rad/s']],
      goals: ['拖动模型，从不同角度观察弯曲结构', '点击氧原子或氢原子，查看元素信息', '比较参考结构与假想键角的区别'],
      ideaTitle: '两个氢，一个氧；并非一条直线',
      idea: '水分子呈弯曲结构。围绕氧原子的成键电子对和孤电子对，会影响分子的空间构型；三维球棍模型帮助你观察这种几何关系。',
      assumption: '参考值：O–H 0.958 Å，H–O–H 约 104.5°（NIST）。球体大小为示意。改变键角仅探索几何，不代表真实分子运动或能量计算。',
      question: '把滑块调到 140°，这个画面代表什么？',
      answers: ['真实水分子的稳定结构', '用于比较的假想几何构型', '液态水的温度'], correct: 1,
      answer: '这是保持键长的假想构型。页面没有进行量子化学或分子动力学计算。',
      formula: '\\mathrm{H_2O} \\quad \\angle HOH\\approx104.5^\\circ', formulaCaption: 'O–H 参考键长为 0.958 Å = 95.8 pm。',
      hint: '拖动氢原子改变键角；拖动空白处旋转模型。上方按钮可切到容易操作的正视角。'
    }
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = { lesson: '', params: {}, time: 0, playing: false, preview: false, selectedAtom: 'O', speed: 1, scenario: 'collision', held: false, moleculeMode: 'turn', replayApplied: null, collisionSide: 'after', guided: true };
  const zero = () => ({ position: 0, velocity: 0, finished: false });
  let motion = { A: zero(), B: zero() }, history = [], graphics = null, lastFrame = performance.now(), replayWait = 0, collisionLab = null, chapters = [], guideCursor = null;
  const isCollision = () => state.lesson === 'newton' && ['collision', 'wall'].includes(state.scenario);
  const collisionEnd = () => chapters.at(-1).start;
  let atomDrag = null, svgDrag = null;
  const limitTime = () => state.scenario === 'push' ? 12 : 8;
  const $all = selector => Array.from(document.querySelectorAll(selector));
  function applied() {
    const forceA = state.scenario === 'push' ? (state.held ? state.params.force : 0) : state.params.force;
    return { forceA, forceB: state.scenario === 'force' ? forceA / 2 : state.scenario === 'push' ? 0 : forceA, massA: state.params.mass, massB: state.scenario === 'mass' ? state.params.mass * 2 : state.params.mass };
  }
  function capture(forces = applied()) { return { time: state.time, A: { ...motion.A }, B: { ...motion.B }, applied: { ...forces } }; }
  function restart(playing = true) {
    motion = { A: zero(), B: zero() }; state.time = 0; state.held = false; state.playing = playing; state.replayApplied = null;
    state.collisionSide = 'after';
    if (isCollision()) { collisionLab = models.collisionExperiment({ ...state.params, wall: state.scenario === 'wall' }); chapters = models.collisionChapters(collisionLab); guideCursor = models.chapterCursor(chapters); }
    history = state.lesson === 'newton' ? [capture()] : []; replayWait = 0; lastFrame = performance.now();
  }
  function takeControl() { state.preview = false; replayWait = 0; state.replayApplied = null; }
  function branchHistory() {
    if (history.length && history[history.length - 1].time > state.time + 1e-8) {
      history = history.filter(point => point.time < state.time - 1e-8); history.push(capture());
    }
  }
  function rangeMarkup([key, name, min, max, step, unit]) {
    return `<div class="range-control" data-param="${key}"><label for="param-${key}"><span>${name}</span><output id="output-${key}" for="param-${key}"></output></label><input id="param-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${state.params[key]}"><div class="range-limits"><span>${min} ${unit}</span><span>${max} ${unit}</span></div></div>`;
  }
  function makeTools() {
    const options = state.lesson === 'newton' ? [['collision', '两车碰撞'], ['wall', '撞上挡墙'], ['mass', '同力比质量'], ['force', '同质量比力'], ['push', '亲手推车']] : state.lesson === 'sine' ? [['original', '原始波形'], ['double', '频率翻倍'], ['triple', '频率 × 3']] : [['reference', '参考结构'], ['angle', '拖动氢原子'], ['turn', '旋转观察']];
    $('experience-tools').innerHTML = options.map(([key, text]) => `<button data-action="${key}">${text}</button>`).join('') + '<span class="tool-hint" id="tool-hint"></span>';
    $all('[data-action]').forEach(button => button.addEventListener('click', () => {
      takeControl();
      const action = button.dataset.action;
      if (state.lesson === 'newton') { const old = isCollision(); state.scenario = action; $('parameter-settings').open = !(isCollision() && state.guided); restart(action !== 'push'); if (old !== isCollision()) { disposeScene(); createScene(); } }
      if (state.lesson === 'sine') {
        state.params = { amplitude: 1.5, frequency: action === 'double' ? 2 : action === 'triple' ? 3 : 1, phase: 0 };
        state.time = 0; state.playing = true; syncInputs();
      }
      if (state.lesson === 'molecule') {
        state.moleculeMode = action;
        if (action === 'reference') { state.params.angle = 104.5; state.playing = false; syncInputs(); updateMolecule(); resetCamera(true); }
        if (action === 'angle') { state.playing = false; resetCamera(true); }
        if (action === 'turn') state.playing = true;
      }
      render();
    }));
  }
  function syncInputs() { for (const [key] of lessons[state.lesson].ranges) $(`param-${key}`).value = state.params[key]; }
  function switchLesson() {
    const key = location.hash.slice(1), lesson = Object.hasOwn(lessons, key) ? key : 'newton';
    if (!Object.hasOwn(lessons, key)) window.history.replaceState(null, '', '#newton');
    disposeScene(); atomDrag = null; svgDrag = null;
    state.lesson = lesson; state.params = { ...lessons[lesson].defaults }; state.scenario = 'collision'; state.selectedAtom = 'O'; state.preview = !reducedMotion; state.moleculeMode = reducedMotion ? 'reference' : 'turn';
    state.speed = lesson === 'newton' && state.guided ? .25 : 1; $('speed').value = state.speed;
    $('parameter-settings').open = !(lesson === 'newton' && state.guided);
    restart(!reducedMotion);
    const content = lessons[lesson]; document.title = `${content.title} · AetherViz`;
    $all('[data-lesson]').forEach(link => { const active = link.dataset.lesson === lesson; link.classList.toggle('active', active); if (active) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current'); });
    for (const [id, value] of Object.entries({ 'lesson-title': content.title, 'lesson-description': content.description, 'mode-badge': content.mode, 'stage-label': content.stage, 'idea-title': content.ideaTitle, 'idea-text': content.idea, assumption: content.assumption, 'formula-caption': content.formulaCaption, 'control-hint': content.hint })) $(id).textContent = value;
    $('controls').innerHTML = content.ranges.map(rangeMarkup).join('') + (lesson === 'molecule' ? '<label class="toggle-control">原子标签 <input id="labels-toggle" type="checkbox" checked></label><div class="atom-selector" aria-label="选择原子"><button data-atom="H1" aria-label="选择第一个氢原子">H₁</button><button data-atom="O" aria-label="选择氧原子">O</button><button data-atom="H2" aria-label="选择第二个氢原子">H₂</button></div>' : '');
    content.ranges.forEach(([name]) => $(`param-${name}`).addEventListener('input', event => {
      takeControl(); state.params[name] = Number(event.target.value);
      if (lesson === 'newton') { if (isCollision() || name === 'mass') restart(state.playing || finished()); else { if (finished()) restart(true); branchHistory(); } }
      if (lesson === 'molecule') updateMolecule(); render();
    }));
    if (lesson === 'molecule') $('labels-toggle').addEventListener('change', event => { state.params.labels = event.target.checked; render(); });
    $all('[data-atom]').forEach(button => button.addEventListener('click', () => { state.selectedAtom = button.dataset.atom; updateMolecule(); render(); }));
    $('goals').innerHTML = content.goals.map(goal => `<label class="goal"><input type="checkbox"><span>${goal}</span></label>`).join('');
    $('quiz-options').innerHTML = `<legend>${content.question}</legend>${content.answers.map((answer, index) => `<label class="quiz-option"><input type="radio" name="answer" value="${index}"><span>${answer}</span></label>`).join('')}`;
    $('quiz-feedback').textContent = '';
    if (window.katex) katex.render(content.formula, $('formula'), { throwOnError: false }); else $('formula').textContent = content.formula;
    $('main-svg').toggleAttribute('hidden', lesson !== 'sine'); $('scene').hidden = lesson === 'sine';
    $('chart-panel').hidden = lesson !== 'newton'; $('timeline-panel').hidden = lesson !== 'newton';
    document.querySelector('.experiment').classList.toggle('no-chart', lesson !== 'newton');
    $('camera-reset').hidden = lesson === 'sine'; $('object-label').hidden = true; $('secondary-label').hidden = true; $('scene-error').hidden = true;
    $('stage').setAttribute('aria-label', lesson === 'sine' ? '拖动旋转向量改变相位，点击曲线扫描位置；左右方向键移动采样点' : lesson === 'molecule' ? '拖动氢原子改变键角，拖动背景旋转；也可用键角滑块操作' : '双车对照实验；亲手推车模式下按住空格施力，松开后保持滑行');
    makeTools(); if (lesson !== 'sine') createScene(); render();
  }
  function disposeScene() {
    if (!graphics) return;
    graphics.controls.dispose();
    graphics.scene.traverse(object => { object.geometry?.dispose(); if (object.material) for (const mat of [object.material].flat()) mat.dispose(); });
    graphics.renderer.dispose(); graphics.renderer.domElement.remove(); graphics = null;
  }
  function material(color) {
    const mat = new THREE.MeshPhongMaterial({ color, shininess: 50, specular: 0x263b3a }); mat.color.convertSRGBToLinear(); return mat;
  }
  function mesh(geometry, mat, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, mat); object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true; return object;
  }
  function createScene() {
    try {
      if (!window.THREE || !THREE.OrbitControls) throw new Error('本地三维依赖未加载');
      const scene = new THREE.Scene();
      const camera = state.lesson === 'newton' ? new THREE.OrthographicCamera(-6.3, 6.3, 4, -4, .1, 100) : new THREE.PerspectiveCamera(42, 1, .1, 100);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      $('scene').appendChild(renderer.domElement);
      const controls = new THREE.OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 3; controls.maxDistance = 20; controls.minZoom = .7; controls.maxZoom = 2;
      controls.maxPolarAngle = Math.PI * .85;
      scene.add(new THREE.HemisphereLight(0xe0f5ff, 0x263c40, .7));
      scene.add(new THREE.AmbientLight(0xffffff, .25));
      const light = new THREE.DirectionalLight(0xfff4e0, 1); light.position.set(-3, 7, 5); light.castShadow = true; light.shadow.mapSize.set(1024, 1024);
      Object.assign(light.shadow.camera, { left: -8, right: 8, top: 7, bottom: -7 }); scene.add(light);
      const rim = new THREE.DirectionalLight(0x84d9e4, .45); rim.position.set(5, 4, -4); scene.add(rim);
      graphics = { scene, camera, renderer, controls };
      if (state.lesson === 'newton') buildNewton(); else buildMolecule();
      resetCamera(); resize(); $('stage').dataset.renderer = 'webgl';
    } catch (error) {
      disposeScene(); $('scene-error').hidden = false; $('scene-error').textContent = `三维场景无法启动：${error.message}。请使用支持 WebGL 的浏览器。`; $('stage').dataset.renderer = 'unavailable';
    }
  }
  function createCart(color, lane) {
    const cart = new THREE.Group(), wheels = [], blocks = [];
    cart.position.z = lane;
    cart.add(mesh(new THREE.BoxGeometry(1.2, .34, .9), material(color), 0, .47, 0));
    cart.add(mesh(new THREE.BoxGeometry(.9, .08, .76), material(0x274f47), 0, .68, 0));
    for (const x of [-.39, .39]) for (const z of [-.49, .49]) {
      const wheel = mesh(new THREE.CylinderGeometry(.2, .2, .12, 24), material(0x1d3035), x, .26, z); wheel.rotation.x = Math.PI / 2; cart.add(wheel); wheels.push(wheel);
      const hub = mesh(new THREE.CylinderGeometry(.085, .085, .125, 16), material(color), x, .26, z); hub.rotation.x = Math.PI / 2; cart.add(hub);
    }
    for (let i = 0; i < 12; i++) { const block = mesh(new THREE.BoxGeometry(.32, .16, .27), material(color), (i % 2 ? .2 : -.2), .81 + Math.floor(i / 4) * .18, Math.floor(i / 2) % 2 ? .18 : -.18); cart.add(block); blocks.push(block); }
    const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(.5, 1.5, 0), 1.3, 0xffbc7e, .26, .16); cart.add(arrow);
    cart.traverse(node => { if (node.isMesh) node.userData.cart = true; });
    graphics.scene.add(cart);
    const trail = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4.5, .12, lane), new THREE.Vector3(-4.5, .12, lane)]), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .8 })); graphics.scene.add(trail);
    return { cart, wheels, blocks, arrow, trail, lane };
  }
  function buildNewton() {
    const { scene } = graphics;
    if (isCollision()) {
      const track = mesh(new THREE.BoxGeometry(1, .12, 2.8), material(0x264149), 0, .01, 0); scene.add(track); graphics.track = track;
      graphics.A = createCart(0x87e2b2, 0); graphics.B = createCart(0xf4b86b, 0);
      for (const [part, color] of [[graphics.A, 0x87e2b2], [graphics.B, 0xf4b86b]]) {
        part.velocityArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1.45, .05), 1, color, .2, .13); part.cart.add(part.velocityArrow);
        part.frictionArrow = new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, .2, .85), 1, 0xe77d7d, .15, .1); part.cart.add(part.frictionArrow);
        part.impulseArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1.75, 0), 1, 0xd0acff, .3, .2); part.cart.add(part.impulseArrow);
        part.arrow.position.set(0, 2.1, 0); part.trail.visible = false;
      }
      graphics.wall = mesh(new THREE.BoxGeometry(.35, 2.3, 2.6), material(0x82948f), 3.175, 1.15, 0); scene.add(graphics.wall);
      graphics.impact = mesh(new THREE.TorusGeometry(.78, .035, 12, 40), material(0xffd79b)); graphics.impact.rotation.y = Math.PI / 2; scene.add(graphics.impact);
      graphics.markers = new THREE.Group();
      for (let i = -4; i <= 24; i++) graphics.markers.add(mesh(new THREE.BoxGeometry(.025, .025, .24), material(i % 2 ? 0x476a68 : 0x9fbfa7), i - 3, .09, 1.05));
      scene.add(graphics.markers); return;
    }
    for (const z of [-1.15, 1.15]) {
      scene.add(mesh(new THREE.BoxGeometry(10.9, .12, 1.95), material(0x264149), 0, .01, z));
      for (const edge of [-.89, .89]) scene.add(mesh(new THREE.BoxGeometry(10.8, .025, .03), material(0x61857d), 0, .09, z + edge));
      for (let i = 0; i <= 12; i++) scene.add(mesh(new THREE.BoxGeometry(.035, .02, .2), material(i % 3 === 0 ? 0xd6e9d6 : 0x476a68), -4.5 + .75 * i, .09, z + .73));
    }
    for (let i = 0; i < 10; i++) scene.add(mesh(new THREE.BoxGeometry(.3, .02, .39), material(i % 2 ? 0xd4e4d3 : 0x173136), 4.92, .1, -1.95 + .39 * i));
    graphics.A = createCart(0x87e2b2, -.95); graphics.B = createCart(0xf4b86b, 1.25);
  }
  function buildMolecule() {
    const group = new THREE.Group(), atoms = [];
    for (const [index, name] of ['O', 'H1', 'H2'].entries()) {
      const atom = mesh(new THREE.SphereGeometry(index === 0 ? .55 : .33, 40, 32), material(index === 0 ? 0xe45736 : 0x8bdfc0)); atom.userData.atom = name; atoms.push(atom); group.add(atom);
    }
    const bonds = [0, 1].map(() => { const bond = mesh(new THREE.CylinderGeometry(.085, .085, 1, 24), material(0x82aaa2)); group.add(bond); return bond; });
    const arc = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0xe5c981 })); group.add(arc); graphics.scene.add(group);
    graphics.group = group; graphics.atoms = atoms; graphics.bonds = bonds; graphics.arc = arc; updateMolecule();
  }
  function updateMolecule() {
    if (!graphics?.group) return;
    const geometry = models.waterGeometry(state.params.angle);
    graphics.atoms.forEach(atom => atom.position.fromArray(geometry[atom.userData.atom]).multiplyScalar(2.25));
    graphics.bonds.forEach((bond, index) => { const end = graphics.atoms[index + 1].position; bond.position.copy(end).multiplyScalar(.5); bond.scale.y = end.length(); bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().normalize()); });
    const half = state.params.angle * Math.PI / 360;
    const points = Array.from({ length: 45 }, (_, i) => { const theta = -half + 2 * half * i / 44; return new THREE.Vector3(.93 * Math.sin(theta), .93 * Math.cos(theta), .035); });
    graphics.arc.geometry.dispose(); graphics.arc.geometry = new THREE.BufferGeometry().setFromPoints(points);
    graphics.atoms.forEach(atom => atom.material.emissive.setHex(atom.userData.atom === state.selectedAtom ? (atom.userData.atom === 'O' ? 0x180400 : 0x03140a) : 0x000000));
  }
  function resetCamera(front = false) {
    if (!graphics) return;
    graphics.camera.position.set(...(state.lesson === 'newton' ? [0, 6.9, 9] : front ? [0, .65, 7.5] : [.9, 1.6, 7.4]));
    graphics.controls.target.set(0, state.lesson === 'newton' ? .3 : .65, 0); graphics.camera.zoom = 1; graphics.camera.updateProjectionMatrix(); graphics.controls.update();
    if (graphics.group) graphics.group.rotation.set(0, 0, 0);
  }
  function resize() {
    if (!graphics) return;
    const { width, height } = $('stage').getBoundingClientRect(), aspect = width / height;
    if (graphics.camera.isOrthographicCamera) Object.assign(graphics.camera, { left: -6.3, right: 6.3, top: 6.3 / aspect, bottom: -6.3 / aspect });
    else graphics.camera.aspect = aspect;
    graphics.camera.updateProjectionMatrix(); graphics.renderer.setSize(width, height);
  }
  function svgText(x, y, text, extra = '') { return `<text x="${x}" y="${y}" fill="#9bbdb0" font-size="13" font-family="Segoe UI,Microsoft YaHei,sans-serif" ${extra}>${text}</text>`; }
  function hud(items) { $('stage-hud').innerHTML = items.map(([label, value, unit]) => `<div class="hud-item"><span>${label}</span><strong>${value}<small>${unit}</small></strong></div>`).join(''); }
  function renderCart(part, value, mass, force) {
    part.cart.position.x = -4.5 + value.position * .15;
    part.blocks.forEach((block, i) => { block.visible = i < Math.min(12, Math.round(mass)); });
    part.wheels.forEach(wheel => { wheel.rotation.y = -value.position * .15 / .2; });
    part.arrow.visible = force > 0 && !value.finished; part.arrow.setLength(.45 + force * .07, .26, .16);
    const positions = part.trail.geometry.attributes.position; positions.setXYZ(1, part.cart.position.x, .12, part.lane); positions.needsUpdate = true;
  }
  function renderChart() {
    const duration = limitTime(), maxV = Math.max(5, Math.ceil(Math.max(...history.flatMap(point => [point.A.velocity, state.scenario === 'push' ? 0 : point.B.velocity])) / 5) * 5);
    const xx = t => 45 + t / duration * 740, yy = v => 112 - v / maxV * 92;
    let svg = '';
    for (let i = 0; i <= 2; i++) { const y = yy(i * maxV / 2); svg += `<path d="M45 ${y}H785" stroke="#315056"/>${svgText(36, y + 4, i * maxV / 2, 'text-anchor="end"')}`; }
    for (let i = 0; i <= 4; i++) svg += svgText(xx(i * duration / 4), 139, i * duration / 4, 'text-anchor="middle"');
    for (const [key, color] of [['A', '#a1e7bc'], ['B', '#efbf7c']]) {
      if (key === 'B' && state.scenario === 'push') continue;
      let recorded = history.filter(point => point.time <= state.time);
      const arrived = recorded.findIndex(point => point[key].finished);
      if (arrived >= 0) recorded = recorded.slice(0, arrived + 1);
      const visible = recorded.filter((point, i) => i % 3 === 0 || i === recorded.length - 1);
      if (!motion[key].finished) visible.push(capture());
      const endpoint = visible.at(-1);
      svg += `<path d="${visible.map((point, i) => `${i ? 'L' : 'M'}${xx(point.time).toFixed(2)},${yy(point[key].velocity).toFixed(2)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.8"/><circle cx="${xx(endpoint.time)}" cy="${yy(endpoint[key].velocity)}" r="4" fill="${color}"/>`;
    }
    $('chart').innerHTML = svg + svgText(45, 13, 'v / m·s⁻¹') + svgText(839, 139, 't / s', 'text-anchor="end"');
  }
  function renderNewton() {
    if (isCollision()) { renderCollision(); return; }
    const forces = state.replayApplied || applied(), manual = state.scenario === 'push', acceleration = forces.forceA / forces.massA;
    hud(manual ? [['实际推力', forces.forceA.toFixed(1), 'N'], [motion.A.finished ? '到达速度' : '当前速度', motion.A.velocity.toFixed(2), 'm/s'], ['已前进', motion.A.position.toFixed(1), 'm']] : [[motion.A.finished ? 'A 到达速度' : 'A 车速度', motion.A.velocity.toFixed(2), 'm/s'], [motion.B.finished ? 'B 到达速度' : 'B 车速度', motion.B.velocity.toFixed(2), 'm/s'], ['相距', Math.abs(motion.A.position - motion.B.position).toFixed(1), 'm']]);
    $('result-label').textContent = manual ? '此刻加速度' : 'A 车 / B 车加速度'; $('result-value').textContent = manual ? acceleration.toFixed(2) : `${acceleration.toFixed(1)} / ${(forces.forceB / forces.massB).toFixed(1)}`; $('result-unit').textContent = 'm/s²';
    $('result-note').textContent = manual ? (forces.forceA > 0 ? '正在施力：速度持续增加。松开看看会发生什么。' : motion.A.velocity > .01 ? '推力已归零，小车保持现有速度继续滑行。' : '按住画面中的推车按钮或空格键，再松手。') : state.scenario === 'mass' ? `同样 ${forces.forceA} N 推力，A ${forces.massA} kg，B ${forces.massB} kg。观察哪辆车先到终点。` : `同样 ${forces.massA} kg，A 受到 ${forces.forceA} N，B 受到 ${forces.forceB} N。力改变，运动过程也改变。`;
    $('gesture-hint').textContent = (state.replayApplied ? '回放时刻 · ' : '') + (manual ? (forces.forceA > 0 ? '正在施力 → 速度上升' : motion.A.velocity > .01 ? '已经松手 → 推力为零，仍在匀速滑行' : '按住下方按钮施力，松开后观察惯性') : state.scenario === 'mass' ? `A ${forces.massA} kg / B ${forces.massB} kg · 推力相同，一起出发` : `A ${forces.forceA} N / B ${forces.forceB} N · 质量相同，一起出发`);
    if (motion.A.finished) $('gesture-hint').textContent = manual || motion.B.finished ? '已到终点，显示到达时速度；点击「重新开始」再试。' : 'A 已到终点，保留到达时速度；继续观察 B。';
    $('tool-hint').textContent = '按玩法重新出发，或拖动下方时间轴回看。';
    $('stage-instruction').textContent = manual ? '支持按住空格施力 · 松开后继续滑行' : '绿色 A · 琥珀色 B · 地面刻线间隔 5 m';
    $('push-button').hidden = !manual; $('push-button').classList.toggle('held', state.held); $('push-button').textContent = state.held ? '正在推动 · 松开看惯性' : '按住，给小车推力';
    $('stage').dataset.manual = manual; $('stage').dataset.time = state.time; $('stage').dataset.position = motion.A.position; $('stage').dataset.positionB = motion.B.position; $('stage').dataset.velocity = motion.A.velocity; $('stage').dataset.appliedForce = forces.forceA;
    $('chart-caption').textContent = manual ? '施力时斜线上升，松手后变成水平线' : '绿色 A · 琥珀色 B';
    const recorded = history.at(-1)?.time || 0;
    $('timeline').value = recorded > 0 ? Math.round(state.time / recorded * 1000) : 0; $('timeline').disabled = recorded < .01;
    $('timeline').setAttribute('aria-valuetext', `${state.time.toFixed(2)} 秒，共 ${recorded.toFixed(2)} 秒`);
    $('timeline').setAttribute('aria-label', '回放已记录的运动过程');
    $('timeline-value').textContent = `${state.time.toFixed(2)} / ${recorded.toFixed(2)} s`;
    $('timeline-note').textContent = recorded > .01 ? '拖动即可倒放；继续播放时从当前帧开始' : '运动开始后，可拖动回看整个过程';
    if (graphics) { renderCart(graphics.A, motion.A, forces.massA, forces.forceA); renderCart(graphics.B, motion.B, forces.massB, forces.forceB); graphics.B.cart.visible = !manual; graphics.B.trail.visible = !manual; }
    renderChart();
  }
  function renderGuide(sample) {
    const lab = collisionLab, p = lab.params, hit = lab.collision, chapter = chapters[guideCursor.index], key = chapter.key;
    const contact = ['before', 'impulse', 'after'].includes(key), impactFrame = key === 'impulse';
    const fixed = value => value.toFixed(3), force = sample.drive + sample.frictionA, sumF = force + (p.wall ? 0 : sample.frictionB);
    const momentum = p.mass * sample.A.velocity + (p.wall ? 0 : p.massB * sample.B.velocity);
    const moving = Math.abs(sample.A.velocity) > 1e-9 || Math.abs(sample.B.velocity) > 1e-9;
    const titles = { push: p.force > p.friction * p.mass * 9.81 ? '推力先改变速度' : '推力能让小车动起来吗？', coast: '松手以后，速度不会立刻消失', before: '接触前，先记住这些量', impulse: '同一个瞬间：冲量改变动量', after: '速度已经重新分配，接下来呢？', braking: p.friction ? '摩擦持续做负功，速度逐渐归零' : '没有摩擦，两车继续运动', end: sample.stopped ? '为什么最终静止？' : '观察结束了，物体仍在运动' };
    const leads = {
      push: sample.A.velocity > 0 || force > 0 ? `A 同时受到向右推力与反向摩擦，合力 ${fixed(force)} N。加速度决定速度增长的快慢。` : '推力未超过有效静摩擦上限。两力平衡，小车保持静止，不能凭空获得速度。',
      coast: p.friction ? '驱动推力已经撤去。小车依靠原有速度前进，摩擦不断改变速度和总动量。' : '驱动推力已经撤去，水平合力为零。速度保持原值，不会因为松手而停下。',
      before: hit ? `t = ${fixed(hit.time)} s，A 刚好接触${p.wall ? '墙面' : 'B'}。先读出碰前速度、动量与动能，再进入冲量帧。` : '',
      impulse: p.wall ? '墙对小车施加外部冲量，墙与地球接受相反冲量。小车自身的动量会改变。' : '两车之间的冲量大小相等、方向相反：A 的动量减少，B 的动量增加，两车总动量在碰撞瞬间保持不变。',
      after: p.wall ? (hit?.vA === 0 ? 'e = 0，墙的冲量已使小车速度变为零；停止发生在这次碰撞中。' : '小车速度变为负值，表示反弹向左。接下来摩擦方向随运动方向改变。') : p.restitution === 0 ? '两车碰后速度相同，继续一起滑行。粘连本身不会把非零总动量消掉。' : hit?.vA < 0 ? 'A 的负速度表示反弹，B 向右运动。两车受到的碰撞冲量相反，但质量不同，速度变化量也不同。' : 'A 减速，B 获得速度。碰撞结束后是否继续减速，取决于剩余的外力。',
      braking: p.friction ? '碰撞已结束，驱动推力为零。摩擦始终反向于各自速度；某辆车先停下时，它的摩擦也归零。' : '水平合力为零。没有额外外力，就不会自动把非零速度、总动量或动能归零。',
      end: !sample.stopped ? '这里暂停的是观察窗口。物理模型中速度仍非零；继续滑行不需要持续推力。' : !hit ? (sample.work === 0 ? '小车没有起步：静摩擦平衡推力，既没有位移，也没有碰撞。' : '小车在抵达目标前已被摩擦阻停，因此没有发生碰撞。') : p.wall && p.restitution === 0 ? '墙的外部冲量使小车在接触瞬间静止。动能转为碰撞耗散，动量传给墙与地球。' : '碰撞先重新分配速度并可能耗散部分动能；随后摩擦把剩余平动动能耗尽，两车才全部停稳。'
    };
    let forceText = sample.drive > 0 ? `与摩擦相抵后，A 的合力为 ${fixed(force)} N，a = ${fixed(force / p.mass)} m/s²。` : '推力为零，不代表速度为零；此后只剩摩擦或接触冲量改变运动。';
    let frictionText = p.friction ? (moving ? '方向与各自速度相反；反弹后，A 的摩擦方向也会反转。' : sample.drive > 0 ? '静摩擦与推力平衡，大小按需取值且不超过 μmg；这里不产生位移。' : '静止且无驱动时不继续施加滑动摩擦，不会把小车推向反方向。') : 'μ = 0，摩擦为零。撤力或碰后会保持已有速度。';
    let velocityText = key === 'push' ? 'Δv 来自合力随时间的累积，速度不是由推力直接指定。' : key === 'coast' || key === 'braking' ? (p.friction ? '速率逐渐减小；负速度也趋近零。任一车到零后保持静止。' : '速度保持不变，位置仍持续变化。') : key === 'end' ? (sample.stopped ? '两车的速度均为零，位置不再变化。' : '当前速度非零，结束演示不等于停止运动。') : '这是该讲解帧对应的速度；负号表示向左。';
    let momentumValue = `${fixed(momentum)} kg·m/s`;
    let momentumText = `${p.wall ? '小车' : '两车'}当前总动量 p = Σmv；外力合计 ${fixed(sumF)} N，所以此刻 dp/dt = ${fixed(sumF)} kg·m/s²。`;
    let energyValue = `K = ${fixed(sample.kinetic)} J`;
    let energyText = sample.work === 0 ? '没有位移，推力还未做功。' : `推力累计做功 ${fixed(sample.work)} J；摩擦耗散 ${fixed(sample.frictionHeat)} J，碰撞耗散 ${fixed(sample.collisionHeat)} J。`;
    if (sample.work > 0 && key === 'push') energyText = '推力做正功，一部分增加动能，一部分被摩擦耗散。' + energyText;
    if (key === 'coast' || key === 'braking') energyText = (p.friction ? '推力不再做功，动能继续转为摩擦耗散。' : '推力与摩擦均不做功，动能保持不变。') + energyText;
    let velocityValue = `A ${fixed(sample.A.velocity)}${p.wall ? '' : ` / B ${fixed(sample.B.velocity)}`} m/s`;
    if (contact && hit) {
      if (key === 'before') { momentumText = '先记录碰前总动量。下一帧只比较接触前后，不能把整个摩擦滑行过程都当成动量守恒。'; energyText = `碰前总动能 ${fixed(hit.kineticBefore)} J。先前已有 ${fixed(sample.frictionHeat)} J 转为摩擦耗散。`; }
      else {
        velocityValue = `A ${fixed(hit.uA)} → ${fixed(hit.vA)} m/s` + (p.wall ? '' : `<br>B ${fixed(hit.uB)} → ${fixed(hit.vB)} m/s`);
        velocityText = '在同一接触位置比较碰前、碰后；瞬时冲量模型让速度发生跳变。';
        momentumValue = `${fixed(hit.momentumBefore)} → ${fixed(hit.momentumAfter)} kg·m/s`;
        momentumText = p.wall ? `Jₐ = ${fixed(hit.impulseA)} N·s；墙与地球接受 ${fixed(-hit.impulseA)} N·s。小车系统受外部冲量。` : `pₐ ${fixed(p.mass * hit.uA)} → ${fixed(p.mass * hit.vA)}，pᵦ ${fixed(p.massB * hit.uB)} → ${fixed(p.massB * hit.vB)} kg·m/s。Jₐ ${fixed(hit.impulseA)}、Jᵦ +${fixed(hit.impulseB)} N·s，Δp 相互抵消。`;
        energyValue = `${fixed(hit.kineticBefore)} → ${fixed(hit.kineticAfter)} J`;
        energyText = hit.loss < 1e-9 ? 'e = 1，理想弹性碰撞，碰撞本身不损失平动动能。随后摩擦仍可能耗散动能。' : `减少的 ${fixed(hit.loss)} J 转为形变、热、声音等耗散，并非能量消失。`;
      }
      if (impactFrame) { forceText = '接触时已撤去推力。碰撞作用用 J = Δp 表示；未给接触时长，不能据此求接触力峰值。'; frictionText = '这里列出碰后即刻的摩擦。紧邻接触的两个瞬间，有限摩擦的冲量可忽略；碰后滑行仍要计算摩擦。'; }
    }
    if (key === 'end' && sample.stopped && sample.work > 0) energyText = `平动动能为零：${fixed(sample.work)} J 推力做功 = ${fixed(sample.frictionHeat)} J 摩擦耗散 + ${fixed(sample.collisionHeat)} J 碰撞耗散。`;
    if (key === 'end' && sample.stopped) momentumText = !hit ? (sample.work === 0 ? '总动量一直为零，推力与静摩擦的外力相抵。' : '推力先增加小车动量；撤力后，地面的摩擦冲量又使其归零。') : p.wall && p.restitution === 0 ? `墙的外部冲量 ${fixed(hit.impulseA)} N·s 使小车动量归零，墙与地球接受相反冲量。` : `碰后总动量为 ${fixed(hit.momentumAfter)} kg·m/s；随后摩擦给车系统 ${fixed(-hit.momentumAfter)} N·s 的总冲量，使其归零。地面接受相反冲量。`;
    const cards = [['推力', `${fixed(sample.drive)} N`, forceText, 'force'], ['摩擦力', `A ${fixed(sample.frictionA)}${p.wall ? '' : ` / B ${fixed(sample.frictionB)}`} N`, frictionText, 'friction'], ['速度', velocityValue, velocityText, 'velocity'], ['动量', momentumValue, momentumText, 'momentum'], ['能量', energyValue, energyText, 'energy']];
    const html = cards.map(([name, value, text, type]) => `<article class="guide-quantity" data-quantity="${type}"><h3>${name}</h3><strong>${value}</strong><p>${text}</p></article>`).join('');
    if ($('guide-cards').innerHTML !== html) $('guide-cards').innerHTML = html;
    $('guide-title').textContent = titles[key]; $('guide-lead').textContent = leads[key]; $('guide-count').textContent = `阶段 ${guideCursor.index + 1} / ${chapters.length} · ${chapter.title}`;
    const approach = chapters[guideCursor.index + 1]?.key === 'before' && state.time >= Math.max(chapter.start, chapter.end - .2) - 1e-9;
    $('guide-clock').textContent = contact ? `物理时间固定在 t = ${fixed(state.time)} s。碰前、冲量、碰后三帧用于拆解同一瞬间。` : `物理时间 t = ${fixed(state.time)} s · 当前 ${(state.speed * (approach ? .4 : 1)).toFixed(2)}×${approach ? '（接触前局部慢放）' : ''}`;
    const reason = key === 'end' ? leads.end : impactFrame ? '这页停留 8 秒供阅读；不代表碰撞持续 8 秒。这里求的是冲量，物理时间没有向前走。' : key === 'after' ? leads.after : key === 'braking' ? (p.friction ? '只要还在滑动，摩擦就继续消耗动能。速度归零后停止施加滑动摩擦，位置保持不变。' : '没有摩擦就没有这一段减速；观察末端仍保留速度。') : key === 'coast' ? '撤力只是停止继续推动。已经获得的速度需要反向外力作用一段时间才会减小。' : key === 'before' ? '下一阶段只处理接触产生的动量变化，再进入碰后摩擦减速。' : '推力的大小改变加速度，也会影响接触前速度、碰撞冲量和最后的滑行距离。';
    $('guide-reason').textContent = reason;
    $('guide-prev').disabled = guideCursor.index === 0; $('guide-next').disabled = guideCursor.done;
    $('guide-pause').textContent = state.playing ? '暂停阅读' : guideCursor.done ? '从头重讲' : '继续讲解';
    $('guide-reading').textContent = guideCursor.done ? '本轮讲解结束。可回选任一阶段，或从头讲解。' : !state.playing ? '已暂停供阅读。点“下一阶段”逐段看，或“继续讲解”自动播放。' : chapter.hold ? `阅读停留还剩 ${Math.ceil(chapter.hold - guideCursor.reading)} 秒，可点“下一阶段”提前继续。` : '可随时暂停阅读；上方阶段按钮也可直接跳转。';
    const navKey = chapters.map(item => `${item.key}:${item.title}`).join(',');
    if ($('phase-strip').dataset.guideKey !== navKey) {
      $('phase-strip').dataset.guideKey = navKey;
      $('phase-strip').innerHTML = chapters.map((item, i) => `<button data-chapter="${i}" aria-label="第 ${i + 1} 阶段：${item.title}">${i + 1} ${item.title}</button>`).join('');
    }
    $all('[data-chapter]').forEach(button => { const active = Number(button.dataset.chapter) === guideCursor.index; button.classList.toggle('active', active); if (active) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current'); });
    if ($('guide-announcement').dataset.chapter !== key) { $('guide-announcement').dataset.chapter = key; $('guide-announcement').textContent = `${chapter.title}。${titles[key]}`; }
    $('stage').dataset.guideChapter = key; $('stage').dataset.guideReading = guideCursor.reading;
  }
  function collisionChart(target, forcePlot = false) {
    const lab = collisionLab, hit = lab.collision, duration = collisionEnd();
    const times = Array.from({ length: 101 }, (_, i) => duration * i / 100);
    for (const t of [lab.forceEnd, hit?.time, lab.stopTime]) if (Number.isFinite(t)) times.push(t);
    if (hit && state.params.friction > 0) for (const v of [hit.vA, hit.vB]) times.push(hit.time + Math.abs(v) / (state.params.friction * 9.81));
    const points = [...new Set(times)].sort((a, b) => a - b).flatMap(t => {
      if (hit && t === hit.time) return [lab.sample(t, 'before'), lab.sample(t)];
      if (t === lab.forceEnd && t > 0) return [lab.sample(t - 1e-8), lab.sample(t)];
      return [lab.sample(t)];
    });
    const series = forcePlot ? [['drive', '#efbf7c'], ['frictionA', '#e78b8b'], ...(state.scenario === 'wall' ? [] : [['frictionB', '#b9a0e6']])] : [['A', '#a1e7bc'], ...(state.scenario === 'wall' ? [] : [['B', '#efbf7c']])];
    const value = (point, key) => forcePlot ? point[key] : point[key].velocity;
    const values = series.flatMap(([key]) => points.map(point => value(point, key)));
    const lo = Math.min(0, ...values), hi = Math.max(1, ...values), span = hi - lo;
    const xx = t => 50 + t / duration * 730, yy = v => 112 - (v - lo) / span * 84;
    let svg = '';
    for (let i = 0; i <= 2; i++) { const v = lo + span * i / 2; svg += `<path d="M50 ${yy(v)}H780" stroke="#315056"/>${svgText(41, yy(v) + 4, v.toFixed(1), 'text-anchor="end"')}`; }
    svg += `<path d="M50 ${yy(0)}H780" stroke="#66837e"/>`;
    for (let i = 0; i <= 4; i++) svg += svgText(xx(duration * i / 4), 140, (duration * i / 4).toFixed(1), 'text-anchor="middle"');
    for (const [key, color] of series) {
      const path = points.map((point, i) => `${i ? 'L' : 'M'}${xx(point.time).toFixed(3)},${yy(value(point, key)).toFixed(3)}`).join(' ');
      const played = points.filter(point => point.time < state.time || point.time === state.time && !(state.collisionSide === 'before' && point.impacted));
      played.push(lab.sample(state.time, state.collisionSide));
      const playedPath = played.map((point, i) => `${i ? 'L' : 'M'}${xx(point.time).toFixed(3)},${yy(value(point, key)).toFixed(3)}`).join(' ');
      svg += `<path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" opacity=".28"/><path d="${playedPath}" fill="none" stroke="${color}" stroke-width="2.5"/>`;
    }
    if (hit) svg += `<path d="M${xx(hit.time)} 21V115" stroke="#f3dba7" stroke-dasharray="4 4"/>${svgText(xx(hit.time) + 6, 17, forcePlot ? `Jₐ = ${hit.impulseA.toFixed(2)} N·s` : `碰撞 ${hit.time.toFixed(2)} s`)}`;
    svg += `<path d="M${xx(state.time)} 24V116" stroke="#e9f8e6" opacity=".6"/>` + svgText(7, 20, forcePlot ? 'F / N' : 'v / m·s⁻¹') + svgText(838, 140, 't / s', 'text-anchor="end"');
    $(target).innerHTML = svg;
  }
  function renderCollision() {
    const lab = collisionLab, p = lab.params, hit = lab.collision, sample = lab.sample(state.time, state.collisionSide), wall = p.wall;
    motion = { A: sample.A, B: sample.B };
    const contactView = hit && state.time === hit.time, justHit = hit && sample.impacted && state.time - hit.time < .2;
    const phase = state.guided ? chapters[guideCursor.index].title : contactView ? (state.collisionSide === 'before' ? '碰前一刻' : '碰后一刻') : justHit ? '刚发生碰撞' : sample.phase;
    hud([[`A · ${p.mass} kg`, sample.A.velocity.toFixed(2), 'm/s'], [wall ? 'A 车合力' : `B · ${p.massB} kg`, (wall ? sample.drive + sample.frictionA : sample.B.velocity).toFixed(2), wall ? 'N' : 'm/s'], ['当前阶段', phase, '']]);
    $('position-readout').textContent = `中心位置 A = ${sample.A.position.toFixed(3)} m${wall ? ' · 墙面 x = 6 m' : ` · B = ${sample.B.position.toFixed(3)} m`}`;
    if (state.guided) renderGuide(sample);
    else { $('phase-strip').dataset.guideKey = ''; $('phase-strip').innerHTML = ['施力加速', '撤力滑行', '碰撞', '碰撞后', '静止'].map((name, i) => `<span class="${(contactView || justHit ? i === 2 : name === sample.phase) ? 'active' : ''}">${i + 1} ${name}</span>`).join('<b>→</b>'); }
    $('result-label').textContent = 'A 车此刻合力'; $('result-value').textContent = (sample.drive + sample.frictionA).toFixed(2); $('result-unit').textContent = 'N';
    $('result-note').textContent = `推力 ${sample.drive.toFixed(2)} N，摩擦 ${sample.frictionA.toFixed(2)} N；a = ${((sample.drive + sample.frictionA) / p.mass).toFixed(2)} m/s²。碰撞瞬间另用冲量描述。`;
    $('gesture-hint').textContent = contactView ? `同一位置、同一时刻 · ${phase} · A ${sample.A.velocity.toFixed(2)} m/s` : sample.stopped ? '速度已降为零 · 物理停止，可回看碰前与碰后' : sample.drive > 0 ? `${sample.drive} N 推力 → 净加速度 ${((sample.drive + sample.frictionA) / p.mass).toFixed(2)} m/s²` : sample.impacted ? (p.friction ? '碰撞已经结束 · 摩擦继续让小车减速' : '没有摩擦 → 碰后仍保持速度继续运动') : '推力已撤去 · 继续接近目标';
    const impulseFrame = state.guided && chapters[guideCursor.index].key === 'impulse';
    $('stage-instruction').textContent = impulseFrame ? '紫色箭头 = 碰撞冲量方向（N·s）· 物理时间冻结' : '绿 A / 黄 B · 上箭头为推力，同色箭头为速度，红箭头为摩擦';
    if (impulseFrame && hit) $('gesture-hint').textContent = `Jₐ = ${hit.impulseA.toFixed(3)} N·s${wall ? ' · 墙接受相反冲量' : ` · Jᵦ = +${hit.impulseB.toFixed(3)} N·s`}`;
    $('tool-hint').textContent = state.guided ? '默认 0.25× · 碰撞三帧留出阅读时间 · 可手动上一/下一阶段' : '先看一遍，再点「碰前一刻 / 碰后一刻」比较。'; $('push-button').hidden = true;
    $('chart-caption').textContent = '绿 A · 黄 B · 淡线为完整计算，亮线为已播放';
    const endTime = collisionEnd();
    $('timeline').value = Math.round(state.time / endTime * 1000); $('timeline').disabled = false;
    $('timeline').setAttribute('aria-label', '回看完整碰撞过程'); $('timeline').setAttribute('aria-valuetext', `${state.time.toFixed(2)} 秒，共 ${endTime.toFixed(2)} 秒`);
    $('timeline-value').textContent = `${state.time.toFixed(2)} / ${endTime.toFixed(2)} s`;
    $('timeline-note').textContent = state.guided ? '拖动会切换自由回看；点“从头讲解”恢复分阶段播放' : '完整解析时间轴 · 可直接跳到事件或拖动，再继续播放';
    $all('[data-jump]').forEach(button => { button.disabled = ['before', 'impulse', 'after'].includes(button.dataset.jump) ? !hit : button.dataset.jump === 'stop' ? !Number.isFinite(lab.stopTime) : false; });
    const tableRow = (name, before, after, unit) => `<tr><th scope="row">${name}</th><td>${before.toFixed(3)}</td><td>${after.toFixed(3)}</td><td>${unit}</td></tr>`;
    $('impact-title').textContent = hit ? `${hit.time.toFixed(3)} s · ${wall ? '小车与墙' : '两车'}接触` : '本组条件没有发生碰撞';
    $('impact-table').innerHTML = hit ? `<table><thead><tr><th>物理量</th><th>碰前</th><th>碰后</th><th>单位</th></tr></thead><tbody>${tableRow('A 速度', hit.uA, hit.vA, 'm/s')}${wall ? '' : tableRow('B 速度', hit.uB, hit.vB, 'm/s')}${tableRow(wall ? '小车动量' : '两车总动量', hit.momentumBefore, hit.momentumAfter, 'kg·m/s')}${tableRow('总平动动能', hit.kineticBefore, hit.kineticAfter, 'J')}</tbody></table>` : '<p>小车在到达目标前已停下，或推力不足以克服摩擦。试着加大推力、延长施力或降低摩擦。</p>';
    $('impact-equation').textContent = hit ? `Jₐ = ${hit.impulseA.toFixed(3)} N·s；${wall ? `墙与地球接受 ${(-hit.impulseA).toFixed(3)} N·s。小车动量不守恒。` : `Jᵦ = ${hit.impulseB.toFixed(3)} N·s。碰撞瞬间 Δp总 = ${(hit.momentumAfter - hit.momentumBefore).toFixed(6)} kg·m/s。`}` : '';
    const ledger = [['平动动能', sample.kinetic, 'kinetic'], ['摩擦耗散', sample.frictionHeat, 'friction'], ['碰撞耗散', sample.collisionHeat, 'impact']];
    $('energy-ledger').innerHTML = `<div class="work-total">推力累计做功 <strong>${sample.work.toFixed(3)} J</strong></div>` + ledger.map(([name, value, key]) => `<div class="energy-row"><span>${name}</span><strong>${value.toFixed(3)} J</strong><div class="energy-bar ${key}"><i style="width:${sample.work > 0 ? Math.min(100, value / sample.work * 100) : 0}%"></i></div></div>`).join('');
    $('energy-equation').textContent = `W推力 = K + E摩擦 + E碰撞；平衡误差 ${Math.abs(sample.work - sample.kinetic - sample.frictionHeat - sample.collisionHeat).toExponential(1)} J。`;
    const stops = Number.isFinite(lab.stopTime), end = lab.sample(stops ? lab.stopTime : lab.duration);
    $('stop-title').textContent = !hit ? '没有撞上：在接触前停止' : !stops ? '不会自行停下：观察结束时仍在滑行' : wall && p.restitution === 0 ? '撞墙后直接停下' : `最终在 ${lab.stopTime.toFixed(3)} s 全部停稳`;
    $('stop-explanation').textContent = !hit ? (p.force <= p.friction * p.mass * 9.81 ? '当前推力未超过最大有效静摩擦，小车保持静止。' : '撤力后的剩余动能被摩擦消耗，尚未抵达目标。') : !stops ? `μ = 0，碰后速度 A = ${hit.vA.toFixed(3)}${wall ? '' : `、B = ${hit.vB.toFixed(3)}`} m/s。${p.restitution === 0 && !wall ? '粘连只让两车同速，并不会消除总动量。' : '动画到观察时限暂停，速度没有被强行归零。'}` : `碰撞消耗 ${hit.loss.toFixed(3)} J；${wall && p.restitution === 0 ? 'e = 0，墙的冲量使小车速度瞬时变为零。' : `碰后剩余的 ${hit.kineticAfter.toFixed(3)} J 动能由摩擦继续消耗，速度才逐渐降为零。`}`;
    $('stop-positions').innerHTML = `<span>${stops ? '停止位置' : '观察末位置'} A <strong>${end.A.position.toFixed(3)} m</strong></span>${wall ? '' : `<span>B <strong>${end.B.position.toFixed(3)} m</strong>（初始 6 m）</span>`}`;
    Object.assign($('stage').dataset, { manual: false, time: state.time, position: sample.A.position, positionB: sample.B.position, velocity: sample.A.velocity, velocityB: sample.B.velocity, appliedForce: sample.drive, phase, collided: sample.impacted, energyError: sample.work - sample.kinetic - sample.frictionHeat - sample.collisionHeat });
    if (graphics) {
      for (const [key, mass, friction] of [['A', p.mass, sample.frictionA], ['B', p.massB, sample.frictionB]]) {
        const part = graphics[key], val = sample[key]; part.cart.position.x = val.position - 3;
        part.blocks.forEach((block, i) => { block.visible = i < Math.round(mass); }); part.wheels.forEach(wheel => { wheel.rotation.y = -val.position / .2; });
        part.arrow.visible = key === 'A' && sample.drive > 0; part.arrow.setLength(.5 + sample.drive * .07, .22, .14);
        part.velocityArrow.visible = Math.abs(val.velocity) > .001; part.velocityArrow.setDirection(new THREE.Vector3(Math.sign(val.velocity) || 1, 0, 0)); part.velocityArrow.setLength(.3 + Math.min(3, Math.abs(val.velocity) * .18), .2, .13);
        part.frictionArrow.visible = Math.abs(friction) > .001; part.frictionArrow.setDirection(new THREE.Vector3(Math.sign(friction) || -1, 0, 0)); part.frictionArrow.setLength(.3 + Math.min(1.2, Math.abs(friction) * .1), .15, .1);
        part.impulseArrow.visible = Boolean(impulseFrame && hit); if (hit) { const impulse = key === 'A' ? hit.impulseA : hit.impulseB; part.impulseArrow.setDirection(new THREE.Vector3(Math.sign(impulse) || 1, 0, 0)); part.impulseArrow.setLength(.6 + Math.min(1.5, Math.abs(impulse) * .09), .3, .2); }
        if (impulseFrame) { part.arrow.visible = false; part.frictionArrow.visible = false; part.velocityArrow.visible = false; }
      }
      graphics.B.cart.visible = !wall; graphics.wall.visible = wall;
      graphics.impact.visible = Boolean(hit && Math.abs(state.time - hit.time) < .16); if (hit) graphics.impact.position.set(hit.positionA - 3 + .6, .7, 0);
      const left = Math.min(sample.A.position, wall ? 6 : sample.B.position) - 5.3, right = Math.max(sample.A.position, wall ? 6 : sample.B.position) - .7;
      const aspect = $('stage').clientWidth / $('stage').clientHeight;
      const center = (left + right) / 2, span = Math.max(3.3, 2.8 * aspect, (right - left) / 2 + .2), shift = center - graphics.controls.target.x;
      graphics.controls.target.x = center; graphics.camera.position.x += shift;
      Object.assign(graphics.camera, { left: -span, right: span, top: span / aspect, bottom: -span / aspect }); graphics.camera.updateProjectionMatrix();
      graphics.track.scale.x = right - left + 2; graphics.track.position.x = center;
    }
    collisionChart('chart'); collisionChart('force-chart', true);
  }
  $all('[data-preset]').forEach(button => button.addEventListener('click', () => {
    takeControl(); const preset = button.dataset.preset, old = isCollision(); state.scenario = preset === 'wall' ? 'wall' : 'collision';
    state.params = { ...lessons.newton.defaults, ...(preset === 'elastic' ? { massB: 2, restitution: 1 } : preset === 'sticky' ? { restitution: 0 } : preset === 'heavy' ? { massB: 8, restitution: .8 } : preset === 'frictionless' ? { friction: 0, restitution: 0 } : { restitution: 0 }) };
    syncInputs(); restart(true); if (!old) { disposeScene(); createScene(); } resetCamera(); render();
  }));
  function selectChapter(index, playing = false) {
    takeControl(); guideCursor = models.chapterCursor(chapters, index); state.time = guideCursor.time; state.collisionSide = guideCursor.side; state.playing = playing && !guideCursor.done; lastFrame = performance.now(); render();
  }
  $all('[data-jump]').forEach(button => button.addEventListener('click', () => {
    takeControl(); state.playing = false; const jump = button.dataset.jump;
    if (state.guided || jump === 'impulse') {
      if (!state.guided) { state.guided = true; state.speed = .25; $('speed').value = state.speed; $('parameter-settings').open = false; }
      const target = ({ start: 'push', release: 'coast', stop: 'end' })[jump] || jump;
      const index = chapters.findIndex(chapter => chapter.key === target);
      const contactIndex = chapters.findIndex(chapter => chapter.key === 'before');
      selectChapter(index < 0 ? (contactIndex < 0 ? chapters.length - 1 : contactIndex) : index); return;
    }
    state.time = jump === 'start' ? 0 : jump === 'release' ? collisionLab.forceEnd : jump === 'stop' ? collisionLab.stopTime : collisionLab.collision.time;
    state.collisionSide = jump === 'before' ? 'before' : 'after'; render();
  }));
  $('phase-strip').addEventListener('click', event => { const button = event.target.closest('[data-chapter]'); if (button) selectChapter(Number(button.dataset.chapter)); });
  $('guide-prev').addEventListener('click', () => selectChapter(guideCursor.index - 1));
  $('guide-next').addEventListener('click', () => selectChapter(guideCursor.index + 1));
  $('guide-pause').addEventListener('click', () => $('play').click());
  $('guide-restart').addEventListener('click', () => { takeControl(); state.guided = true; state.speed = .25; $('speed').value = state.speed; $('parameter-settings').open = false; restart(true); render(); });
  $('guided-toggle').addEventListener('change', event => {
    takeControl(); state.guided = event.target.checked; state.speed = state.guided ? .25 : 1; $('speed').value = state.speed; $('parameter-settings').open = !state.guided;
    if (state.guided) restart(false); render();
  });
  function sineLayout() {
    const compact = $('stage').clientWidth < 500, width = compact ? 560 : 900;
    return { compact, width, cx: compact ? 88 : 145, cy: 250, start: compact ? 205 : 315, end: width - 35, scale: compact ? 31 : 47 };
  }
  function renderSine() {
    const { amplitude: a, frequency: w, phase } = state.params, phi = phase * Math.PI / 180, x = state.time % TAU;
    const { compact, width, cx, cy, start, end, scale } = sineLayout(), xx = value => start + value / TAU * (end - start), yy = value => cy - value * scale;
    const value = models.sine(a, w, phi, x), theta = w * x + phi, px = cx + a * scale * Math.cos(theta), py = yy(value);
    let svg = '';
    for (let y = -3; y <= 3; y++) svg += `<path d="M${start} ${yy(y)}H${end}" stroke="${y ? '#2c4b52' : '#72998b'}"/>${svgText(start - 10, yy(y) + 4, y, 'text-anchor="end"')}`;
    for (let i = 0; i <= 4; i++) { const tx = xx(i * Math.PI / 2); svg += `<path d="M${tx} ${yy(-3)}V${yy(3)}" stroke="#2c4b52"/>${svgText(tx, yy(-3) + 22, ['0', 'π/2', 'π', '3π/2', '2π'][i], 'text-anchor="middle"')}`; }
    const curve = (amp, freq, phase) => Array.from({ length: 281 }, (_, i) => `${i ? 'L' : 'M'}${xx(TAU * i / 280).toFixed(2)},${yy(models.sine(amp, freq, phase, TAU * i / 280)).toFixed(2)}`).join(' ');
    svg += `<path d="${curve(1.5, 1, 0)}" fill="none" stroke="#597578" stroke-width="2" stroke-dasharray="5 6"/><path d="${curve(a, w, phi)}" fill="none" stroke="#a5e5b7" stroke-width="3.5"/>`;
    svg += `<path d="M${cx - 78} ${cy}H${cx + 78}M${cx} ${cy - 125}V${cy + 125}" stroke="#36565c"/><circle cx="${cx}" cy="${cy}" r="${a * scale}" fill="none" stroke="#7bb19b" stroke-width="2"/><path d="M${cx} ${cy}L${px} ${py}" stroke="#efb773" stroke-width="3"/><path d="M${px} ${py}H${xx(x)}M${xx(x)} ${yy(-3)}V${yy(3)}" stroke="#8fbbaa" stroke-dasharray="5 5"/>`;
    svg += `<circle data-drag="phase" cx="${px}" cy="${py}" r="12" fill="#f3bb79" stroke="#f9dfb3" stroke-width="2"/><circle data-drag="amplitude" cx="${cx}" cy="${yy(a)}" r="9" fill="#91dbb0" stroke="#d9f5cf" stroke-width="2"/><circle data-drag="scan" cx="${xx(x)}" cy="${py}" r="8" fill="#b9f2bc" stroke="#477d63" stroke-width="3"/>`;
    svg += svgText(cx, 108, '拖动橙点改相位', 'text-anchor="middle"') + svgText(start, 108, compact ? '实线当前 / 虚线原始' : '当前波形 · 虚线为原始波形') + svgText(end, yy(-3) + 43, 'x / rad', 'text-anchor="end"');
    $('main-svg').setAttribute('viewBox', `0 0 ${width} 450`); $('main-svg').innerHTML = svg; $('stage').dataset.renderer = 'svg';
    hud([['采样位置 x', x.toFixed(2), 'rad'], ['当前 y', value.toFixed(2), ''], ['周期 T', (TAU / w).toFixed(2), 'rad']]);
    $('result-label').textContent = '当前函数周期'; $('result-value').textContent = (TAU / w).toFixed(2); $('result-unit').textContent = 'rad';
    $('result-note').textContent = `振幅 ${a}，角频率 ${w}，相位 ${phase}°。虚线保留原始波形，方便直接比较。`;
    $('gesture-hint').textContent = ''; $('stage-instruction').textContent = '橙点改相位 · 绿点改振幅 · 拖动曲线上的点回看';
    $('tool-hint').textContent = '可直接拖动画面中的点；图形与参数双向同步。'; $('push-button').hidden = true;
  }
  function renderMolecule() {
    const { angle } = state.params, reference = Math.abs(angle - 104.5) < .01;
    hud([['参考键长', '95.8', 'pm'], ['当前键角', angle.toFixed(1), '°'], ['已选原子', state.selectedAtom === 'O' ? 'O' : 'H', '']]);
    $('result-label').textContent = reference ? '水分子参考键角' : '你调整的假想键角'; $('result-value').textContent = angle.toFixed(1); $('result-unit').textContent = '°';
    $('result-note').textContent = `${state.selectedAtom === 'O' ? '氧 O：原子序数 8，位于两条键的连接处。' : '氢 H：原子序数 1，可以直接拖动。'}${reference ? '' : '当前是几何探索，不是稳定构型。'}`;
    $('gesture-hint').textContent = atomDrag ? '正在拖动氢原子 · 键角实时变化' : '抓住一个氢原子，试着把它拉开';
    $('stage-instruction').textContent = '拖原子改键角 · 拖背景转视角 · 滚轮缩放'; $('tool-hint').textContent = '点“拖动氢原子”切到正视角，更容易操作。'; $('push-button').hidden = true;
    $all('[data-atom]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.atom === state.selectedAtom)));
  }
  function projectLabel(id, world, text) {
    const vector = world.clone().project(graphics.camera), label = $(id);
    label.hidden = vector.z < -1 || vector.z > 1 || Math.abs(vector.x) > 1 || Math.abs(vector.y) > 1;
    label.style.left = `${(vector.x * .5 + .5) * $('stage').clientWidth}px`; label.style.top = `${(-vector.y * .5 + .5) * $('stage').clientHeight}px`; label.textContent = text;
  }
  function updateProjectedLabels() {
    if (!graphics) { $('object-label').hidden = true; $('secondary-label').hidden = true; return; }
    const world = new THREE.Vector3();
    if (state.lesson === 'newton') {
      if (isCollision()) {
        graphics.A.cart.getWorldPosition(world); world.y += 1.05; projectLabel('object-label', world, 'A');
        if (state.scenario !== 'wall') { graphics.B.cart.getWorldPosition(world); world.y += 1.05; projectLabel('secondary-label', world, 'B'); } else $('secondary-label').hidden = true;
        return;
      }
      const forces = applied(); graphics.A.cart.getWorldPosition(world); world.y += 1.65; projectLabel('object-label', world, `A · ${forces.massA} kg · ${motion.A.position.toFixed(1)} m`);
      if (state.scenario !== 'push') { graphics.B.cart.getWorldPosition(world); world.y += 1.65; projectLabel('secondary-label', world, `B · ${forces.massB} kg · ${motion.B.position.toFixed(1)} m`); } else $('secondary-label').hidden = true;
    } else {
      if (state.params.labels) { graphics.atoms.find(atom => atom.userData.atom === state.selectedAtom).getWorldPosition(world); world.y += state.selectedAtom === 'O' ? -.95 : .7; projectLabel('object-label', world, state.selectedAtom === 'O' ? 'O · 氧' : 'H · 氢，拖动我'); } else $('object-label').hidden = true;
      world.set(0, 1.12, .05); graphics.group.localToWorld(world); projectLabel('secondary-label', world, `${state.params.angle.toFixed(1)}°`);
    }
  }
  function render() {
    const content = lessons[state.lesson];
    if (!isCollision()) for (const key of ['collided', 'phase', 'energyError', 'velocityB']) delete $('stage').dataset[key];
    if (!isCollision() || !state.guided) for (const key of ['guideChapter', 'guideReading']) delete $('stage').dataset[key];
    for (const id of ['collision-presets', 'phase-strip', 'collision-events', 'force-chart-panel', 'collision-analysis', 'position-readout', 'guide-toolbar']) $(id).hidden = !isCollision();
    $('guide-coach').hidden = !(isCollision() && state.guided); $('guided-toggle').checked = state.guided;
    $('main').classList.toggle('guided-mode', isCollision() && state.guided);
    const coachParent = window.innerWidth <= 900 ? document.querySelector('.experiment') : document.querySelector('.control-panel');
    if ($('guide-coach').parentElement !== coachParent) coachParent.insertBefore($('guide-coach'), coachParent.matches('.experiment') ? $('timeline-panel') : coachParent.firstChild);
    $('main').classList.toggle('collision-mode', isCollision());
    if (state.lesson === 'newton') {
      $all('[data-param]').forEach(control => { control.hidden = !isCollision() && !['force', 'mass'].includes(control.dataset.param) || state.scenario === 'wall' && control.dataset.param === 'massB'; });
      $('stage-label').textContent = isCollision() ? (state.scenario === 'wall' ? '小车撞墙 · 右为正方向' : '同轨两车正碰 · 右为正方向') : '独立无摩擦轨道 · 60 m';
      $('stage').setAttribute('aria-label', isCollision() ? '小车碰撞三维场景。可拖动旋转，使用下方事件按钮比较碰前、碰后和停稳。' : '双车对照实验；亲手推车模式下按住空格施力，松开后保持滑行');
      $('control-hint').textContent = isCollision() ? content.hint : '推力可以在运动中改变，修改质量会重新出发。亲推模式按住施力、松手后匀速滑行。';
    }
    for (const [key, , , , , unit] of content.ranges) $(`output-${key}`).textContent = `${state.params[key]} ${unit}`;
    if (state.lesson === 'newton') renderNewton(); else if (state.lesson === 'sine') renderSine(); else renderMolecule();
    $('time-display').textContent = state.lesson === 'sine' ? `x = ${(state.time % TAU).toFixed(2)}` : `${isCollision() && state.guided ? '物理时间 ' : ''}t = ${state.time.toFixed(2)} s`;
    $('play').textContent = isCollision() && state.guided ? (state.playing ? 'Ⅱ 暂停讲解' : finished() ? '重讲一遍' : '▶ 继续讲解') : state.playing ? (state.preview ? 'Ⅱ 暂停演示' : 'Ⅱ 暂停') : state.lesson === 'newton' && finished() ? '重新开始' : '▶ 继续运动';
    $('play').setAttribute('aria-pressed', String(state.playing)); $('step').disabled = state.playing || (state.lesson === 'newton' && finished());
    $('render-status').textContent = isCollision() && finished() ? (collisionLab.sample(state.time).stopped ? '已停稳 · 可回看全过程' : '观察结束 · 仍在运动') : state.replayApplied ? '正在回看记录的这一刻' : state.preview && state.playing ? '自动演示中 · 可随时接管' : state.playing ? '实验进行中' : '已暂停 · 可直接操作';
    $('step').hidden = isCollision() && state.guided;
    if (isCollision() && state.guided && chapters[guideCursor.index].hold > 0) $('render-status').textContent = '物理时间冻结 · 比较碰撞瞬间';
    $all('[data-action]').forEach(button => { const active = state.lesson === 'newton' ? button.dataset.action === state.scenario : state.lesson === 'sine' ? button.dataset.action === ({ 1: 'original', 2: 'double', 3: 'triple' }[state.params.frequency]) : button.dataset.action === state.moleculeMode; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
    if (graphics) { graphics.controls.update(); graphics.scene.updateMatrixWorld(true); graphics.renderer.render(graphics.scene, graphics.camera); updateProjectedLabels(); }
    else if (state.lesson === 'sine') { $('object-label').hidden = true; $('secondary-label').hidden = true; }
  }
  function finished() { return isCollision() ? (state.guided ? guideCursor.done : state.time >= collisionEnd() - 1e-8) : state.time >= limitTime() - 1e-8 || (motion.A.finished && (state.scenario === 'push' || motion.B.finished)); }
  function advance(delta) {
    if (state.lesson === 'newton') {
      if (isCollision()) {
        if (state.guided) { guideCursor = models.advanceChapter(chapters, guideCursor, delta, state.speed); state.time = guideCursor.time; state.collisionSide = guideCursor.side; }
        else { state.time = Math.min(collisionEnd(), state.time + delta * state.speed); state.collisionSide = 'after'; }
        if (finished()) state.playing = false; return;
      }
      branchHistory(); const dt = Math.min(delta, limitTime() - state.time), forces = applied();
      motion.A = models.stepMotion(motion.A, forces.forceA, forces.massA, dt); motion.B = models.stepMotion(motion.B, forces.forceB, forces.massB, dt);
      state.time += dt; history.push(capture(forces)); if (finished()) { state.playing = false; state.held = false; }
    } else { state.time += delta; if (state.lesson === 'molecule' && graphics) graphics.group.rotation.y += delta * state.params.spin; }
  }
  function startPush() {
    if (state.lesson !== 'newton' || state.scenario !== 'push') return;
    takeControl(); if (finished()) restart(false); branchHistory(); state.held = true; state.playing = true; lastFrame = performance.now(); render();
  }
  function releasePush() { if (state.held) { state.held = false; render(); } }
  $('play').addEventListener('click', () => { takeControl(); if (state.lesson === 'newton' && finished()) restart(false); branchHistory(); state.playing = !state.playing; if (!state.playing) state.held = false; if (state.lesson === 'molecule' && state.playing) state.moleculeMode = 'turn'; lastFrame = performance.now(); render(); });
  $('step').addEventListener('click', () => { takeControl(); advance(.1); render(); });
  $('reset').addEventListener('click', () => { takeControl(); state.params = { ...lessons[state.lesson].defaults }; state.selectedAtom = 'O'; syncInputs(); restart(false); if (state.lesson === 'molecule') { state.moleculeMode = 'reference'; $('labels-toggle').checked = true; updateMolecule(); } resetCamera(); render(); });
  $('random').addEventListener('click', () => { takeControl(); for (const [key, , min, max, step] of lessons[state.lesson].ranges) state.params[key] = Number((min + Math.floor(Math.random() * (Math.round((max - min) / step) + 1)) * step).toFixed(3)); syncInputs(); restart(state.scenario !== 'push'); if (state.lesson === 'molecule') state.moleculeMode = 'turn'; updateMolecule(); render(); });
  $('speed').addEventListener('change', event => { takeControl(); state.speed = Number(event.target.value); render(); });
  $('camera-reset').addEventListener('click', () => { resetCamera(); render(); });
  $('timeline').addEventListener('input', event => { takeControl(); state.playing = false; state.held = false; if (isCollision()) { state.guided = false; $('parameter-settings').open = true; state.time = Number(event.target.value) / 1000 * collisionEnd(); state.collisionSide = 'after'; render(); return; } const time = Number(event.target.value) / 1000 * (history.at(-1)?.time || 0); const sample = models.sampleHistory(history, time); state.time = sample.time; motion = { A: { ...sample.A }, B: { ...sample.B } }; state.replayApplied = sample.applied; render(); });
  $('push-button').addEventListener('pointerdown', event => { event.preventDefault(); $('push-button').setPointerCapture(event.pointerId); startPush(); });
  $('push-button').addEventListener('pointerup', releasePush); $('push-button').addEventListener('pointercancel', releasePush); $('push-button').addEventListener('lostpointercapture', releasePush);
  function keyDown(event) { if (event.code === 'Space' && state.lesson === 'newton' && state.scenario === 'push') { event.preventDefault(); if (!event.repeat) startPush(); } }
  for (const element of [$('stage'), $('push-button')]) { element.addEventListener('keydown', keyDown); element.addEventListener('keyup', event => { if (event.code === 'Space') { event.preventDefault(); releasePush(); } }); element.addEventListener('blur', releasePush); }
  function rayAt(event) { const rect = graphics.renderer.domElement.getBoundingClientRect(), ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1), graphics.camera); return ray; }
  $('stage').addEventListener('pointerdown', event => {
    if (!graphics || event.target.closest('button')) return;
    const ray = rayAt(event);
    if (state.lesson === 'newton' && state.scenario === 'push') {
      if (ray.intersectObject(graphics.A.cart, true).length) { graphics.controls.enabled = false; $('stage').setPointerCapture(event.pointerId); startPush(); }
    }
    if (state.lesson === 'molecule') {
      const hit = ray.intersectObjects(graphics.atoms)[0]; if (!hit) return;
      takeControl(); state.playing = false; state.moleculeMode = 'angle'; state.selectedAtom = hit.object.userData.atom;
      if (state.selectedAtom !== 'O') {
        graphics.controls.enabled = false;
        const origin = new THREE.Vector3(); graphics.group.getWorldPosition(origin);
        const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(graphics.group.quaternion);
        atomDrag = { id: event.pointerId, plane: new THREE.Plane().setFromNormalAndCoplanarPoint(normal, origin) }; $('stage').setPointerCapture(event.pointerId);
      }
      updateMolecule(); render();
    }
  }, true);
  $('stage').addEventListener('pointermove', event => {
    if (!atomDrag || !graphics || event.pointerId !== atomDrag.id) return;
    const point = new THREE.Vector3(); if (!rayAt(event).ray.intersectPlane(atomDrag.plane, point)) return;
    graphics.group.worldToLocal(point);
    state.params.angle = Math.round(Math.max(60, Math.min(150, 2 * Math.atan2(Math.abs(point.x), point.y) * 180 / Math.PI)) * 2) / 2;
    $('param-angle').value = state.params.angle; updateMolecule(); render();
  });
  function endPointer() { const wasDragging = !!atomDrag; atomDrag = null; releasePush(); if (graphics) graphics.controls.enabled = true; if (wasDragging) render(); }
  $('stage').addEventListener('pointerup', endPointer); $('stage').addEventListener('pointercancel', endPointer);
  function svgPoint(event) { const point = $('main-svg').createSVGPoint(); point.x = event.clientX; point.y = event.clientY; return point.matrixTransform($('main-svg').getScreenCTM().inverse()); }
  function moveSVG(event) {
    if (!svgDrag) return;
    const point = svgPoint(event), layout = sineLayout(), x = state.time % TAU;
    if (svgDrag === 'phase') { let phase = Math.atan2(layout.cy - point.y, point.x - layout.cx) - state.params.frequency * x; phase = ((phase + Math.PI) % TAU + TAU) % TAU - Math.PI; state.params.phase = Math.round(phase * 180 / Math.PI); }
    if (svgDrag === 'amplitude') state.params.amplitude = Math.round(Math.max(.5, Math.min(2.5, (layout.cy - point.y) / layout.scale)) * 10) / 10;
    if (svgDrag === 'scan') state.time = Math.max(0, Math.min(TAU - .001, (point.x - layout.start) / (layout.end - layout.start) * TAU));
    syncInputs(); render();
  }
  $('main-svg').addEventListener('pointerdown', event => { takeControl(); state.playing = false; svgDrag = event.target.dataset.drag || 'scan'; $('main-svg').setPointerCapture(event.pointerId); moveSVG(event); event.preventDefault(); });
  $('main-svg').addEventListener('pointermove', moveSVG); $('main-svg').addEventListener('pointerup', () => { svgDrag = null; }); $('main-svg').addEventListener('pointercancel', () => { svgDrag = null; });
  $('stage').addEventListener('keydown', event => { if (state.lesson === 'sine' && ['ArrowLeft', 'ArrowRight'].includes(event.code)) { event.preventDefault(); takeControl(); state.playing = false; state.time = (state.time + (event.code === 'ArrowRight' ? .1 : -.1) + TAU) % TAU; render(); } });
  $('quiz-form').addEventListener('submit', event => { event.preventDefault(); const answer = new FormData(event.target).get('answer'), content = lessons[state.lesson]; $('quiz-feedback').textContent = answer === null ? '先选一个答案，再检查。' : `${Number(answer) === content.correct ? '答对了！' : '再想一想。'}${content.answer}`; });
  for (const id of ['about-button', 'about-inline']) $(id).addEventListener('click', () => $('about-dialog').showModal()); $('close-about').addEventListener('click', () => $('about-dialog').close());
  new ResizeObserver(() => { resize(); if (state.lesson) render(); }).observe($('stage'));
  window.addEventListener('hashchange', () => { if (location.hash !== '#main') switchLesson(); });
  window.addEventListener('blur', releasePush); document.addEventListener('visibilitychange', () => { lastFrame = performance.now(); releasePush(); });
  function frame(now) {
    const readingDelta = Math.max(0, (now - lastFrame) / 1000), delta = models.frameDelta(now, lastFrame); lastFrame = now;
    if (!document.hidden) {
      if (state.playing) { advance(isCollision() ? (state.guided ? readingDelta : delta) : delta * state.speed); render(); }
      else if (state.preview && state.lesson === 'newton' && !isCollision() && finished()) { replayWait += delta; if (replayWait > 1.1) { restart(true); render(); } }
      else if (graphics) { graphics.controls.update(); graphics.renderer.render(graphics.scene, graphics.camera); updateProjectedLabels(); }
    }
    requestAnimationFrame(frame);
  }
  switchLesson(); requestAnimationFrame(frame);
})();
