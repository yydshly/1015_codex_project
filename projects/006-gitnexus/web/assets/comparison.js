"use strict";
(() => {
  const tasks = [
    {
      title: "修改运费规则",
      description: "要改 calculateShipping，先调查调用方，再决定阅读与回归范围。",
      choice: "先按函数调查，可评估 GitNexus 或 Ix；要面向团队讲解相关文件，CodeFlow 更适合作为浏览入口。三者都不能替代源码检查和业务测试。",
      tools: [
        {name:"GitNexus",badge:"本次实测 · 固定 v1.6.12",observed:true,command:"context calculateShipping\nimpact / trace",detail:"真实 context 返回 checkoutOrder、estimateOrder；网页业务子图还可反向展开到 submitOrder，并查看源码和入口路径。",url:"#explorer",link:"查看本次真实图谱 ↗"},
        {name:"Ix",badge:"文档能力 · 未跑同一样本",command:"ix callers calculateShipping\nix impact / context",detail:"按符号查询调用者、影响候选和有限上下文，回到定义位置核对。这里演示工作方式，没有生成或假定 Ix 的真实结果。",url:"https://github.com/ix-infrastructure/Ix/blob/main/skills/ix/references/commands.md",link:"核对 Ix 查询命令 ↗"},
        {name:"CodeFlow",badge:"工作方式示意 · 不同样本已跑",command:"选择 services/shipping.ts\n查看文件关联 / Blast / Code",detail:"以文件为入口检查关联文件和源码卡片，便于浏览影响候选；主图粒度和本页函数子图不同，数量不能直接比较。",url:"https://github.com/braedonsaunders/codeflow#features",link:"核对 CodeFlow 视图 ↗"}
      ]
    },
    {
      title: "快速熟悉仓库",
      description: "先形成整体印象，再从目录或业务入口进入局部代码。",
      choice: "如果目标是尽快看结构、读源码并输出介绍，先看 CodeFlow；若还要让 Agent 反复查询符号与依赖，可继续评估 GitNexus 或 Ix。",
      tools: [
        {name:"GitNexus",badge:"功能组织示意",command:"analyze → query\ncontext / clusters / processes",detail:"建索引后搜索实现，结合代码分组与候选流程了解功能连接，再选符号展开上下文。关键词和可选语义检索有不同准备条件。",url:"https://github.com/abhigyanpatwari/GitNexus#what-your-ai-agent-gets",link:"核对检索与资源 ↗"},
        {name:"Ix",badge:"文档能力 · 未运行后端",command:"ix overview / inventory\nix subsystems / view",detail:"查询结构摘要、实体清单和子系统，通过 Compass 查看共享后端中的图。适合将局部阅读建立在可维护结构之上。",url:"https://github.com/ix-infrastructure/Ix#commands",link:"核对结构浏览入口 ↗"},
        {name:"CodeFlow",badge:"本次对照的使用重心",command:"打开仓库或本地文件\nGraph / Tree / Treemap / Code",detail:"浏览文件关系、目录、规模与源码卡片；无需先运行数据库服务，可导出图和报告用于讲解。视图数量不代表关系更准确。",url:"https://github.com/braedonsaunders/codeflow#features",link:"核对展示与报告 ↗"}
      ]
    },
    {
      title: "持续跟踪结构",
      description: "代码持续变化时，需要明确更新的是当前索引、图谱修订，还是指标历史。",
      choice: "希望追溯图谱实体与修订，可优先研究 Ix；希望调查当前 Git 变更的相关符号和流程，可看 GitNexus；持续生成可阅读的指标报告可看 CodeFlow Card。",
      tools: [
        {name:"GitNexus",badge:"当前索引与变更检查",command:"analyze 更新索引\ndetect_changes 检查 Git diff",detail:"更新当前代码的结构索引，并将代码差异关联到符号与候选流程。索引过期提示、分支和增量行为须按版本核对。",url:"https://github.com/abhigyanpatwari/GitNexus/blob/main/ARCHITECTURE.md",link:"核对索引与变更分析 ↗"},
        {name:"Ix",badge:"图谱维护与修订追溯",command:"ix map / watch\nix history / diff",detail:"维护持久结构，查询实体历史和图谱修订间变化。这里的 revision 是图谱修订号，不能直接当作 Git commit。",url:"https://github.com/ix-infrastructure/Ix/blob/main/skills/ix/references/commands.md",link:"核对维护和历史命令 ↗"},
        {name:"CodeFlow",badge:"当前分析与指标记录",command:"CLI 监听目录\nCard / Action 更新指标报告",detail:"目录监听更新当前分析，Card 可持续产出报告和指标历史。指标曲线与摘要记录不等于版本化符号关系图。",url:"https://github.com/braedonsaunders/codeflow#codeflow-card",link:"核对 Card 与本地入口 ↗"}
      ]
    },
    {
      title: "研究底层实现",
      description: "想自己做相似能力时，需要能追踪解析、关系解析、保存、查询和界面之间的连接。",
      choice: "研究完整代码图谱处理链路，可优先阅读 GitNexus；研究浏览器解析、布局与报告，可从 CodeFlow 入手；Ix 的公开 CLI 与解析可研究，后端扩展须考虑源码边界。",
      tools: [
        {name:"GitNexus",badge:"可继续追踪公开处理链路",command:"ingestion → LadybugDB\n查询后端 → MCP / HTTP → Web",detail:"可以沿源码检查 AST 提取、跨文件解析、聚类、持久化和任务查询；适合研究如何把关系组织成 Agent 可用结果。",url:"https://github.com/abhigyanpatwari/GitNexus/blob/main/ARCHITECTURE.md",link:"打开实现导航 ↗"},
        {name:"Ix",badge:"后端镜像公开，后端源码私有",command:"公开解析 / CLI / 客户端\n→ 已发布 memory-layer 镜像",detail:"可以研究图补丁、命令和接入层。Scala memory-layer 位于私有仓库；可以使用公开镜像，但无法从公开仓库修改其全部查询实现。",url:"https://github.com/ix-infrastructure/Ix/blob/main/CONTRIBUTING.md#backend-development",link:"核对后端开发边界 ↗"},
        {name:"CodeFlow",badge:"浏览器分析与呈现链路",command:"源码提取 → 文件关系\n→ 交互图 / 源码卡片 / 导出",detail:"适合研究怎样把代码分析结果转成可操作的网页与报告。改变布局主要改变呈现；提高关系质量仍要改解析与目标解析。",url:"https://github.com/braedonsaunders/codeflow#architecture",link:"核对浏览器架构 ↗"}
      ]
    }
  ];
  const buttons = [...document.querySelectorAll("[data-scenario]")];
  const panel = document.querySelector("#scenario-panel");
  if (!panel) return;
  function showTask(index, moveFocus = false) {
    const task = tasks[index];
    buttons.forEach((button, i) => {
      button.setAttribute("aria-selected", String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      if (i === index && moveFocus) button.focus();
    });
    panel.setAttribute("aria-labelledby", `scenario-${index}`);
    document.querySelector("#scenario-title").textContent = task.title;
    document.querySelector("#scenario-description").textContent = task.description;
    document.querySelector("#scenario-choice").textContent = task.choice;
    const lanes = document.querySelector("#scenario-lanes");
    lanes.replaceChildren();
    for (const tool of task.tools) {
      const article = document.createElement("article"); article.className = "scenario-lane";
      const heading = document.createElement("h5"); heading.textContent = tool.name;
      const badge = document.createElement("span"); badge.className = `scenario-badge${tool.observed ? " observed" : ""}`; badge.textContent = tool.badge;
      const command = document.createElement("code"); command.textContent = tool.command;
      const detail = document.createElement("p"); detail.textContent = tool.detail;
      const link = document.createElement("a"); link.href = tool.url; link.textContent = tool.link;
      if (!tool.url.startsWith("#")) { link.target = "_blank"; link.rel = "noreferrer"; }
      article.append(heading, badge, command, detail, link); lanes.append(article);
    }
  }
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => showTask(index));
    button.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tasks.length;
      if (event.key === "ArrowLeft") next = (index + tasks.length - 1) % tasks.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = tasks.length - 1;
      if (next !== undefined) { event.preventDefault(); showTask(next, true); }
    });
  });
  showTask(0);
})();
