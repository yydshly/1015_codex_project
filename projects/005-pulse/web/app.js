'use strict';

// The page explains a research snapshot. It never reads local Agent files.
const guide = document.querySelector('.guide-dialog');
for (const button of document.querySelectorAll('[data-open-guide]')) {
  button.addEventListener('click', () => {
    guide.showModal();
    document.documentElement.classList.add('modal-open');
  });
}
document.querySelector('[data-close-guide]').addEventListener('click', () => guide.close());
guide.addEventListener('close', () => document.documentElement.classList.remove('modal-open'));

const search = document.querySelector('#source-search');
const filterButtons = [...document.querySelectorAll('[data-filter]')];
const groups = [...document.querySelectorAll('[data-source-group]')];
const sourceRows = [...document.querySelectorAll('[data-source-row]')];
let activeFilter = 'all';

function filterSources() {
  const query = search.value.trim().toLocaleLowerCase();
  const narrowing = query.length > 0 || activeFilter !== 'all';
  let visibleCount = 0;
  for (const row of sourceRows) {
    const evidenceMatches = activeFilter === 'all'
      || (activeFilter === 'no-token' ? row.dataset.token === 'no' : row.dataset.evidence === activeFilter);
    const matches = evidenceMatches && (!query || row.dataset.search.includes(query));
    row.hidden = !matches;
    if (matches) visibleCount++;
  }
  for (const [index, group] of groups.entries()) {
    const visible = [...group.querySelectorAll('[data-source-row]')].filter(row => !row.hidden).length;
    group.hidden = visible === 0;
    group.querySelector('.group-count').textContent = `${visible} 类`;
    group.open = narrowing ? visible > 0 : index === 0;
  }
  document.querySelector('#source-result').textContent = `显示 ${visibleCount} / 54 类来源`;
  document.querySelector('#source-empty').hidden = visibleCount > 0;
}

search.addEventListener('input', filterSources);
for (const button of filterButtons) {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    for (const candidate of filterButtons) {
      candidate.setAttribute('aria-pressed', String(candidate === button));
    }
    filterSources();
  });
}

const events = [
  { type: 'model', model: '模型 A', raw: { type: 'turn_context', payload: { model: 'model-A' } }, note: '当前模型更新为 A。这条事件只提供模型身份，没有可加总的消耗。' },
  { type: 'usage', input: 1000, cached: 600, output: 100, raw: { type: 'token_count', total_token_usage: { input_tokens: 1000, cached_input_tokens: 600, output_tokens: 100 } }, note: '首次累计值按零基线做差：A 计普通输入 400、缓存读取 600、输出 100。此处省略 fork 特殊基线，只演示普通会话。' },
  { type: 'usage', input: 1000, cached: 600, output: 100, raw: { type: 'token_count', total_token_usage: { input_tokens: 1000, cached_input_tokens: 600, output_tokens: 100 } }, note: '重复快照与上次累计值相同，三类增量都是 0，模型 A 不会再增加消耗。' },
  { type: 'model', model: '模型 B', raw: { type: 'turn_context', payload: { model: 'model-B' } }, note: '切换到模型 B，但会话累计值仍保留。后面的新增用量归给 B。' },
  { type: 'usage', input: 1600, cached: 900, output: 180, raw: { type: 'token_count', total_token_usage: { input_tokens: 1600, cached_input_tokens: 900, output_tokens: 180 } }, note: '新增输入 600，其中缓存 300：B 计普通输入 300、缓存读取 300、输出 80。A 的历史用量保持原值。' },
];
let eventIndex = 1;
const nextButton = document.querySelector('#demo-next');
const resetButton = document.querySelector('#demo-reset');

function renderLedger() {
  const totals = { '模型 A': { input: 0, cached: 0, output: 0 }, '模型 B': { input: 0, cached: 0, output: 0 } };
  let currentModel = null;
  let previous = { input: 0, cached: 0, output: 0 };
  for (const event of events.slice(0, eventIndex + 1)) {
    if (event.type === 'model') {
      currentModel = event.model;
      continue;
    }
    const inputDelta = Math.max(event.input - previous.input, 0);
    const cacheDelta = Math.max(event.cached - previous.cached, 0);
    const outputDelta = Math.max(event.output - previous.output, 0);
    totals[currentModel].input += Math.max(inputDelta - cacheDelta, 0);
    totals[currentModel].cached += cacheDelta;
    totals[currentModel].output += outputDelta;
    previous = event;
  }
  const event = events[eventIndex];
  document.querySelector('#demo-event').textContent = JSON.stringify(event.raw, null, 2);
  document.querySelector('#demo-explanation').textContent = event.note;
  document.querySelector('#demo-step').textContent = `第 ${eventIndex + 1} / ${events.length} 条记录`;
  const tbody = document.querySelector('#demo-totals');
  tbody.replaceChildren();
  for (const [name, tally] of Object.entries(totals)) {
    const row = document.createElement('tr');
    const heading = document.createElement('th');
    heading.scope = 'row';
    heading.textContent = name;
    row.append(heading);
    for (const count of [tally.input, tally.cached, tally.output]) {
      const cell = document.createElement('td');
      cell.textContent = count.toLocaleString('zh-CN');
      row.append(cell);
    }
    tbody.append(row);
  }
  nextButton.disabled = eventIndex === events.length - 1;
  nextButton.textContent = nextButton.disabled ? '已读完全部记录' : '读取下一条 →';
  resetButton.disabled = eventIndex === 0;
}

nextButton.addEventListener('click', () => {
  if (eventIndex < events.length - 1) eventIndex++;
  renderLedger();
});
resetButton.addEventListener('click', () => {
  eventIndex = 0;
  renderLedger();
});
renderLedger();
