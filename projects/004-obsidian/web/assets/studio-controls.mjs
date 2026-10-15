import { SHAPES, settings } from './extension-shapes.mjs';
import { SOUND_SCENES } from './sound-score.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const frame = $('#original'), stageButtons = $$('[data-story]'), modeButtons = $$('[data-mode]');
const profiles = Object.fromEntries(Object.keys(SHAPES).map(form => [form, settings(form)]));
const descriptions = {
  galaxy: '有厚度的螺旋盘面。调节旋臂与聚合程度，观察真正的立体碎片如何组织。',
  tornado: '上宽下窄的三维漏斗，各高度以不同角速度旋转。',
  dna: '两条管状螺旋与横向连接，支持圈数和半径调节。',
  text: '从文字正反面与边缘采样，形成可以绕到侧面观察的立体字形。',
};
let mounted = false, ready = false, playing = false, mode = 'original', queuedMode = 'tour', pendingQuality = null;
let exporting = false, canExport = false, resultURL;
let soundOn = false;
let readyTimer, parameterTimer, parameterQueue = {};
function command(action, values = {}) {
  if (ready) frame.contentWindow.postMessage({ type: 'obsidian:control', action, ...values }, location.origin);
}
function valueLabel(key, value) {
  if (key === 'assembly') return Math.round(value * 100) + '%';
  if (key === 'size') return Number(value).toFixed(2).replace(/0+$/, '').replace(/\.$/, '') + '×';
  return String(Number(Number(value).toFixed(2)));
}
function syncPanel(params) {
  if (!SHAPES[mode]) return;
  const spec = SHAPES[mode]; $('#shape-title').textContent = spec.name; $('#shape-description').textContent = descriptions[mode];
  for (const key of ['a', 'b']) {
    const [min, max, step, , label] = spec[key], input = $('#shape-' + key);
    input.min = min; input.max = max; input.step = step; $('#label-' + key).textContent = label;
  }
  $$('[data-param]').forEach(input => {
    const key = input.dataset.param;
    if (document.activeElement !== input) input.value = params[key];
    $('#value-' + key).textContent = valueLabel(key, Number(input.value));
  });
  $('#text-option').hidden = mode !== 'text';
  if (document.activeElement !== $('#custom-text')) $('#custom-text').value = params.text;
}
function setMode(next, params) {
  mode = next; const extension = !!SHAPES[mode], tour = mode === 'tour';
  $('#studio').classList.toggle('is-extension', extension); $('#parameters').hidden = !extension;
  $('#original-stages').hidden = extension || tour; $('#capture-link').hidden = extension || tour;
  $('#film-timeline').hidden = !tour;
  $('#mode-badge').textContent = tour ? '48 秒完整动画 · 自动循环' : extension ? '原作碎片系统 · GPU 三维扩展' : '上游原作 · 本地复现';
  $('#mode-hint').textContent = tour ? '可切换到单形态调节参数，再播放完整循环或导出。' : extension ? '拖动参数调整形态；开启自由视角后可旋转、缩放和平移。' : '选择一个原作形态即可暂停观察；画面底部可拖进度、切速度、开启声音。';
  modeButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  $('#standalone').href = 'vendor/obsidian/index.html' + (tour ? '?tier=low&tour' : extension ? '?tier=low&shape=' + mode : '');
  if (extension) { profiles[mode] = settings(mode, params || profiles[mode]); syncPanel(profiles[mode]); }
}
function activate(next, scroll = false) {
  if (exporting) return;
  clearTimeout(parameterTimer); parameterQueue = {};
  if (!ready) { queuedMode = next; mount(); }
  else if (next === 'tour') { $('#player-status').textContent = '正在准备完整动画…'; command('tour', { profiles }); }
  else if (next === 'original') command('original');
  else { $('#player-status').textContent = '正在构建 ' + SHAPES[next].name + ' 的三维目标…'; command('shape', { form: next, params: profiles[next] }); }
  if (scroll) $('#demo').scrollIntoView({ block: 'start' });
}
function mount() {
  if (mounted) return;
  mounted = true; ready = false; $('#player-cover').hidden = true; frame.hidden = false; $('#stop').hidden = false;
  $('#player-status').textContent = '正在生成碎片、编译材质…首次启动需要一些时间';
  $('#export-support').textContent = '正在检查此浏览器的声音与视频编码支持…';
  frame.src = 'vendor/obsidian/index.html?tier=low';
  readyTimer = setTimeout(() => { if (!ready && mounted) $('#player-status').textContent = '演示尚未就绪。可独立打开查看图形支持提示，或关闭后重试。'; }, 60000);
}
function unmount() {
  if (exporting) return;
  clearTimeout(readyTimer); clearTimeout(parameterTimer); parameterQueue = {}; queuedMode = pendingQuality = null;
  mounted = ready = playing = false; frame.removeAttribute('src'); frame.hidden = true;
  $('#player-cover').hidden = false; $('#stop').hidden = true;
  [$('#play'), $('#orbit'), $('#quality'), $('#film-seek'), $('#export-film'), $('#sound'), $('#sound-volume'), ...modeButtons, ...stageButtons].forEach(el => { el.disabled = true; });
  stageButtons.forEach(button => button.classList.remove('active'));
  $('#orbit').setAttribute('aria-pressed', 'false'); setMode('original');
  $('#player-status').textContent = '演示已关闭，点击画面可重新启动'; $('#render-meta').textContent = '实际碎片数随画质与生成结果变化。';
}
window.addEventListener('message', event => {
  if (!mounted || event.source !== frame.contentWindow || event.origin !== location.origin || !event.data) return;
  const state = event.data;
  if (state.type === 'obsidian:export') { updateExport(state); return; }
  if (state.type === 'obsidian:error') {
    pendingQuality = null; $('#quality').disabled = exporting; $('#player-status').textContent = '操作未完成：' + state.message;
    if (state.action === 'export') { $('#export-status').textContent = '导出未完成：' + state.message; $('#export-film').disabled = !canExport; }
    return;
  }
  if (state.type !== 'obsidian:status' || !state.ready) return;
  soundOn = state.soundOn;
  if (document.activeElement !== $('#sound-volume')) {
    $('#sound-volume').value = state.volume; $('#sound-value').textContent = Math.round(state.volume * 100) + '%';
  }
  $('#sound').textContent = soundOn ? '关闭声音 ♪' : '开启声音 ♪'; $('#sound').setAttribute('aria-pressed', String(soundOn));
  $('#sound').disabled = exporting; $('#sound-volume').disabled = exporting;
  $('#sound-status').textContent = state.soundBusy ? '正在合成完整声轨…' : soundOn ? (state.playing ? (state.soundActive ? '声音随时间线同步播放' : '声音已开启，正在同步…') : '已暂停 · 继续播放后恢复声音') : '点击开启试听 · 导出声音可单独选择';
  const soundScene = state.mode === 'tour' ? SOUND_SCENES[state.tourIndex] : SOUND_SCENES.find(s => s.form === state.mode);
  $('#sound-scene').textContent = soundScene?.label || SOUND_SCENES[0].label;
  if (state.mediaSupport) {
    const c = state.mediaSupport;
    $('#export-support').textContent = `此浏览器：MP4 ${c.mp4Video && c.mp4Audio ? '声画编码可用' : c.mp4Video ? '视频可用，AAC 声音暂不支持' : '暂不支持'} · WebM ${c.webmVideo && c.webmAudio ? '声画编码可用' : '部分编码暂不支持'}`;
  }
  canExport = state.canExport;
  $('#export-film').disabled = exporting || !canExport || !!pendingQuality;
  if (!canExport) $('#export-status').textContent = '此浏览器没有视频编码能力。请使用新版 Chrome / Edge，在 localhost 或 HTTPS 页面打开后导出。';
  if (!ready) {
    ready = true; clearTimeout(readyTimer);
    [$('#play'), $('#orbit'), $('#quality'), ...modeButtons, ...stageButtons].forEach(el => { el.disabled = false; });
    $('#player-status').textContent = '三维碎片已就绪 · 可切换原作与四种扩展形态';
    if (queuedMode) { const desired = queuedMode; queuedMode = null; activate(desired); }
  }
  if (state.mode !== mode || ['shape', 'parameters', 'reassemble'].includes(state.action)) setMode(state.mode, state.params);
  playing = state.playing; $('#play').textContent = playing ? '暂停' : '继续播放'; $('#orbit').setAttribute('aria-pressed', String(state.orbit));
  if (pendingQuality && (state.tier === pendingQuality || state.action === 'quality')) {
    pendingQuality = null; $('#quality').disabled = false; $('#player-status').textContent = '画质已切换，实际碎片数量同步更新';
  }
  if (!pendingQuality) $('#quality').value = state.tier;
  if (mode === 'tour') {
    $('#film-chapter').textContent = state.chapter;
    $('#film-time').textContent = `${state.tourTime.toFixed(1).padStart(4, '0')} / 48.0 s`;
    if (document.activeElement !== $('#film-seek')) $('#film-seek').value = state.tourTime;
    $('#film-seek').disabled = exporting;
    $$('[data-tour-time]').forEach((b, i) => b.setAttribute('aria-pressed', String(i === state.tourIndex)));
    $('#render-meta').textContent = `${Number(state.count).toLocaleString('zh-CN')} 块立体碎片 · ${state.chapter} · 自动循环。`;
    if (state.action === 'tour') $('#player-status').textContent = '完整动画已开始 · 原作 → 星系 → 龙卷 → 双螺旋 → 文字 → 巨石';
  } else if (mode === 'original') {
    $('#render-meta').textContent = `${Number(state.count).toLocaleString('zh-CN')} 块实际碎片 · ${state.time.toFixed(1)} / ${state.duration} 秒。`;
    const phase = state.story < 6 ? 0 : state.story < 12.45 ? 1 : state.story < 19.6 ? 2 : state.story < 29 ? 3 : 4;
    stageButtons.forEach((button, i) => { button.classList.toggle('active', i === phase); button.setAttribute('aria-pressed', String(i === phase)); });
  } else {
    $('#render-meta').textContent = `${Number(state.count).toLocaleString('zh-CN')} 块立体碎片 · ${state.extensionTime.toFixed(1)} 秒 · ${SHAPES[mode].name}。`;
    $('#pipeline-state').textContent = `${Number(state.targets).toLocaleString('zh-CN')} 个三维目标 · ${Number(state.vertices).toLocaleString('zh-CN')} 个网格顶点 · ${state.stateTextures} 张状态纹理`;
    if (state.action === 'shape') $('#player-status').textContent = '已接入原作三维碎片：' + SHAPES[mode].name;
  }
});
$('#start').addEventListener('click', mount); $('#stop').addEventListener('click', unmount);
$('#play').addEventListener('click', () => command('play', { value: !playing }));
$('#orbit').addEventListener('click', () => command('orbit'));
$('#quality').addEventListener('change', event => {
  pendingQuality = event.target.value; $('#quality').disabled = true; $('#player-status').textContent = '正在生成所选画质的碎片与目标…'; command('quality', { value: pendingQuality });
});
modeButtons.forEach(button => button.addEventListener('click', () => activate(button.dataset.mode)));
$$('[data-activate]').forEach(button => button.addEventListener('click', () => activate(button.dataset.activate, true)));
stageButtons.forEach(button => button.addEventListener('click', () => { command('seek', { story: Number(button.dataset.story) }); $('#player-status').textContent = '定格观察：' + button.querySelector('strong').textContent; }));
function flushParameters() {
  clearTimeout(parameterTimer); const patch = parameterQueue; parameterQueue = {};
  if (SHAPES[mode] && Object.keys(patch).length) command('parameters', { params: patch });
}
$$('[data-param]').forEach(input => {
  input.addEventListener('input', () => {
    if (!SHAPES[mode]) return;
    const key = input.dataset.param, value = Number(input.value); profiles[mode][key] = value;
    $('#value-' + key).textContent = valueLabel(key, value);
    if (key === 'a' || key === 'b') { parameterQueue[key] = value; clearTimeout(parameterTimer); parameterTimer = setTimeout(flushParameters, 110); }
    else command('parameters', { params: { [key]: value } });
  });
  input.addEventListener('change', flushParameters);
});
$('#custom-text').addEventListener('input', () => {
  if (mode !== 'text') return; profiles.text.text = $('#custom-text').value;
  parameterQueue.text = profiles.text.text; clearTimeout(parameterTimer); parameterTimer = setTimeout(flushParameters, 300);
});
$('#custom-text').addEventListener('keydown', event => { if (event.key === 'Enter') flushParameters(); });
$('#apply-text').addEventListener('click', flushParameters);
$('#reassemble').addEventListener('click', () => command('reassemble'));
$('#reset-view').addEventListener('click', () => command('resetView'));
$('#reset-params').addEventListener('click', () => { if (SHAPES[mode]) { profiles[mode] = settings(mode); syncPanel(profiles[mode]); activate(mode); } });
$('#film-seek').addEventListener('input', event => command('tourSeek', { time: Number(event.target.value) }));
$$('[data-tour-time]').forEach(b => b.addEventListener('click', () => command('tourSeek', { time: Number(b.dataset.tourTime) })));
function updateExport(state) {
  if (state.status === 'start' || state.status === 'idle') {
    exporting = state.status === 'start';
    [$('#play'), $('#orbit'), $('#quality'), $('#stop'), $('#film-seek'), $('#sound'), $('#sound-volume'), ...modeButtons, ...stageButtons, ...$$('[data-tour-time]'), ...$$('#parameters input, #parameters button'), ...$$('.export-options select, .export-options input')].forEach(el => { el.disabled = exporting; });
    $('#export-film').disabled = exporting || !canExport; $('#cancel-export').hidden = !exporting;
    $('#export-progress').hidden = !exporting;
    if (exporting) { $('#export-meter').value = 0; $('#export-progress-text').textContent = '准备声画生成…'; $('#export-status').textContent = `正在生成${state.withAudio ? '带声音' : '无声'} ${state.format.toUpperCase()} 视频。可取消，完成后恢复预览与声音。`; }
  } else if (state.status === 'stage') {
    $('#export-progress-text').textContent = state.stage;
  } else if (state.status === 'progress') {
    $('#export-meter').value = state.frame / state.frames;
    $('#export-progress-text').textContent = `${Math.round(state.frame / state.frames * 100)}% · ${state.frame} / ${state.frames} 帧 · ${state.time.toFixed(1)} / 48 s`;
  } else if (state.status === 'cancelled') $('#export-status').textContent = '已取消导出，预览已恢复。';
  else if (state.status === 'done') {
    if (resultURL) URL.revokeObjectURL(resultURL);
    resultURL = URL.createObjectURL(state.blob);
    $('#export-preview').src = resultURL;
    const link = $('#download-film'); link.href = resultURL; link.download = state.filename;
    $('#export-result').hidden = false;
    $('#export-result-meta').textContent = `${state.duration} 秒 · ${state.size.replace('x', ' × ')} · ${state.fps} fps · ${state.frames} 帧 · ${(state.bytes / 1048576).toFixed(1)} MB · ${state.format === 'mp4' ? 'H.264 / MP4' : 'VP9 / WebM'} · ${state.audioCodec ? state.audioCodec.toUpperCase() + ' 立体声 · 音量 ' + Math.round(state.volume * 100) + '%' : '无声'}`;
    $('#export-status').textContent = '完整视频已生成，可预览或再次下载。'; link.click();
  }
}
$('#export-film').addEventListener('click', () => {
  if (exporting) return;
  $('#export-film').disabled = true;
  clearTimeout(parameterTimer); parameterQueue = {};
  command('export', { profiles, size: $('#export-size').value, fps: Number($('#export-fps').value), format: $('#export-format').value, withAudio: $('#export-audio').checked });
});
$('#sound').addEventListener('click', () => { $('#sound-status').textContent = '正在准备声音…'; command('sound', { value: !soundOn }); });
$('#sound-volume').addEventListener('input', event => {
  const value = Number(event.target.value); $('#sound-value').textContent = Math.round(value * 100) + '%'; command('volume', { value });
});
$('#cancel-export').addEventListener('click', () => { command('cancelExport'); $('#export-progress-text').textContent = '正在取消…'; });
$('#export-preview').addEventListener('play', () => command('play', { value: false }));
document.addEventListener('visibilitychange', () => { if (document.hidden && !exporting) command('play', { value: false }); });
const readingOverview = ['', '#understanding', '#understanding-text'].includes(location.hash);
if (!reduced && !readingOverview) mount();
else {
  $('#player-status').textContent = reduced ? '已遵循减少动态效果设置，点击启动后观看' : '可先阅读研究总览，点击画面后启动动画';
  $('#export-support').textContent = '启动动画后检查此浏览器的声音与视频编码支持。';
}
