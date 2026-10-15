/* Original teaching scene; no game geometry or libsm64 runtime is embedded. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), model = window.ERMarioModels;
  const upstream = 'https://github.com/deltarooo/er-mario/blob/11744b855bf546ca0b66dfd09068858feaa18d0e/';
  if (/\/web\/(?:index\.html)?$/.test(location.pathname)) document.querySelector('footer>a:last-child').href = '../THIRD_PARTY.md';
  const state = { action: 'triple', seconds: 0, playing: !matchMedia('(prefers-reduced-motion: reduce)').matches, speed: 1, wire: false, visible: true };
  let stage;
  function createStage() {
    const T = window.THREE, host = $('scene');
    const renderer = new T.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8)); renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = .9;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-hidden', 'true');
    const scene = new T.Scene(); scene.background = new T.Color('#223126'); scene.fog = new T.FogExp2('#263729', .026);
    const camera = new T.PerspectiveCamera(39, 1, .1, 110), controls = new T.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 9; controls.maxDistance = 27;
    controls.maxPolarAngle = Math.PI * .46; controls.minPolarAngle = .28;
    function resetCamera() { const mobile = host.clientWidth < 700; camera.position.set(mobile ? 11.6 : 10.2, mobile ? 9 : 7.7, mobile ? 17.5 : 15.2); controls.target.set(0, 1.05, -.2); controls.update(); }
    resetCamera();
    scene.add(new T.HemisphereLight('#f4e2ae', '#25372a', .65));
    const sun = new T.DirectionalLight('#ffe1a0', 1.25); sun.position.set(-3, 11, 3); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11 }); sun.shadow.normalBias = .025; scene.add(sun);
    const rim = new T.DirectionalLight('#d4bf78', .5); rim.position.set(7, 7, -9); scene.add(rim);
    const lamp = new T.PointLight('#efc365', 2, 19, 2); lamp.position.set(3, 4, -5); scene.add(lamp);
    const mat = (color, extra = {}) => {
      const options = { roughness: .9, flatShading: true, ...extra, color: new T.Color(color).convertSRGBToLinear() };
      if (extra.emissive) options.emissive = new T.Color(extra.emissive).convertSRGBToLinear();
      return new T.MeshStandardMaterial(options);
    };
    const moss = mat('#344734'), stone = mat('#62614b'), dark = mat('#293d2c'), paving = mat('#797b5f');
    const gold = mat('#bda967', { emissive: '#705b24', emissiveIntensity: .4 });
    function mesh(geometry, material, x = 0, y = 0, z = 0, parent = scene) { const m = new T.Mesh(geometry, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
    const box = (w, h, d, material, x, y, z, parent) => mesh(new T.BoxGeometry(w, h, d), material, x, y, z, parent);
    const wires = new T.Group(); scene.add(wires); wires.visible = false;
    function edge(m, parent = wires, color = '#c4db8e') { const line = new T.LineSegments(new T.EdgesGeometry(m.geometry), new T.LineBasicMaterial({ color, transparent: true, opacity: .55 })); line.position.copy(m.position); line.rotation.copy(m.rotation); line.scale.copy(m.scale); parent.add(line); return line; }
    edge(mesh(new T.CylinderGeometry(7, 5.9, 1.25, 14), dark, 0, -.69, -.2));
    edge(mesh(new T.CylinderGeometry(7.03, 7, .15, 14), moss, 0, -.07, -.2));
    const islandRing = mesh(new T.RingGeometry(7.2, 7.22, 80), new T.MeshBasicMaterial({ color: '#b5a66f', transparent: true, opacity: .27, side: T.DoubleSide }), 0, -.2, -.2); islandRing.rotation.x = -Math.PI / 2;
    let seed = 7481; const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 52; i++) { const a = random() * Math.PI * 2, r = 4.6 + random() * 2.1; const rock = mesh(new T.DodecahedronGeometry(.2 + random() * .48, 0), i % 3 ? dark : stone, Math.cos(a) * r, .04, Math.sin(a) * r - .2); rock.scale.set(1, .5 + random() * 1.4, .7); rock.rotation.set(random(), random() * 4, random()); }
    for (let i = 0; i < 13; i++) { const tile = box(.62, .055, .65, paving, -4.4 + i * .7, .012, 1.15 + (random() - .5) * .25); tile.rotation.y = (random() - .5) * .3; edge(tile); }
    for (let i = 0; i < 26; i++) { const a = random() * Math.PI * 2, r = 13 + random() * 22; const hill = mesh(new T.ConeGeometry(3 + random() * 6, 3 + random() * 8, 5), mat(i % 2 ? '#304632' : '#3b5038'), Math.cos(a) * r, -4, Math.sin(a) * r); hill.rotation.y = random() * 5; hill.castShadow = false; }
    const outline = new T.Shape(); outline.moveTo(-1.02, 0);
    for (let i = 0; i <= 24; i++) { const a = Math.PI - i / 24 * Math.PI; outline.lineTo(Math.cos(a) * 1.02, Math.sin(a) * 1.02); }
    outline.lineTo(.66, 0);
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI; outline.lineTo(Math.cos(a) * .66, Math.sin(a) * .66); }
    outline.closePath(); const archGeometry = new T.ExtrudeGeometry(outline, { depth: .48, bevelEnabled: false, steps: 1 });
    for (let i = 0; i < 4; i++) { const x = -5.2 + i * 2.05; edge(box(.42, 1.5 + (i === 3 ? .6 : 0), .62, stone, x, .75, -3.2)); box(.6, .16, .78, paving, x, .1, -3.2); if (i < 3) { edge(mesh(archGeometry, stone, x + 1.025, 1.45, -3.44)); box(2.08, .2, .72, paving, x + 1.025, 2.55, -3.2); } }
    box(.5, 3.1, .5, dark, -5.1, 1.55, -4); box(.6, 3.8, .6, dark, -4, 1.9, -4.7);
    const tree = new T.Group(); tree.scale.setScalar(.85); tree.position.set(.4, 0, -.3); scene.add(tree);
    function branch(a, b, radius) { const start = new T.Vector3(...a), end = new T.Vector3(...b), delta = end.clone().sub(start); const m = mesh(new T.CylinderGeometry(radius * .38, radius, delta.length(), 6), gold, 0, 0, 0, tree); m.position.copy(start.clone().add(end).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize()); }
    branch([3.6, 0, -4.6], [3, 4, -4.6], .34); branch([3, 4, -4.6], [3.5, 6.9, -4.7], .16);
    for (let i = 0; i < 21; i++) { const a = i * 2.4, height = 2.3 + i * .18, length = 1.1 + random() * 1.6, start = [3.3 - height * .03, height, -4.6], end = [start[0] + Math.cos(a) * length, height + .9 + random(), start[2] + Math.sin(a) * length * .7]; branch(start, end, .055 + random() * .04); const leaf = mesh(new T.IcosahedronGeometry(.6 + random() * .47, 0), mat(i % 3 ? '#a89449' : '#d7c77a', { emissive: '#8a6b22', emissiveIntensity: .65 }), ...end, tree); leaf.scale.set(1.2, .34, .75); leaf.rotation.set(random(), a, random() * .5); leaf.castShadow = false; }
    const dustPoints = []; for (let i = 0; i < 100; i++) dustPoints.push((random() - .5) * 17, random() * 7 + .2, (random() - .5) * 13);
    const dustGeometry = new T.BufferGeometry(); dustGeometry.setAttribute('position', new T.Float32BufferAttribute(dustPoints, 3));
    const dust = new T.Points(dustGeometry, new T.PointsMaterial({ color: '#efce77', size: .025, transparent: true, opacity: .65 })); scene.add(dust);
    const wallGroup = new T.Group(); scene.add(wallGroup); edge(box(.6, 3.3, 2.7, stone, 2.85, 1.65, 1.1, wallGroup), wallGroup, '#ddca89');
    for (let i = 1; i < 5; i++) box(.63, .018, 2.72, dark, 2.85, i * .6, 1.1, wallGroup);
    const gap = new T.Group(); scene.add(gap); box(2.5, .04, 3.6, mat('#18231d'), 0, .05, 1.1, gap); box(.08, .05, 3.6, gold, -1.3, .08, 1.1, gap); box(.08, .05, 3.6, gold, 1.3, .08, 1.1, gap);
    const platform = new T.Group(); scene.add(platform); platform.position.set(.3, .1, 1.1); const platformBody = box(2.2, .2, 1.9, paving, 0, 0, 0, platform); edge(platformBody, platform, '#ebd79b');
    const rails = new T.Group(); scene.add(rails); for (let i = 0; i < 4; i++) box(.05, 4, .05, dark, .3 + (i % 2 ? 1 : -1), 1.9, 1.1 + (i < 2 ? -.8 : .8), rails);
    const avatar = new T.Group(), spin = new T.Group(); scene.add(avatar); avatar.add(spin);
    const red = mat('#d94d37'), blue = mat('#42688b'), skin = mat('#edbb83'), white = mat('#e5e1cf'), boot = mat('#50392a');
    box(.48, .55, .49, red, 0, .84, 0, spin); box(.51, .3, .5, blue, .01, .64, 0, spin);
    for (const z of [-.15, .15]) { box(.06, .38, .075, blue, .26, .9, z, spin); mesh(new T.SphereGeometry(.035, 6, 5), gold, .3, .92, z, spin); }
    const head = mesh(new T.SphereGeometry(.29, 10, 8), skin, .035, 1.35, 0, spin); head.scale.set(.95, 1, .95);
    mesh(new T.SphereGeometry(.12, 8, 6), skin, .3, 1.34, 0, spin); const hat = mesh(new T.SphereGeometry(.31, 10, 6), red, 0, 1.54, 0, spin); hat.scale.y = .48; box(.36, .045, .54, red, .21, 1.48, 0, spin);
    for (const z of [-.15, .15]) mesh(new T.SphereGeometry(.034, 6, 5), mat('#202a25'), .265, 1.415, z, spin);
    const arms = [], legs = [];
    for (const side of [-1, 1]) { const arm = new T.Group(); arm.position.set(0, 1.02, side * .36); spin.add(arm); box(.21, .35, .22, red, 0, -.12, 0, arm); mesh(new T.SphereGeometry(.13, 8, 6), white, .015, -.34, 0, arm); arms.push(arm); const leg = new T.Group(); leg.position.set(0, .51, side * .16); spin.add(leg); box(.21, .33, .22, blue, 0, -.16, 0, leg); box(.34, .15, .25, boot, .07, -.42, 0, leg); legs.push(leg); }
    const shadow = mesh(new T.CircleGeometry(.43, 24), new T.MeshBasicMaterial({ color: '#10190c', transparent: true, opacity: .32, depthWrite: false }), 0, .045, 0); shadow.rotation.x = -Math.PI / 2;
    const shock = mesh(new T.RingGeometry(.65, .73, 48), new T.MeshBasicMaterial({ color: '#eed18b', transparent: true, opacity: .7, side: T.DoubleSide, depthWrite: false }), -.5, .08, 1.1); shock.rotation.x = -Math.PI / 2;
    let trail;
    function setAction(name) { wallGroup.visible = name === 'wall'; gap.visible = name === 'long'; platform.visible = rails.visible = name === 'platform'; if (trail) { scene.remove(trail); trail.geometry.dispose(); trail.material.dispose(); } const points = []; for (let i = 0; i <= 150; i++) { const p = model.movement(name, i / 150); points.push(new T.Vector3(p.x, p.y + .12, p.z)); } trail = new T.Line(new T.BufferGeometry().setFromPoints(points), new T.LineDashedMaterial({ color: '#ddc282', dashSize: .12, gapSize: .095, transparent: true, opacity: .6 })); trail.computeLineDistances(); scene.add(trail); }
    let wasMobile = host.clientWidth < 700;
    function resize() { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); const mobile = w < 700; if (mobile !== wasMobile) { resetCamera(); wasMobile = mobile; } }
    new ResizeObserver(resize).observe(host); resize(); setAction(state.action);
    renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); $('webgl-fallback').hidden = false; });
    renderer.domElement.addEventListener('webglcontextrestored', () => { $('webgl-fallback').hidden = true; });
    return { setAction, resetCamera, setWire(value) { wires.visible = value; }, render(progress, seconds) { const p = model.movement(state.action, progress); avatar.position.set(p.x, p.y + .04, p.z); avatar.rotation.y = p.facing < 0 ? Math.PI : 0; spin.rotation.z = -p.flip; const stride = Math.sin(seconds * 9) * (p.y > .1 ? .35 : .16); arms[0].rotation.z = stride; arms[1].rotation.z = -stride; legs[0].rotation.z = -stride; legs[1].rotation.z = stride; if (state.action === 'pound' && progress > .58 && progress < .77) legs[0].rotation.z = legs[1].rotation.z = -.7; shadow.position.x = p.x; shadow.position.z = p.z; shadow.scale.setScalar(1 + p.y * .14); shadow.material.opacity = .36 / (1 + p.y * .3); platform.position.y = p.platformY + .1; const impact = (progress - .77) / .23; shock.visible = state.action === 'pound' && impact >= 0; shock.scale.setScalar(1 + Math.max(0, impact) * 2.3); shock.material.opacity = Math.max(0, .65 * (1 - impact)); dust.rotation.y = seconds * .005; controls.update(); renderer.render(scene, camera); } };
  }
  try { stage = createStage(); } catch (error) { $('webgl-fallback').hidden = false; $('collision-toggle').disabled = $('camera-reset').disabled = true; console.warn('3D illustration unavailable:', error.message); }
  function updatePlay() { $('play-toggle').textContent = state.playing ? 'Ⅱ' : '▶'; $('play-toggle').setAttribute('aria-label', state.playing ? '暂停演示' : '播放演示'); }
  function frame() { const duration = model.actions[state.action].duration, progress = state.seconds / duration; $('timeline').value = String(Math.round(progress * 1000)); $('time-readout').textContent = state.seconds.toFixed(1) + ' / ' + duration.toFixed(1) + ' s'; $('phase').textContent = model.movement(state.action, progress).phase; if (stage) stage.render(progress, state.seconds); }
  function selectAction(name) { if (!model.actions[name]) return; state.action = name; state.seconds = 0; const a = model.actions[name]; $('action-en').textContent = a.en; $('lab-title').textContent = a.name; $('action-hint').textContent = a.hint; $('action-description').textContent = a.description; $('action-focus').textContent = a.focus; $('action-source').href = upstream + a.source; document.querySelectorAll('[data-action]').forEach(button => { const active = button.dataset.action === name; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); }); if (stage) stage.setAction(name); frame(); }
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => selectAction(button.dataset.action)));
  $('play-toggle').addEventListener('click', () => { state.playing = !state.playing; updatePlay(); });
  $('replay').addEventListener('click', () => { state.seconds = 0; state.playing = true; updatePlay(); frame(); });
  $('timeline').addEventListener('input', event => { state.seconds = Number(event.target.value) / 1000 * model.actions[state.action].duration; state.playing = false; updatePlay(); frame(); });
  $('speed').addEventListener('change', event => { state.speed = Number(event.target.value); });
  $('collision-toggle').addEventListener('click', () => { state.wire = !state.wire; $('collision-toggle').setAttribute('aria-pressed', String(state.wire)); if (stage) stage.setWire(state.wire); });
  $('camera-reset').addEventListener('click', () => { if (stage) stage.resetCamera(); });
  document.addEventListener('keydown', event => { if (event.target.closest('input,select,textarea,button,a,summary') || event.altKey || event.ctrlKey || event.metaKey || !state.visible) return; if (event.code === 'Space') { event.preventDefault(); state.playing = !state.playing; updatePlay(); } if (event.key.toLowerCase() === 'r') { state.seconds = 0; state.playing = true; updatePlay(); frame(); } if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); const names = Object.keys(model.actions), index = names.indexOf(state.action); selectAction(names[(index + (event.key === 'ArrowRight' ? 1 : -1) + names.length) % names.length]); } });
  new IntersectionObserver(entries => { state.visible = entries[0].isIntersecting; }, { threshold: .05 }).observe($('stage'));
  let last = performance.now(); function animate(now) { const dt = Math.min((now - last) / 1000, .06); last = now; if (state.visible && !document.hidden) { if (state.playing) state.seconds = (state.seconds + dt * state.speed) % model.actions[state.action].duration; frame(); } requestAnimationFrame(animate); } updatePlay(); frame(); requestAnimationFrame(animate);

  const steps = [
    { kicker: '01 / LOAD & PREPARE', title: '先把资源准备好，再进入世界。', description: 'me3 将 Rust DLL 加载到游戏中。首次启动从玩家自己的美版 SM64 ROM 提取资源，并在本机生成模型、纹理与菜单图标；重启后加载生成文件。', source: 'src/assets/mod.rs', dataTitle: 'RESOURCE ADAPTER', data: '玩家的 SM64 ROM\n        ↓ 本机提取与构建\n模型 · 纹理 · 声音 · 动画\n        ↓ 重启后加载\n     法环可识别的资源', note: '素材由玩家提供；本研究页不包含游戏资源。' },
    { kicker: '02 / READ THE WORLD', title: '让马里奥认得脚下的地面。', description: '读取法环实时 Havok 碰撞，提取附近三角形，转换尺度与坐标方向，再交给 libsm64。移动平台成为动态表面对象；射线查询还会辅助确认和修补地面。', source: 'src/havok_col.rs', dataTitle: 'COLLISION ADAPTER', data: '法环 Havok 碰撞三角形\n        ↓ 邻域查询 / 解码\n坐标转换 · X 轴镜像\n        ↓ SM64Surface\n  地板 · 墙面 · 移动平台', note: '源码使用 0.01 米 / SM64 单位；上方轨迹没有使用游戏实测尺度。' },
    { kicker: '03 / RUN MARIO', title: '一次输入，进入熟悉的动作状态。', description: '手柄与键鼠输入送入 libsm64，运动和动画按每秒 30 次更新。跳跃、蹬墙、着地等状态决定下一步动作，显示位置通过插值平滑。', source: 'src/lib.rs#L2292-L2295', dataTitle: 'MOVEMENT & STATE', data: '手柄 / 键鼠输入\n        ↓ 每秒 30 次\nlibsm64 动作与运动更新\n        ↓\n位置 · 姿态 · 交互状态', note: '30 Hz 指马里奥逻辑更新频率，不代表法环渲染帧率或本页帧率。' },
    { kicker: '04 / RETURN TO ELDEN RING', title: '动作的结果，交还给法环。', description: '把位置同步给底层主角，把 SM64 的部件姿态写入角色骨骼，由法环自身渲染。拳脚命中转换为伤害，再借游戏攻击触发受击与击杀；特殊事件中切换控制权。', source: 'src/engine_mario.rs', dataTitle: 'HOST GAME ADAPTER', data: '位置 → 褪色者物理位置\n姿态 → 角色骨骼与渲染\n命中 → 扣血 + 原生攻击\n事件 → 门 / 赐福 / 死亡\n          / 独立存档', note: '适配依赖宿主游戏内部结构，迁移到其他游戏需要重新实现接口。' }
  ];
  document.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => { const step = steps[Number(button.dataset.step)]; document.querySelectorAll('[data-step]').forEach(item => { item.classList.toggle('selected', item === button); item.setAttribute('aria-pressed', String(item === button)); }); for (const [id, key] of [['step-kicker','kicker'],['step-title','title'],['step-description','description'],['data-title','dataTitle'],['step-data','data'],['step-note','note']]) $(id).textContent = step[key]; $('step-source').href = upstream + step.source; $('step-source').textContent = step.source.split('#')[0] + ' ↗'; }));
  $('step-data').textContent = steps[0].data;
  let health = 1000, hits = 0; const format = n => n.toLocaleString('en-US');
  function combatState() { const boss = $('enemy').value === 'boss'; return { boss, max: boss ? 10000 : 1000, move: $('attack').value }; }
  function renderCombat() { const { boss, max, move } = combatState(), hit = model.damage(max, boss, move); $('enemy-name').textContent = boss ? 'Boss' : '普通敌人'; $('enemy-hp').textContent = format(health) + ' / ' + format(max) + ' HP'; $('hp-fill').style.width = health / max * 100 + '%'; $('damage-value').replaceChildren(document.createTextNode(format(hit.amount) + ' '), Object.assign(document.createElement('em'), { textContent: 'HP' })); $('damage-percent').replaceChildren(document.createTextNode(Number(hit.percent.toFixed(3)).toString()), Object.assign(document.createElement('em'), { textContent: '%' })); $('hit-counter').textContent = hits + ' 次出招'; $('damage-formula').textContent = boss ? format(max) + ' × ' + model.attacks[move].percent + '% × 0.05 × ' + hit.bonus + ' = ' + format(hit.amount) + ' HP（向上取整）' : format(max) + ' × ' + model.attacks[move].percent + '% = ' + format(hit.amount) + ' HP'; $('attack-button').disabled = health === 1; }
  function resetCombat() { health = combatState().max; hits = 0; $('combat-message').textContent = '点击出招，观察血条变化。'; renderCombat(); }
  $('enemy').addEventListener('change', resetCombat); $('attack').addEventListener('change', resetCombat); $('combat-reset').addEventListener('click', resetCombat);
  $('attack-button').addEventListener('click', () => { const { max, boss, move } = combatState(), before = health; health = model.applyShare(health, max, boss, move); hits++; $('combat-message').textContent = health === 1 ? '比例扣血保留 1 HP → 接下来由法环原生攻击完成击杀。' : '比例阶段扣除 ' + format(before - health) + ' HP。原生攻击的附加结算未计入本实验。'; renderCombat(); }); renderCombat();
})();
