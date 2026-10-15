/* Visual replay of genuine CLI output. No live indexing or invented tool runs. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const tabs = [...document.querySelectorAll('[data-effect]')];
  const colors = ['#569b87', '#8fa84c', '#bb9254', '#858eb5'];
  let evidence, extra, current = 'map';
  const meta = {
    map: ['INDEX → COMMUNITY', '从整仓图谱，看见功能分组。', '自动聚类得到 4 个分组及 12 个成员。两个分组同名 Services，用 ID 区分；分组并不等于目录树。', 'gitnexus cypher "MATCH (c:Community) RETURN c"', 'references/showcase-memberships.json', '分组由代码关系归纳，名称使用启发式标签；成员来自 MEMBER_OF 实际查询。聚类不保证等同于业务架构。'],
    flow: ['PROCESS → STEP_IN_PROCESS', '把候选流程，展开成逐步路径。', '选择一条检测出的流程，查看入口、跨文件步骤和终点。步骤直接读取数据库中的 STEP_IN_PROCESS。', 'gitnexus cypher "MATCH (n)-[r:CodeRelation]->(p:Process) WHERE r.type = \'STEP_IN_PROCESS\' RETURN n.name, p.label, r.step"', 'references/showcase-steps.json', '这些是静态候选流程，不是执行时序或耗时记录；4 条流程也不代表所有业务路径。'],
    context: ['CONTEXT', '围绕一个函数，拿到具体上下文。', '查询 calculateShipping，返回它的定义、两个直接调用者及所属流程。', 'gitnexus context calculateShipping --file services/shipping.ts --content', 'references/context.json', '空的 outgoing 表示本次图谱没有返回被调用符号，不能推出函数没有任何运行时依赖。源码显示使用了数组方法。'],
    impact: ['IMPACT / UPSTREAM', '从改动点，按层展开潜在影响。', '以运费函数为目标，上游分析返回 4 个项目：2 个直接调用者，以及 2 个第二层依赖。', 'gitnexus impact calculateShipping --file services/shipping.ts --direction upstream --depth 3', 'references/impact.json', '展示完整的 byDepth 返回项，包含 verify.ts 文件。下方业务函数图只显示其中的函数。LOW 是工具风险标签，不能作为修改安全证明。'],
    search: ['QUERY / FTS', '搜索结果，按流程和定义组织。', '真实关键词 shipping checkout order 返回 4 条流程、1 个流程符号和 13 条定义。', 'gitnexus query "shipping checkout order" --limit 5 --content', 'references/query.json', '本次没有 embeddings，只验证关键词检索。输入框只过滤这次保存的 18 条返回项，不会重新调用 GitNexus。'],
    trace: ['TRACE / DIRECTED PATH', '把两个符号，连成跨文件路径。', '从下单入口到订单存储，trace 找到一条 2 跳的有向调用链。', 'gitnexus trace submitOrder saveOrder --from-file routes/order.ts --to-file storage/orders.ts', 'references/trace.json', '这是一条静态可解析路径，不表示每次请求都会执行到终点。下列行号已从原始零基行号换算为编辑器行号。'],
    change: ['DETECT_CHANGES + CHECK', '把真实 diff，映射到函数和流程。', '在隔离样本中将免邮门槛从 100 元改到 120 元，执行 unstaged 变更分析后恢复原文件。', 'gitnexus detect-changes --scope unstaged', 'references/showcase-changes.stdout.txt', '变更检查返回 medium；它与 impact 的 LOW 来自不同工具和统计口径。标签不是故障概率。此视图回放已执行的实验，不修改网页中的样本源码。']
  };
  const stat = (value, label) => `<div class="effect-stat"><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`;
  const symbols = list => `<ul class="effect-symbols">${list.map(node => `<li><b>${escape(node.name || node.filePath)}</b><small>${escape(node.filePath)}${node.startLine ? ` : ${escape(node.startLine)}` : ''}</small></li>`).join('')}</ul>`;
  function stepsView(steps) {
    return `<div class="flow-steps" style="--steps:${steps.length}">${steps.map((node, i) => {
      const community = extra.communities.find(group => group.members.some(member => member.id === node.id));
      return `<article class="flow-step"><span>${String(i + 1).padStart(2, '0')}</span><h4>${escape(node.name)}</h4><p>${escape(node.filePath)}${node.startLine ? ` : ${node.startLine}` : ''}</p>${community ? `<small>${escape(community.id)} · ${escape(community.label)}</small>` : ''}</article>`;
    }).join('')}</div>`;
  }
  function typeBars(rows, title, key) {
    const max = Math.max(...rows.map(row => row.count));
    return `<div><h4>${title}</h4>${rows.map(row => `<div class="type-bar"><span>${escape(row[key])}</span><i><i style="width:${row.count / max * 100}%"></i></i><b>${row.count}</b></div>`).join('')}</div>`;
  }
  function drawMap() {
    return `<div class="effect-stats">${stat(71,'全图节点')}${stat(131,'全图关系')}${stat(extra.communities.length,'自动分组')}${stat(extra.processes.length,'候选流程')}</div><div class="community-grid">${extra.communities.map((group, i) => `<article class="community-card" style="--cluster-color:${colors[i]}"><header><h4><i class="cluster-dot"></i>${escape(group.label)}</h4><span>${escape(group.id)} · ${group.symbolCount} 成员</span></header><ul>${group.members.map(member => `<li><span>${escape(member.name)}</span><small>${escape(member.filePath)}</small></li>`).join('')}</ul></article>`).join('')}</div><details class="effect-details"><summary>展开全图节点与关系类型（71 / 131 的统计构成）</summary><div class="type-bars">${typeBars(extra.nodeTypes,'节点类型','label')}${typeBars(extra.relationTypes,'关系类型','type')}</div><p class="effect-callout">全图有 13 条 CALLS；下方业务子图只包含 10 个业务函数之间的 11 条调用。</p></details>`;
  }
  function drawFlow() {
    return `<label class="effect-control">选择真实流程<select id="showcase-process">${extra.processes.map(process => `<option value="${escape(process.id)}" ${process.id === 'proc_3_submitorder' ? 'selected' : ''}>${escape(process.label)} · ${process.stepCount} 步</option>`).join('')}</select></label><div id="showcase-process-steps"></div><p class="effect-callout">不同终点对应不同候选流程。分组 ID 显示这条路径如何跨越自动分组。</p>`;
  }
  function setProcess(id) {
    const process = extra.processes.find(value => value.id === id);
    $('showcase-process-steps').innerHTML = stepsView(process.steps);
  }
  function drawContext() {
    const result = evidence.results.context;
    return `<div class="context-columns"><div class="context-block"><span>SYMBOL DEFINITION</span><h4>${escape(result.symbol.name)}</h4><p>${escape(result.symbol.filePath)} : ${result.symbol.startLine}–${result.symbol.endLine}</p><pre class="effect-source">${escape(result.symbol.content)}</pre></div><div class="context-block"><span>INCOMING CALLS / ${result.incoming.calls.length}</span><h4>哪些函数直接调用它</h4>${symbols(result.incoming.calls)}<p class="effect-callout">流程参与：${result.processes.map(process => `<b>${escape(process.name)}</b> · 第 ${process.step_index} / ${process.step_count} 步`).join('；')}</p></div></div>`;
  }
  function drawImpact() {
    const result = evidence.results.impact;
    return `<div class="impact-target"><span>修改目标</span><code>calculateShipping · services/shipping.ts</code></div><div class="impact-grid">${Object.entries(result.byDepth).map(([depth, list]) => `<article class="depth-card"><h4>DEPTH ${escape(depth)} · ${depth === '1' ? '直接调用' : '间接依赖'} / ${list.length}</h4>${symbols(list)}</article>`).join('')}</div><p class="effect-callout"><span class="risk-tag">impact: ${escape(result.risk)}</span>${result.impactedCount} 个返回项 · ${result.summary.processes_affected} 条流程 · ${result.summary.modules_affected} 个模块受影响。返回项包含不同实体类型，均需结合源码复核。</p>`;
  }
  function drawSearch() {
    const result = evidence.results.query;
    return `<div class="search-summary"><span>固定查询：<strong>shipping checkout order</strong></span><span>${result.processes.length} 流程</span><span>${result.process_symbols.length} 流程符号</span><span>${result.definitions.length} 定义</span></div><label><span class="sr-only">过滤本次搜索返回项</span><input class="effect-filter" id="showcase-search" type="search" placeholder="过滤本次返回项，如 shipping / checkout…" autocomplete="off"></label><div id="showcase-search-results"></div>`;
  }
  function setSearch(term = '') {
    const query = term.trim().toLowerCase();
    const groups = [['流程','processes'], ['流程符号','process_symbols'], ['定义','definitions']];
    let hits = 0;
    $('showcase-search-results').innerHTML = groups.map(([label, key]) => {
      const rows = evidence.results.query[key].filter(row => [row.name,row.summary,row.filePath,row.module].join(' ').toLowerCase().includes(query));
      hits += rows.length;
      return `<section class="search-group"><h4>${label} · ${rows.length}</h4><div class="search-hits">${rows.map(row => `<article class="search-hit"><code>${escape(row.summary || row.name)}</code><p>${escape(row.filePath || row.id)}</p><span>${row.step_count ? `${row.step_count} 步 · ${escape(row.process_type)}` : escape(row.type || row.kind || (row.id || '').split(':')[0] || 'symbol')}${row.module ? ` · ${escape(row.module)}` : ''}</span></article>`).join('')}</div></section>`;
    }).join('') + (hits ? '' : '<p class="effect-empty">本次保存的返回项中没有匹配内容。清空筛选可恢复全部结果。</p>');
  }
  function drawTrace() {
    const result = evidence.results.trace;
    const nodes = result.hops.map(node => ({...node, startLine:node.startLine + 1}));
    return `<p class="effect-callout"><b>${result.hopCount} 跳 / ${nodes.length} 个符号</b> · 箭头表示 CALLS 方向</p>${stepsView(nodes)}<p class="effect-callout">每条路径边的解析 confidence 均为 0.85；这个字段不是测得的准确率。</p>`;
  }
  function drawChange() {
    const result = extra.changes;
    return `<div class="change-example"><div class="change-code"><span>修改前 / 本地免邮门槛 100 元</span><code>if (subtotal &gt;= <strong>10000</strong> &amp;&amp; region === "local") return 0;</code></div><div class="change-code after"><span>修改后 / 本地免邮门槛 120 元</span><code>if (subtotal &gt;= <strong>12000</strong> &amp;&amp; region === "local") return 0;</code></div></div><div class="effect-stats">${stat(result.changedFiles,'变更文件')}${stat(result.changedSymbols,'变更符号')}${stat(result.affectedProcesses,'关联流程')}${stat(result.risk,'detect_changes 风险')}</div><div class="change-report"><h4>变更符号：${escape(result.symbol)}</h4><p>关联流程：SubmitOrder → CalculateShipping。变更定位到 services/shipping.ts 中的函数，再关联到已索引流程的第 3 步。</p>${stepsView(extra.processes.find(process => process.id === result.processId).steps)}</div><details class="effect-details"><summary>展开原始 diff 与 CLI 报告</summary><pre class="effect-source">${escape(result.diff + '\n' + result.rawText)}</pre><a class="cite" href="references/showcase-change.diff">查看原始 diff ↗</a></details><div class="check-clean"><b>✓</b><span><code>gitnexus check --cycles --json</code>：循环导入 ${extra.check.cycleCount}，enumeration=${escape(extra.check.enumeration)}。仅说明本样本的静态导入检查结果。<a href="references/showcase-check.json">原始报告 ↗</a></span></div>`;
  }
  const views = {map:drawMap, flow:drawFlow, context:drawContext, impact:drawImpact, search:drawSearch, trace:drawTrace, change:drawChange};
  function select(id) {
    current = id;
    tabs.forEach(button => {
      const selected = button.dataset.effect === id;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    $('effect-panel').setAttribute('aria-labelledby', `effect-${id}`);
    const [tool,title,description,command,raw,note] = meta[id];
    $('effect-tool').textContent = tool;
    $('effect-title').textContent = title;
    $('effect-description').textContent = description;
    $('effect-command').textContent = command;
    $('effect-raw').href = raw;
    $('effect-note').textContent = note;
    if (!evidence || !extra) return;
    $('effect-output').innerHTML = views[id]();
    if (id === 'flow') {
      setProcess($('showcase-process').value);
      $('showcase-process').addEventListener('change', event => setProcess(event.target.value));
    }
    if (id === 'search') {
      setSearch();
      $('showcase-search').addEventListener('input', event => setSearch(event.target.value));
    }
  }
  tabs.forEach((button,index) => {
    button.addEventListener('click', () => select(button.dataset.effect));
    button.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(tabs[next].dataset.effect);
      tabs[next].focus();
    });
  });
  document.querySelectorAll('[data-show-effect]').forEach(link => link.addEventListener('click', () => select(link.dataset.showEffect)));
  Promise.all(['evidence','showcase'].map(async name => {
    const response = await fetch(`assets/${name}.json`);
    if (!response.ok) throw new Error(`${name}: ${response.status}`);
    return response.json();
  })).then(([first,second]) => {
    evidence = first; extra = second;
    if (evidence.status !== 'verified' || extra.status !== 'verified') throw new Error('Evidence not verified');
    $('showcase-status').textContent = '7 种效果 · 真实数据回放';
    document.documentElement.dataset.showcaseReady = 'true';
    select(current);
  }).catch(() => {
    $('showcase-status').textContent = '实测记录加载失败';
    $('effect-title').textContent = '暂时无法读取效果数据。';
    $('effect-description').textContent = '请通过 HTTP 访问并刷新；也可打开原始输出。';
    document.documentElement.dataset.showcaseReady = 'error';
  });
})();
