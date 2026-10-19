import {matchAllWelfare, evaluateJobs, replayRisk} from './assets/lab.mjs';

const $ = id => document.getElementById(id);
const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const source = 'https://github.com/can4hou6joeng4/boss-agent-cli/blob/7f46ba37c654d5f7675bb1328158030d7604847c/';
const roles = {
  candidate: [
    ['01 / DISCOVER', '发现与筛选岗位', '关键词、城市、薪资等条件，叠加福利与 HR 活跃度筛选；条件不足时可能补查详情。', 'boss search "Python" --city 杭州'],
    ['02 / ORGANIZE', '把岗位变成候选池', '保存岗位、打标签、记备注、离线对比，结合本地记录查看进度与统计。', 'boss shortlist compare'],
    ['03 / ASSIST', '分析、准备与沟通', '可选模型分析简历与 JD，辅助面试准备；另有打招呼、立即沟通等平台动作。', 'boss ai analyze-jd --help'],
  ],
  recruiter: [
    ['01 / FIND', '发现候选人', '候选人搜索与推荐，读取候选卡片；需要招聘者账号和平台允许的权限。', 'boss hr candidates "Python"'],
    ['02 / COMMUNICATE', '简历与沟通管理', '读取简历、聊天记录、最近消息，请求和接收附件简历，回复候选人。', 'boss hr applications'],
    ['03 / OPERATE', '管理招聘职位', '查询职位列表，管理职位上下线。功能存在不代表任意账号都可执行。', 'boss hr jobs list'],
  ],
  agent: [
    ['01 / DISCOVER', '让工具描述自己', 'schema 给出参数与能力支持状态；也可导出工具定义，帮助宿主按结构调用。', 'boss schema'],
    ['02 / INVOKE', '多种接入，同一业务', 'CLI 子进程、Python API 或 MCP 调用同一业务层；MCP 本身不赋予平台权限。', 'boss-mcp --help'],
    ['03 / RESUME', '跨步骤继续工作', '统一 JSON 与恢复提示，run ID、SQLite 断点和预算支持查询、恢复与停止。', 'boss wizard --help'],
  ],
};
const steps = [
  {title:'01 / 复用用户正常登录后的会话',text:'AuthManager 管理登录状态。Cookie 与页面生成的 __zp_stoken__ 影响可用性；有些流程还依赖浏览器运行环境。',code:'Cookie + __zp_stoken__',boundary:'有效凭据只是访问条件；账号权限与服务端风控仍然参与判断。',path:'src/boss_agent_cli/auth/manager.py'},
  {title:'02 / 平台接口与浏览器环境配合',text:'适用请求使用 httpx；搜索等操作走浏览器通道，通过 CDP / Patchright 在网页中执行 fetch。一般不需逐次识图点击。',code:'httpx ↔ page.evaluate(fetch)',boundary:'浏览器兼容性不能保证平台接受自动化请求，两个通道也不保证同时可用。',path:'src/boss_agent_cli/api/browser_client.py#L78'},
  {title:'03 / 先处理数据，再组织业务',text:'列表字段先做过滤，福利不足时补查详情。词表检查子串，多项条件之间 AND；SQLite 保存缓存、候选池与任务状态。',code:'标签 → 描述 → AND → 本地状态',boundary:'词表不理解否定和实际兑现。“不提供双休”也可能被当作命中。',path:'src/boss_agent_cli/search_filters.py#L534'},
  {title:'04 / 需要时再接入大模型',text:'简历与 JD 进入提示词，由配置的模型分析、润色或给出建议。支持兼容接口与本地模型服务；搜索和规则筛选本身不需要模型。',code:'简历 + JD → 提示词 → 模型服务',boundary:'质量取决于模型与输入。模型分数和本地规则分数都不是录用概率。',path:'src/boss_agent_cli/ai/service.py'},
  {title:'05 / 让人和 Agent 都能继续调用',text:'CLI / MCP / Python API 使用统一数据结构。JSON 带上分页、错误与下一步提示；需要跨步骤的任务保存 run ID 与断点。',code:'{ ok, data, pagination, error, hints }',boundary:'保存断点有助于恢复业务，但不能自动解除平台的账号或环境限制。',path:'docs/commands.md'},
];

function setupTabs(id, callback) {
  const buttons = [...$(id).querySelectorAll('[role="tab"]')];
  function select(button, focus = false) {
    for (const item of buttons) {
      const selected = item === button;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    }
    callback(button);
    if (focus) button.focus();
  }
  for (const button of buttons) {
    button.addEventListener('click', () => select(button));
    button.addEventListener('keydown', event => {
      const index = buttons.indexOf(button);
      const next = {ArrowRight:(index + 1) % buttons.length, ArrowLeft:(index + buttons.length - 1) % buttons.length, Home:0, End:buttons.length - 1}[event.key];
      if (next !== undefined) { event.preventDefault(); select(buttons[next], true); }
    });
  }
  select(buttons[0]);
}
setupTabs('role-tabs', button => {
  $('role-panel').setAttribute('aria-labelledby', button.id);
  $('role-panel').innerHTML = roles[button.dataset.role].map(([label,title,text,command]) => `<article class="cap-card"><span>${label}<b aria-hidden="true">↗</b></span><h3>${title}</h3><p>${text}</p><code>${escape(command)}</code></article>`).join('');
});
setupTabs('step-tabs', button => {
  const step = steps[Number(button.dataset.step)];
  $('step-panel').setAttribute('aria-labelledby', button.id);
  $('step-panel').innerHTML = `<div><h3>${step.title}</h3><p>${step.text}</p><a href="${source + step.path}" target="_blank" rel="noreferrer">核对上游实现 ↗</a></div><aside><span class="small-label">这一层的边界</span><code>${escape(step.code)}</code><p>${step.boundary}</p></aside>`;
});

let data;
let probeId = 'negation';
let riskState = {locked:false, requests:0};

function renderJobs() {
  if (!data) return;
  const city = $('city').value;
  const labels = [...$('filters').querySelectorAll('input[name="welfare"]:checked')].map(input => input.value);
  const all = evaluateJobs(data.jobs, {city, labels}, data.welfare_keywords);
  const hits = all.filter(job => job.actual);
  const falseHits = all.filter(job => job.actual && !job.annotated);
  const misses = all.filter(job => !job.actual && job.annotated);
  const shown = $('show-all').checked ? all : hits;
  $('result-count').textContent = `规则命中 ${hits.length} / ${all.length}`;
  $('result-subtitle').textContent = `${city || '不限城市'} · ${labels.length ? labels.join(' + ') : '不限福利'}`;
  $('result-summary').innerHTML = `<span>合成样本 ${all.length}</span><span class="${falseHits.length ? 'warn' : ''}">语义误命中 ${falseHits.length}</span><span class="${misses.length ? 'warn' : ''}">语义漏判 ${misses.length}</span>`;
  $('jobs').innerHTML = shown.length ? shown.map(job => {
    const mismatch = job.actual !== job.annotated;
    const label = !job.cityMatches ? '城市不匹配' : job.actual ? (job.matches.join(' · ') || '无福利条件') : '福利条件未全部命中';
    const annotation = !job.cityMatches ? '城市排除，不纳入福利语义对照' : job.annotated ? '人工标注：符合当前条件' : '人工标注：不符合当前条件';
    return `<article class="job-card${mismatch ? ' flagged' : ''}" data-job="${escape(job.id)}"><div class="job-top"><h3>${escape(job.title)}</h3><span class="salary">${escape(job.salary)}</span></div><p class="company">${escape(job.company)} · ${escape(job.city)}</p><p class="job-desc">${escape(job.description)}</p><div class="job-tags">${job.tags.length ? job.tags.map(tag => `<span>${escape(tag)}</span>`).join('') : '<span>未提供福利标签</span>'}</div><p class="job-result${mismatch ? ' bad' : ''}">${job.actual ? '✓' : '—'} ${escape(label)}</p><p class="job-truth">${escape(annotation)}${mismatch ? ' · 与规则不一致' : ''}</p></article>`;
  }).join('') : '<div class="empty">没有命中。可放宽福利条件，或显示全部岗位检查排除原因。</div>';
  $('result-json').textContent = JSON.stringify({ok:true,data:hits.map(job => ({sample_id:job.id,title:job.title,city:job.city,welfare_match:job.matches})),demo:{synthetic:true,live_requests:0,note:'本研究简化信封，非上游真实响应'}},null,2);
}

function renderProbe() {
  if (!data) return;
  const text = $('probe-text').value;
  const matches = matchAllWelfare(['双休','五险一金'], [], text, data.welfare_keywords);
  const preset = data.probes.find(probe => probe.id === probeId && probe.text === text);
  const actual = matches.length > 0;
  const mismatch = preset && actual !== preset.expected_semantics;
  const annotation = preset ? `人工标注：${preset.expected_semantics ? '满足' : '不满足'}这两项条件${mismatch ? '，与规则结果不一致。' : '，与规则结果一致。'}` : '自由文本：人工语义未标注，请自行核对。';
  let explanation = '同义词内部任一命中，多项条件必须同时命中。';
  if (probeId === 'negation' && preset) explanation = '“不提供双休”仍含“双休”，子串规则无法识别否定。';
  if (probeId === 'synonym' && preset) explanation = '“周末休两天”不在现有词表中，语义符合也可能漏判。';
  $('probe-output').innerHTML = `<span class="small-label">上游福利规则 · 本地移植</span><strong class="probe-state ${mismatch ? 'bad' : 'good'}">${actual ? '规则判定：命中' : '规则判定：未命中'}</strong><p>${explanation}</p><div class="probe-reasons">${matches.length ? matches.map(escape).join('<br>') : '返回空匹配 []'}</div><div class="probe-annotation">${annotation}</div>`;
  for (const button of $('probe-presets').querySelectorAll('button')) {
    const selected = button.dataset.probe === probeId && Boolean(preset);
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
}

function renderRisk() {
  $('request-count').textContent = String(riskState.requests);
  $('risk-state').textContent = riskState.status || '等待回放';
  $('risk-trace').innerHTML = (riskState.trace || ['选择响应，查看请求、判断与停止的顺序。']).map(item => `<li>${escape(item)}</li>`).join('');
  $('risk-outcome').textContent = riskState.outcome || '试试环境风险 37，再连续回放两次。';
}
$('filters').addEventListener('submit', event => event.preventDefault());
$('filters').addEventListener('change', renderJobs);
$('show-all').addEventListener('change', renderJobs);
$('reset-filters').addEventListener('click', () => { $('filters').reset(); $('show-all').checked = false; renderJobs(); });
$('probe-text').addEventListener('input', () => { probeId = null; renderProbe(); });
$('probe-presets').addEventListener('click', event => {
  const button = event.target.closest('button[data-probe]');
  if (!button || !data) return;
  probeId = button.dataset.probe;
  $('probe-text').value = data.probes.find(probe => probe.id === probeId).text;
  renderProbe();
});
$('replay-risk').addEventListener('click', () => { riskState = replayRisk(riskState, $('risk-response').value); renderRisk(); });
$('restore-risk').addEventListener('click', () => {
  riskState = {...riskState,locked:false,status:'模拟本地锁不再匹配',trace:['示意用户在官方页面完成处理','演示凭据状态变化，本地锁不再匹配','尚未向平台发起新请求'],outcome:'只恢复本地判断；真实服务端仍可能拒绝后续请求。'};
  renderRisk();
});
$('reset-risk').addEventListener('click', () => { riskState = {locked:false,requests:0}; $('risk-response').value = 'success'; renderRisk(); });

try {
  const [evidence, tests] = await Promise.all(['assets/evidence.json','assets/core-tests.json'].map(async path => {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  }));
  data = evidence;
  $('test-count').textContent = String(tests.passed);
  renderJobs();
  renderProbe();
} catch (error) {
  $('load-error').hidden = false;
  $('load-error').textContent = `本地实验数据未载入：${error.message}。请通过 HTTP 服务打开构建后的页面。`;
  $('result-count').textContent = '数据加载失败';
}
