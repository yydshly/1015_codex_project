(() => {
  'use strict';
  const data = window.OCTOP_RESEARCH;
  if (!data) return;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const sourceMap = new Map(data.sources.map((source) => [source.id, source]));
  const refs = (ids, compact = false) => `<div class="source-refs" aria-label="相关来源">${ids.map((id) => {
    const s = sourceMap.get(id);
    if (!s) return '';
    const title = compact ? ({ '官方产品文档': '官方', '源码': '源码', '上游文档': '文档' }[s.kind] + ' · ' + s.id) : s.title;
    return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer" title="${esc(s.title)}">${esc(title)} ↗</a>`;
  }).join('')}</div>`;
  const pressed = (selector, element) => $$(selector).forEach((button) => button.setAttribute('aria-pressed', String(button === element)));

  function renderCapabilities(filter = 'all') {
    const cards = data.capabilities.filter((card) => filter === 'all' || card.kind === filter);
    $('#capabilityGrid').innerHTML = cards.map((card) => `<article class="cap-card">
      <div class="cap-card-number"><span>${String(data.capabilities.indexOf(card) + 1).padStart(2, '0')}</span><small class="status-label ${esc(card.kind)}">${esc(card.tag)}</small></div>
      <h3>${esc(card.title)}</h3><p>${esc(card.text)}</p><div class="cap-example">${esc(card.example)}</div>${refs(card.sources, true)}</article>`).join('');
    $('#capabilityCount').textContent = `显示 ${cards.length} / ${data.capabilities.length} 项 · 状态按研究版本记录`;
  }
  $$('[data-cap-filter]').forEach((button) => button.addEventListener('click', () => {
    pressed('[data-cap-filter]', button);
    renderCapabilities(button.dataset.capFilter);
  }));
  renderCapabilities();

  let currentStep = 0;
  let scenarioId = 'report';
  $('#flowTrack').innerHTML = data.flow.map((step, index) => `<button class="flow-step" type="button" data-step="${index}" data-number="${String(index + 1).padStart(2, '0')}" aria-pressed="${index === 0}">${esc(step.name)}</button>`).join('');
  function renderFlow(scrollTrack = false) {
    const scenario = data.scenarios.find((item) => item.id === scenarioId);
    const step = data.flow[currentStep];
    $('#scenarioRequest').textContent = scenario.request;
    $('#scenarioArtifact').textContent = scenario.artifact;
    $('#scenarioBoundary').textContent = scenario.boundary;
    $('#stepCounter').textContent = `${String(currentStep + 1).padStart(2, '0')} / 07`;
    $('#prevStep').disabled = currentStep === 0;
    $('#nextStep').disabled = currentStep === data.flow.length - 1;
    let where = step.where;
    if (currentStep === 3) where = $('#modelSelect').value === 'cloud' ? '请求发往所配置的云端模型 API' : '此示例中的同机 Ollama';
    if ([0, 1, 6].includes(currentStep)) where = $('#hostSelect').value === 'personal' ? '部署 Octop 的个人电脑' : '部署 Octop 的常开服务器 / NAS';
    $('#flowDetail').innerHTML = `<div class="flow-explanation"><div class="step-detail-heading"><span>${String(currentStep + 1).padStart(2, '0')}</span><h3>${esc(step.name)}</h3></div><p>${esc(step.description)}</p>${refs(step.sources, true)}</div>
      <div class="tool-observation"><div class="observation-label">这一情景中，会发生什么？</div><p>${esc(scenario.actions[currentStep])}</p><dl class="execution-meta"><div><dt>对应组件</dt><dd>${esc(step.component)}</dd></div><div><dt>发生位置</dt><dd>${esc(where)}</dd></div></dl><div class="decision-note">${esc(step.decision)}</div></div>`;
    $$('[data-step]').forEach((button) => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.step) === currentStep));
      if (scrollTrack && Number(button.dataset.step) === currentStep) button.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
    });
  }
  $$('[data-step]').forEach((button) => button.addEventListener('click', () => { currentStep = Number(button.dataset.step); renderFlow(); }));
  $('#prevStep').addEventListener('click', () => { if (currentStep > 0) { currentStep--; renderFlow(true); } });
  $('#nextStep').addEventListener('click', () => { if (currentStep < data.flow.length - 1) { currentStep++; renderFlow(true); } });
  $('#scenarioSelect').addEventListener('change', (event) => { scenarioId = event.target.value; currentStep = 0; renderFlow(true); });
  $('#researchScenarioLink').addEventListener('click', () => { scenarioId = 'research'; currentStep = 0; $('#scenarioSelect').value = scenarioId; renderFlow(); });
  function renderEnvironment() {
    const server = $('#hostSelect').value === 'server';
    const cloudModel = $('#modelSelect').value === 'cloud';
    const host = server ? '常开服务器 / NAS' : '个人电脑';
    $('#environmentResult').innerHTML = `<p><strong>工具运行：</strong>Octop 服务运行于${host}。文件和命令工具按配置访问工作环境，MCP 与其他连接器可能调用远程服务。</p>
      <div class="data-flow">消息入口 → ${esc(host)} → ${cloudModel ? '云端模型 API（相关请求上下文会离开主机）' : '同机 Ollama（此示例假设模型与 Octop 同机）'} → 工具 → 结果回传</div>
      <p><strong>个人电脑关机后：</strong>${server ? '只要部署主机继续运行，服务仍可工作；需要个人电脑上资源的步骤另看连接是否可用。' : '这台电脑上的 Octop 服务随之停止。把配置留在磁盘上，不等于任务仍在运行。'}</p>
      <p><strong>数据流向：</strong>${cloudModel ? '模型请求、文件保存和第三方工具各有数据流向，需要分别确认。' : '使用本地模型仍需分别检查浏览器、连接器、工作区与第三方工具的数据流向。'}</p>`;
    renderFlow();
  }
  $('#hostSelect').addEventListener('change', renderEnvironment);
  $('#modelSelect').addEventListener('change', renderEnvironment);
  renderEnvironment();

  $('#comparisonRows').innerHTML = data.comparison.map((row) => `<tr><th scope="row">${esc(row.dimension)}</th>${['octop', 'codex', 'dots', 'grok'].map((id) => `<td class="${id === 'octop' ? 'octop-column' : ''}">${esc(row[id])}${refs(row.sources.filter((sid) => id === 'octop' ? ['overview', 'architecture', 'acp', 'cron', 'teams'].includes(sid) : id === 'codex' ? sid.startsWith('codex') : id === 'dots' ? sid.startsWith('dots') : sid === 'grok'), true)}</td>`).join('')}</tr>`).join('');
  function renderDecision(id) {
    const decision = data.decisions.find((item) => item.id === id);
    $('#decisionPanel').innerHTML = `<div><h3>${esc(decision.title)}</h3><p>${esc(decision.text)}</p></div><ul>${decision.checks.map((check) => `<li>${esc(check)}</li>`).join('')}</ul>`;
  }
  $$('[data-persona]').forEach((button) => button.addEventListener('click', () => { pressed('[data-persona]', button); renderDecision(button.dataset.persona); }));
  renderDecision('personal');
  $('#questionList').innerHTML = data.questions.map((question, index) => `<details class="question" ${index === 0 ? 'open' : ''}><summary data-number="${String(index + 1).padStart(2, '0')}">${esc(question.title)}</summary><div class="question-content"><p>${esc(question.answer)}</p><p class="next-question">${esc(question.next)}</p></div></details>`).join('');

  $('#extensionTabs').innerHTML = data.extensions.map((extension, index) => `<button id="tab-${esc(extension.id)}" type="button" role="tab" aria-controls="extensionPanel" aria-selected="${index === 0}" tabindex="${index === 0 ? '0' : '-1'}" data-extension="${esc(extension.id)}"><span>${esc(extension.label)}</span><span aria-hidden="true">↗</span></button>`).join('');
  function renderExtension(id) {
    const extension = data.extensions.find((item) => item.id === id);
    $$('[data-extension]').forEach((button) => { const selected = button.dataset.extension === id; button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1; });
    $('#extensionPanel').setAttribute('aria-labelledby', `tab-${id}`);
    $('#extensionPanel').innerHTML = `<div class="extension-status">${esc(extension.status)}</div><h3>${esc(extension.title)}</h3><p>${esc(extension.text)}</p><ol>${extension.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol><div class="extension-output">${esc(extension.output)}</div>${refs(extension.sources, true)}`;
  }
  $$('[data-extension]').forEach((button, index, buttons) => {
    button.addEventListener('click', () => renderExtension(button.dataset.extension));
    button.addEventListener('keydown', (event) => {
      let target;
      if (['ArrowDown', 'ArrowRight'].includes(event.key)) target = (index + 1) % buttons.length;
      else if (['ArrowUp', 'ArrowLeft'].includes(event.key)) target = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = buttons.length - 1;
      if (target !== undefined) { event.preventDefault(); renderExtension(buttons[target].dataset.extension); buttons[target].focus(); }
    });
  });
  renderExtension('model');
  let sourceFilter = 'all';
  function renderSources() {
    const query = $('#sourceSearch').value.trim().toLocaleLowerCase();
    const sources = data.sources.filter((source) => (sourceFilter === 'all' || source.kind === sourceFilter) && `${source.title} ${source.path || ''} ${source.id} ${source.url}`.toLocaleLowerCase().includes(query));
    $('#sourceCount').textContent = `${sources.length} / ${data.sources.length} 项来源 · 核查于 ${data.date}`;
    $('#sourceGrid').innerHTML = sources.length ? sources.map((source) => `<a class="source-card" href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><div class="source-card-top"><span>${esc(source.kind)}</span><span aria-hidden="true">↗</span></div><h3>${esc(source.title)}</h3><code>${esc(source.path || new URL(source.url).hostname)}</code></a>`).join('') : '<p class="source-empty">没有匹配的来源。可以更换类型或清空搜索。</p>';
  }
  $$('[data-source-filter]').forEach((button) => button.addEventListener('click', () => { sourceFilter = button.dataset.sourceFilter; pressed('[data-source-filter]', button); renderSources(); }));
  $('#sourceSearch').addEventListener('input', renderSources);
  $('#commitLabel').textContent = data.commit;
  renderSources();
  const navLinks = $$('.chapter-nav a');
  const sections = navLinks.map((link) => $(link.getAttribute('href')));
  let scheduled = false;
  function updateReading() {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    document.documentElement.style.setProperty('--reading', `${height > 0 ? (window.scrollY / height) * 100 : 0}%`);
    let active = sections[0];
    for (const section of sections) if (section.getBoundingClientRect().top <= 205) active = section;
    navLinks.forEach((link) => { const isActive = link.getAttribute('href') === `#${active.id}`; link.classList.toggle('active', isActive); if (isActive) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
    scheduled = false;
  }
  window.addEventListener('scroll', () => { if (!scheduled) { scheduled = true; requestAnimationFrame(updateReading); } }, { passive: true });
  window.addEventListener('resize', updateReading);
  updateReading();
})();
