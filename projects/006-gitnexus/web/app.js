"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const upstream = "https://github.com/abhigyanpatwari/GitNexus/blob/main/";
const stages = [
  { kicker: "TREE-SITTER / AST", title: "先看懂单个文件的语法结构", description: "解析器找到函数定义、参数、调用表达式和源码位置。AST 记录语法的包含关系，为下一步提取符号和引用提供输入。", insight: "解析不会执行程序。语法树本身也没有确定跨文件调用的目标。", file: "services/estimate.ts → AST（简化）", code: 'import { calculateShipping as shippingCost }\n  from "./shipping.ts";\n\nfunction estimateOrder(input) {\n  return shippingCost(input.items, input.customer.region);\n}\n\n// 提取：定义 estimateOrder\n// 提取：调用 shippingCost\n// 提取：导入名 calculateShipping → 局部名 shippingCost', source: "ARCHITECTURE.md#pipeline-phase-dag" },
  { kicker: "SCOPE + IMPORT BINDINGS", title: "把局部名字连接到真正定义", description: "结合导入、别名、词法作用域和有限类型推断，解析调用目标。两个文件里都叫 validate 的函数，需要用绑定和所在模块区分。", insight: "关系解析决定图谱质量。复杂动态调用可能无法解析，也可能产生启发式候选。", file: "跨文件目标解析（简化）", code: 'estimate.ts\n  shippingCost\n    ↓ 导入别名\nshipping.ts\n  calculateShipping\n\n于是建立：\nestimateOrder ──CALLS──▶ calculateShipping\n\ncustomer.validate ≠ inventory.validate', source: "ARCHITECTURE.md#import-resolution" },
  { kicker: "LADYBUGDB / LOCAL GRAPH", title: "用节点和边保存代码关系", description: "函数、类、文件等成为节点；调用、导入、继承等成为带类型的边。图保存在本地嵌入式 LadybugDB，默认索引目录是 .gitnexus/，无需单独部署数据库。", insight: "AST 用于提取语法；持久图谱服务跨文件的查询。数据库保存的是分析结果。", file: "Cypher 查询（示意，字段随版本核对）", code: 'MATCH (caller:Function)\n  -[r:CodeRelation {type: "CALLS"}]->\n  (target:Function)\nWHERE target.name = "calculateShipping"\nRETURN caller.name, caller.filePath;\n\n// 目标：查找指向该符号的调用边\n// 同名符号还要以文件或唯一 ID 消歧', source: "ARCHITECTURE.md#end-to-end-flow-index--graph--tools" },
  { kicker: "LEIDEN + CALL-GRAPH TRAVERSAL", title: "提前整理模块分组和候选流程", description: "Leiden 算法依据符号连接划分代码群。流程发现从评分后的候选入口出发，沿调用边遍历，并对路径分组、去重和限额。", insight: "静态流程有深度、分支和入口预算。它不会记录真实请求的执行次数或耗时。", file: "候选调用流程（简化）", code: 'submitOrder\n  → checkoutOrder\n    → calculateSubtotal\n    → applyDiscount\n    → calculateShipping\n    → reserveStock\n    → saveOrder\n\n// 图的分组帮助组织上下文\n// 实际分支仍需要运行验证', source: "gitnexus/src/core/ingestion/process-processor.ts" },
  { kicker: "BM25 + OPTIONAL EMBEDDINGS + GRAPH", title: "先定位，再沿关系取上下文", description: "关键词搜索和可选向量搜索负责召回候选；RRF 合并排名。context、impact、trace 等围绕目标符号，查询邻居、影响范围或路径。", insight: "向量搜索需要额外建立 embeddings。本页实测是否启用，以运行记录为准。", file: "一次查询的组织方式（简化）", code: '问题：“运费在哪计算？”\n\nBM25（词项匹配） ─┐\n                  ├→ RRF 合并 → 候选符号\n语义检索（可选） ─┘\n\n确定 calculateShipping 后：\n  context → 直接调用者 / 被调用者\n  impact  → 沿反向调用边展开\n  trace   → 连接入口与目标', source: "gitnexus/src/core/search/hybrid-search.ts" },
  { kicker: "CLI / MCP / HTTP", title: "让人和 AI 使用同一份索引", description: "CLI、MCP 和 HTTP 后端共享查询层。编程助手获取文件位置、关系和流程后，再读取源码、实施修改、运行验证。Web 界面用于探索与解释。", insight: "减少重复搜索是设计目标；任务质量、Token 和时间收益仍需对照测量。", file: "Agent 工作流（简化）", code: '用户任务\n  ↓\nAI 调用 query / context / impact\n  ↓\nGitNexus 返回结构上下文与位置\n  ↓\nAI 核对源码并修改\n  ↓\n类型检查 + 测试 + 运行验证\n  ↓\n代码变化后更新索引', source: "ARCHITECTURE.md#mcp-tools" }
];

function setStage(index, focus = false) {
  const stage = stages[index];
  $$("[data-step]").forEach((button, i) => {
    button.setAttribute("aria-selected", String(i === index));
    button.tabIndex = i === index ? 0 : -1;
    if (i === index && focus) button.focus();
  });
  $("#pipeline-panel").setAttribute("aria-labelledby", `step-${index}`);
  $("#step-kicker").textContent = stage.kicker;
  $("#step-title").textContent = stage.title;
  $("#step-description").textContent = stage.description;
  $("#step-insight").textContent = stage.insight;
  $("#step-file").textContent = stage.file;
  $("#step-code").textContent = stage.code;
  $("#step-source").href = upstream + stage.source;
}
$$("[data-step]").forEach((button, i) => {
  button.addEventListener("click", () => setStage(i));
  button.addEventListener("keydown", (event) => {
    let next;
    if (event.key === "ArrowRight") next = (i + 1) % stages.length;
    if (event.key === "ArrowLeft") next = (i + stages.length - 1) % stages.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = stages.length - 1;
    if (next !== undefined) { event.preventDefault(); setStage(next, true); }
  });
});
setStage(0);

let dataset = null;
let nodes = [];
let edges = [];
let selectedId = null;
let mode = "context";
let filter = "";
let layout = new Map();
const namespace = "http://www.w3.org/2000/svg";
const byId = (id) => nodes.find((node) => node.id === id);
const named = (name) => nodes.find((node) => node.name === name);
const create = (tag, attributes = {}, content = null) => {
  const element = document.createElementNS(namespace, tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (content !== null) element.textContent = content;
  return element;
};
const idOf = (value) => typeof value === "object" && value !== null ? value.id : value;

function normalize(data) {
  dataset = data;
  nodes = (data.nodes || []).map((node, index) => ({ ...node, id: String(node.id ?? index), name: String(node.name || node.properties?.name || "unnamed"), filePath: node.filePath || node.properties?.filePath || node.file || "", startLine: node.startLine ?? node.properties?.startLine, endLine: node.endLine ?? node.properties?.endLine }));
  const ids = new Set(nodes.map((node) => node.id));
  edges = (data.edges || []).map((edge) => ({ ...edge, source: String(idOf(edge.source ?? edge.from ?? edge.sourceId)), target: String(idOf(edge.target ?? edge.to ?? edge.targetId)), type: edge.type || "CALLS" })).filter((edge) => edge.type === "CALLS" && ids.has(edge.source) && ids.has(edge.target));
  selectedId = named("calculateShipping")?.id || nodes[0]?.id;
}

function getIncoming(id) { return edges.filter((edge) => edge.target === id).map((edge) => byId(edge.source)).filter(Boolean); }
function getOutgoing(id) { return edges.filter((edge) => edge.source === id).map((edge) => byId(edge.target)).filter(Boolean); }
function upstreamLevels(id) {
  const found = new Map([[id, 0]]);
  const queue = [id];
  for (let i = 0; i < queue.length; i++) {
    for (const caller of getIncoming(queue[i])) if (!found.has(caller.id)) { found.set(caller.id, found.get(queue[i]) + 1); queue.push(caller.id); }
  }
  return found;
}
function findPath(from, to) {
  if (!from || !to) return [];
  const seen = new Set([from]);
  const queue = [[from]];
  for (let i = 0; i < queue.length; i++) {
    const path = queue[i];
    if (path.at(-1) === to) return path;
    for (const next of getOutgoing(path.at(-1))) if (!seen.has(next.id)) { seen.add(next.id); queue.push([...path, next.id]); }
  }
  return [];
}
function relationState() {
  const related = new Set([selectedId]);
  const lit = new Set();
  if (mode === "context") edges.forEach((edge, i) => { if (edge.source === selectedId || edge.target === selectedId) { related.add(edge.source); related.add(edge.target); lit.add(i); } });
  if (mode === "impact") {
    const levels = upstreamLevels(selectedId);
    levels.forEach((_, id) => related.add(id));
    edges.forEach((edge, i) => { if (levels.has(edge.source) && levels.has(edge.target)) lit.add(i); });
  }
  if (mode === "trace") {
    const path = findPath(named("submitOrder")?.id, selectedId);
    path.forEach((id) => related.add(id));
    edges.forEach((edge, i) => { if (path.indexOf(edge.source) >= 0 && path[path.indexOf(edge.source) + 1] === edge.target) lit.add(i); });
  }
  return { related, lit };
}

function buildLayout() {
  layout = new Map();
  // Fixed columns are a presentation layout of the extracted symbols, not analyzer output.
  const preferred = {
    submitOrder: [18, 170], estimateOrder: [18, 350], checkoutOrder: [245, 170],
    calculateSubtotal: [480, 30], applyDiscount: [480, 130], calculateShipping: [480, 230],
    reserveStock: [480, 330], saveOrder: [710, 130]
  };
  let remaining = 0;
  nodes.forEach((node) => {
    let place = preferred[node.name];
    if (node.name === "validate" && /inventory/.test(node.filePath)) place = [710, 330];
    if (node.name === "validate" && /customer/.test(node.filePath)) place = [245, 450];
    if (!place) { place = [[18,245,480,710][remaining % 4], 450 + 75 * Math.floor(remaining / 4)]; remaining++; }
    layout.set(node.id, { x: place[0], y: place[1], width: 184, height: 53 });
  });
}

function drawGraph() {
  const svg = $("#relation-graph");
  svg.replaceChildren();
  if (!nodes.length) { $("#graph-empty").hidden = false; $("#graph-empty").textContent = "当前运行记录没有可展示的图谱，请查看下方运行说明。"; return; }
  const maxY = Math.max(...[...layout.values()].map((pos) => pos.y)) + 85;
  svg.setAttribute("viewBox", `0 0 920 ${Math.max(550, maxY)}`);
  const defs = create("defs");
  ["normal", "active"].forEach((name) => {
    const marker = create("marker", { id: `arrow-${name}`, viewBox: "0 0 10 8", refX: 9, refY: 4, markerWidth: 6, markerHeight: 6, orient: "auto" });
    marker.append(create("path", { d: "M0 0 10 4 0 8", fill: "none", stroke: name === "active" ? "#488763" : "#9aaea1", "stroke-width": 1.5 }));
    defs.append(marker);
  });
  svg.append(defs);
  const { related, lit } = relationState();
  const matches = new Set(nodes.filter((node) => !filter || `${node.name} ${node.filePath}`.toLowerCase().includes(filter)).map((node) => node.id));
  $("#graph-empty").hidden = matches.size > 0;
  if (!matches.size) $("#graph-empty").textContent = "没有匹配的符号。试试 shipping 或 checkout。";
  edges.forEach((edge, i) => {
    const a = layout.get(edge.source); const b = layout.get(edge.target);
    const forward = b.x > a.x;
    const x1 = forward ? a.x + a.width : a.x + a.width / 2;
    const y1 = forward ? a.y + a.height / 2 : a.y + a.height;
    const x2 = forward ? b.x : b.x + b.width / 2;
    const y2 = forward ? b.y + b.height / 2 : b.y;
    const bend = Math.max(45, Math.abs(x2 - x1) * .43);
    const path = forward ? `M${x1} ${y1} C${x1+bend} ${y1} ${x2-bend} ${y2} ${x2-4} ${y2}` : `M${x1} ${y1} C${x1} ${y1+30} ${x2} ${y2-30} ${x2} ${y2-4}`;
    svg.append(create("path", { d: path, class: `relation-edge ${lit.has(i) ? "illuminated" : "dim"}`, "marker-end": `url(#arrow-${lit.has(i) ? "active" : "normal"})` }));
  });
  nodes.forEach((node) => {
    const pos = layout.get(node.id);
    const state = node.id === selectedId ? "selected" : related.has(node.id) ? "related" : "dim";
    const group = create("g", { class: `graph-node ${state}${!matches.has(node.id) ? " dim" : ""}`, transform: `translate(${pos.x},${pos.y})`, tabindex: matches.has(node.id) ? 0 : -1, role: "button", "aria-label": `${node.name}，${node.filePath}，查看关系`, "aria-pressed": String(node.id === selectedId) });
    if (!matches.has(node.id)) group.style.opacity = ".08";
    group.append(create("rect", { width: pos.width, height: pos.height, rx: 6 }));
    const file = node.filePath.split("/").slice(-2).join("/");
    group.append(create("text", { x: 12, y: 23 }, node.name.length > 24 ? node.name.slice(0,23) + "…" : node.name));
    group.append(create("text", { x: 12, y: 40, class: "node-file" }, file));
    group.append(create("title", {}, `${node.name}\n${node.filePath}${node.startLine ? `:${node.startLine}` : ""}`));
    const select = () => { selectedId = node.id; renderSelection(); };
    group.addEventListener("click", select);
    group.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(); } });
    svg.append(group);
  });
  $("#graph-count").textContent = `${nodes.length} 个展示符号 / ${edges.length} 条 CALLS 边`;
}

function addRelationGroup(container, title, members, levels) {
  const group = document.createElement("div"); group.className = "relation-group";
  const heading = document.createElement("span"); heading.textContent = title; group.append(heading);
  if (!members.length) { const empty = document.createElement("p"); empty.className = "relation-empty"; empty.textContent = "该样本图中未记录"; group.append(empty); }
  members.forEach((node) => {
    const button = document.createElement("button"); button.className = "relation-item"; button.textContent = `${levels ? `L${levels.get(node.id)} · ` : ""}${node.name}`;
    const file = document.createElement("small"); file.textContent = node.filePath; button.append(file);
    button.addEventListener("click", () => { selectedId = node.id; renderSelection(); }); group.append(button);
  });
  container.append(group);
}
function renderSelection() {
  drawGraph();
  const node = byId(selectedId);
  if (!node) { $("#symbol-name").textContent = "无可用图谱"; $("#show-source").disabled = true; return; }
  $("#symbol-name").textContent = node.name;
  $("#symbol-location").textContent = node.filePath + (node.startLine ? `:${node.startLine}` : "");
  $("#show-source").disabled = false;
  const results = $("#relation-results"); results.replaceChildren();
  if (mode === "context") {
    $("#inspector-type").textContent = "SYMBOL CONTEXT";
    $("#mode-description").textContent = "从图中读取直接调用关系；点击任意相邻符号继续探索。";
    addRelationGroup(results, "调用者 / INCOMING", getIncoming(selectedId));
    addRelationGroup(results, "被调用者 / OUTGOING", getOutgoing(selectedId));
  } else if (mode === "impact") {
    $("#inspector-type").textContent = "UPSTREAM IMPACT";
    $("#mode-description").textContent = "沿已提取 CALLS 边反向展开。L1 为直接调用者，L2 为再上一层；这是一份检查范围。";
    const levels = upstreamLevels(selectedId);
    addRelationGroup(results, "潜在关联调用方", nodes.filter((item) => item.id !== selectedId && levels.has(item.id)).sort((a,b) => levels.get(a.id)-levels.get(b.id)), levels);
  } else {
    $("#inspector-type").textContent = "ENTRY → TARGET";
    $("#mode-description").textContent = "从 submitOrder 沿已提取的有向调用边，到达当前符号的一条最短路径。";
    addRelationGroup(results, "静态路径 / 非运行轨迹", findPath(named("submitOrder")?.id, selectedId).map(byId).filter(Boolean));
  }
  if (!$("#source-panel").hidden) showSource();
}
function setMode(next) {
  mode = next;
  $$("[data-mode]").forEach((button) => { button.classList.toggle("active", button.dataset.mode === mode); button.setAttribute("aria-pressed", String(button.dataset.mode === mode)); });
  if (nodes.length) renderSelection();
}
$$("[data-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
$$("[data-set-mode]").forEach((button) => button.addEventListener("click", () => { selectedId = named(button.dataset.setMode === "context" ? "checkoutOrder" : "calculateShipping")?.id || selectedId; setMode(button.dataset.setMode); }));
$("#symbol-search").addEventListener("input", (event) => { filter = event.target.value.trim().toLowerCase(); if (nodes.length) drawGraph(); });
$("#reset-graph").addEventListener("click", () => { filter = ""; $("#symbol-search").value = ""; selectedId = named("calculateShipping")?.id || nodes[0]?.id; $("#source-panel").hidden = true; setMode("context"); });
$$("[data-example]").forEach((button) => button.addEventListener("click", () => {
  filter = ""; $("#symbol-search").value = "";
  if (button.dataset.example === "shipping") { selectedId = named("calculateShipping")?.id; setMode("impact"); }
  if (button.dataset.example === "alias") { selectedId = named("estimateOrder")?.id; setMode("context"); showSource(); }
  if (button.dataset.example === "homonym") { selectedId = nodes.find((node) => node.name === "validate" && /inventory/.test(node.filePath))?.id || selectedId; setMode("context"); showSource(); }
}));

function showSource() {
  const node = byId(selectedId); if (!node) return;
  const files = Array.isArray(dataset.files) ? dataset.files : Object.entries(dataset.files || {}).map(([path,content]) => ({path,content}));
  const file = files.find((item) => (item.path || item.filePath) === node.filePath || node.filePath.endsWith(item.path || item.filePath));
  $("#source-panel").hidden = false;
  $("#source-title").textContent = node.filePath;
  const target = $("#source-code"); target.replaceChildren();
  if (!file) { target.textContent = "该源码未收录到静态记录中，请查看 src/checkout-lab。"; return; }
  const lines = String(file.content ?? file.source ?? "").split("\n");
  lines.forEach((line, i) => {
    const span = document.createElement("span"); span.className = "source-line";
    if (node.startLine && i + 1 >= Number(node.startLine) && i + 1 <= Number(node.endLine || node.startLine)) span.classList.add("target");
    const number = document.createElement("span"); number.className = "line-number"; number.textContent = String(i + 1).padStart(2," "); span.append(number, document.createTextNode(line)); target.append(span);
  });
}
$("#show-source").addEventListener("click", () => { showSource(); $("#source-panel").scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" }); });
$("#close-source").addEventListener("click", () => { $("#source-panel").hidden = true; $("#show-source").focus(); });

function renderEvidence(data) {
  const succeeded = data.status === "success" || data.status === "verified" || data.status === "completed";
  const status = succeeded ? `v${String(data.version || "1.6.12").replace(/^v/,"")} · 真实索引与查询记录 · 静态回放` : (data.statusLabel || "运行状态与限制见下方记录");
  $("#dataset-status").textContent = status;
  const runTime = data.analyzedAt ? new Date(data.analyzedAt).toLocaleString("zh-CN", {timeZone:"Asia/Shanghai",hour12:false}) + " UTC+8" : "2026-10-15";
  $("#run-caption").textContent = `v${String(data.version || "1.6.12").replace(/^v/,"")} · ${runTime}。全图含 package.json 与验证入口；交互区筛选 10 个业务函数，规模数字只描述本次样本。`;
  const metrics = data.metrics || {};
  const checks = Array.isArray(data.checks) ? data.checks : [];
  const values = [metrics.tsFiles ?? metrics.sourceFiles ?? metrics.files ?? data.files?.length ?? "—", metrics.nodes ?? metrics.nodeCount ?? "—", metrics.edges ?? metrics.relationships ?? metrics.edgeCount ?? "—", checks.length ? `${checks.filter((check) => check.passed === true).length}/${checks.length}` : "—"];
  $$("#metrics strong").forEach((element,i) => element.textContent = String(values[i]));
  const checkList = $("#checks-list"); checkList.replaceChildren();
  checks.forEach((check) => {
    const row = document.createElement("div"); row.className = "check-item";
    const mark = document.createElement("span"); mark.className = `check-mark${check.passed ? "" : " failed"}`; mark.textContent = check.passed ? "✓" : "!";
    const body = document.createElement("div"); const title = document.createElement("strong"); title.textContent = check.name || check.title;
    const detail = document.createElement("p"); detail.textContent = check.detail || check.description || ""; body.append(title,detail); row.append(mark,body); checkList.append(row);
  });
  if (!checks.length) checkList.textContent = "当前记录没有可核对的检查项。";
  const results = data.results || {};
  const select = $("#raw-select"); select.replaceChildren();
  const entries = Object.entries(results);
  if (!entries.length) entries.push(["run", data]);
  entries.forEach(([key]) => { const option = document.createElement("option"); option.value = key; option.textContent = key; select.append(option); });
  const updateRaw = () => $("#raw-output").textContent = JSON.stringify(entries.find(([key]) => key === select.value)?.[1], null, 2);
  select.addEventListener("change", updateRaw); updateRaw();
  const commands = data.commands || [];
  $("#reproduce-commands").textContent = Array.isArray(commands) ? commands.map((command) => typeof command === "string" ? command : command.command || JSON.stringify(command)).join("\n\n") : String(commands);
  const limits = $("#run-limitations"); limits.replaceChildren();
  (data.limitations || []).forEach((limitation) => { const li = document.createElement("li"); li.textContent = typeof limitation === "string" ? limitation : JSON.stringify(limitation); limits.append(li); });
  $("#evidence-readme").href = "references/run-report.md";
  if (!succeeded) $("#comparison-scope").textContent = "样本验证与运行限制见本页记录";
}

async function initialize() {
  try {
    const response = await fetch("assets/evidence.json");
    if (!response.ok) throw new Error(`记录请求失败：HTTP ${response.status}`);
    const data = await response.json();
    normalize(data); buildLayout(); renderEvidence(data); renderSelection();
    document.documentElement.dataset.ready = "true";
  } catch (error) {
    $("#dataset-status").textContent = "未能读取运行记录，请通过 HTTP 服务打开页面";
    $("#raw-output").textContent = String(error.message);
    $("#graph-count").textContent = "记录尚未载入";
    $("#symbol-name").textContent = "暂无记录";
    $("#show-source").disabled = true;
    document.documentElement.dataset.ready = "error";
  }
}
initialize();
