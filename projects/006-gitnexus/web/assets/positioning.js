(() => {
  'use strict';
  document.querySelectorAll('[data-research-summary]').forEach(host => {
    const base = host.dataset.reportBase || '';
    const compact = host.dataset.researchSummary === 'compact';
    host.classList.add('research-summary');
    host.innerHTML = `
      <div class="research-heading">
        <p class="research-kicker">CORE POSITIONING / 核心定位</p>
        <h2>代码知识索引、分析与 AI 工具接入。</h2>
        <p>把源码组织成可查询、可维护的代码知识图谱，围绕开发任务提供结构上下文。网页展示是其中一种输出，CLI／MCP 等接口也能把结果交给其他工具使用。</p>
      </div>
      <div class="research-layers" aria-label="三层核心能力">
        <article><span>01 / 知识索引</span><h3>把代码连接起来</h3><p>解析文件、函数和类型，解析调用、导入等跨文件关系，存入本地 LadybugDB；代码变化后需要维护索引。</p></article>
        <article><span>02 / 查询分析</span><h3>围绕任务获取依据</h3><p>检索、上下文、模块与候选流程、影响分析、diff 关联和改名预览；扩展到 API 与可选的数据流分析。</p></article>
        <article><span>03 / 工具接入</span><h3>把上下文交给 AI</h3><p>通过 CLI／MCP 等接口返回结构化结果，让 Agent 按需调查代码、规划修改；实际修改仍需执行与测试确认。</p></article>
      </div>
      <p class="research-output"><b>呈现层</b> 图谱、流程播放和源码联动帮助人理解；可选问答与 Wiki 还需要相应模型或配置。索引与分析结果也可以独立供工具消费。</p>
      <details class="research-proof" ${compact ? '' : 'open'}>
        <summary><span>验证范围：已实跑／存在缺口／尚未验证</span><small>展开核对证据与边界</small></summary>
        <div class="research-status-grid">
          <article class="research-status" data-proof="verified">
            <span class="research-badge">已验证 · 原创小样本</span><h3>已有真实索引与工具输出</h3>
            <ul><li>基础图谱：71 实体／131 关系，4 分组、4 条候选流程。</li><li>10 个函数的 context 与 impact、3 次关键词 FTS 查询，以及有向路径追踪。</li><li>Git diff 定位到 1 个符号、1 条流程；循环导入检查已运行。</li><li>工具定义映射已实跑；5 组业务金额对照来自执行样本源码，属于外部验证，非图谱自动预测。</li></ul>
            <a href="${base}references/atlas-report.md" target="_blank" rel="noreferrer">基础结果与业务探针 ↗</a>
          </article>
          <article class="research-status" data-proof="limited">
            <span class="research-badge">已实跑 · 存在缺口</span><h3>能看到效果，也保留未命中</h3>
            <ul><li>高级样本独立建图：103 实体／154 关系。</li><li>改名仅 dry-run：4 文件／5 候选，未写入；其中 1 项来自文本匹配，需人工审阅。</li><li>API：3 路由、1 条客户端关联、1 个响应字段偏差；参数 URL 的客户端关联未命中。</li><li>可选 PDG：7 条控制依赖、3 条变量依赖；输入传播覆盖部分案例，回调案例漏报。</li></ul>
            <a href="${base}references/advanced-run-report.md" target="_blank" rel="noreferrer">高级实验与已知缺口 ↗</a>
          </article>
          <article class="research-status" data-proof="pending">
            <span class="research-badge">尚未验证 · 不作效果承诺</span><h3>需要额外配置或真实项目实验</h3>
            <ul><li>向量检索、真实模型问答、Wiki 生成、AI 自动修改与修复成功率。</li><li>MCP 接入真实 Agent 的端到端任务；本页 AI 步骤为教学编排，未调用 LLM。</li><li>跨仓库组、分支切换、自动同步及长期索引维护。</li><li>真实大型仓库的语言／框架覆盖、索引与更新成本，以及耗时、Token 和效率收益。</li></ul>
            <a href="${base}references/run-report.md" target="_blank" rel="noreferrer">核对实测方法与范围 ↗</a>
          </article>
        </div>
        <div class="research-conclusion"><b>现在能判断什么？</b><p>理解定位、原理、能力与初步选型，材料已经够用。决定采用前，应在自己的真实项目验证关系完整性、索引维护成本和实际任务收益。静态流程与影响候选不能替代真实运行证据。</p></div>
        <p class="research-provenance">本总结整理于 2026-10-19，沿用 2026-10-16 保存的 npm 1.6.12 实验。公开网页回放已保存结果，未部署 GitNexus 数据库、索引服务或模型；图形布局与交互由本展厅实现。</p>
      </details>
      <nav class="research-links" aria-label="继续阅读研究结论"><a href="${base}#mechanism" target="_top">原理链路 ↗</a><a href="${base}#insights" target="_top">研究启发 ↗</a><a href="${base}#directions" target="_top">产品方向 ↗</a><a href="${base}extensions.md" target="_top">完整研究整理 ↗</a></nav>`;
  });
  const revealSummary = () => {
    if (location.hash !== '#understanding') return;
    const proof = document.querySelector('#understanding .research-proof');
    if (proof) proof.open = true;
  };
  revealSummary();
  window.addEventListener('hashchange', revealSummary);
})();
