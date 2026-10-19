"use strict";

(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const state = { scenario: "hitch", frame: 11, mode: "events", waits: true, selected: "wait", productFilter: "all", candidate: "valid" };
  const baseFrames = [15.2, 15.5, 14.8, 15.9, 15.1, 15.4, 14.9, 15.3, 15.8, 15.0, 15.7, 15.4, 15.2, 15.6, 15.0, 15.4, 16.0, 15.3, 15.1, 15.8, 15.4, 15.2, 15.6, 15.0];
  const modes = {
    normal: {
      title: "各线程在帧预算内完成关键任务",
      note: "示意记录中，资源已就绪，主线程没有出现明显锁等待。",
      main: [{ id: "input", start: 0, end: 2, label: "Input", color: "blue" }, { id: "update", start: 2, end: 6, label: "Update", color: "blue" }, { id: "submit", start: 6, end: 8, label: "Submit", color: "blue" }],
      worker: [{ id: "decode", start: 0, end: 4, label: "Decode", color: "teal" }],
      gpu: [{ id: "gpu", start: 8, end: 14.2, label: "Render", color: "purple" }],
      locks: [{ id: "hold", start: 0, end: 1, label: "Worker", color: "hold-zone" }],
      samples: { main: [0.4, 1.3, 2.6, 3.8, 5.1, 6.2, 7.3], worker: [0.2, 0.8, 1.6, 2.3, 3.4] },
    },
    hitch: {
      title: "主线程长时间等待资源锁",
      note: "示意证据显示：主线程在 2–30 ms 等待 L1，同期资源线程持锁解压纹理。",
      main: [{ id: "input", start: 0, end: 2, label: "Input", color: "blue" }, { id: "wait", start: 2, end: 30, label: "等待锁 L1 · 28 ms", color: "striped" }, { id: "submit", start: 30, end: 34, label: "Submit", color: "blue" }],
      worker: [{ id: "prepare", start: 0, end: 4, label: "准备", color: "teal" }, { id: "decode", start: 4, end: 30, label: "DecodeTexture()", color: "teal" }],
      gpu: [{ id: "gpu-previous", start: 0, end: 7, label: "前一帧", color: "purple" }, { id: "gpu", start: 34, end: 44, label: "Render", color: "purple" }],
      locks: [{ id: "hold", start: 0, end: 30, label: "L1 由 Worker 持有", color: "hold-zone" }],
      samples: { main: [0.4, 1.5, 30.5, 31.7, 33.1], worker: [0.7, 2.4, 4.5, 6.1, 8.3, 10.7, 12.9, 15.4, 17.8, 20.2, 22.5, 24.8, 27.0, 29.1] },
    },
    proposed: {
      title: "假设已预加载资源，解压移出关键锁",
      note: "这是一种待验证的方案：主线程使用已就绪资源；解压仍在后台执行，工作量并未消失。时长不是实测收益。",
      main: [{ id: "input", start: 0, end: 2, label: "Input", color: "blue" }, { id: "update", start: 2, end: 5.5, label: "Update", color: "blue" }, { id: "submit", start: 5.5, end: 7.5, label: "Submit", color: "blue" }],
      worker: [{ id: "decode", start: 0, end: 26, label: "锁外解压 · 后台任务", color: "teal" }, { id: "commit", start: 26, end: 27, label: "提交", color: "teal" }],
      gpu: [{ id: "gpu", start: 7.5, end: 13.8, label: "Render", color: "purple" }],
      locks: [{ id: "hold", start: 26, end: 27, label: "提交", color: "hold-zone" }],
      samples: { main: [0.4, 1.4, 2.5, 3.9, 5.1, 6.0, 7.1], worker: [0.5, 2.3, 4.4, 6.5, 8.5, 10.6, 12.7, 14.9, 17.2, 19.4, 21.5, 23.6, 25.2, 26.5] },
    },
  };

  function frameValues() {
    if (state.scenario === "proposed") return baseFrames.map((_, index) => +(14.1 + (index % 5) * 0.15).toFixed(1));
    return baseFrames.map((value, index) => state.scenario === "hitch" && index === 11 ? 45 : value);
  }

  function currentKind() {
    return state.scenario === "proposed" ? "proposed" : state.scenario === "hitch" && state.frame === 11 ? "hitch" : "normal";
  }

  function setPressed(selector, attribute, value) {
    $$(selector).forEach((button) => button.setAttribute("aria-pressed", String(button.dataset[attribute] === value)));
  }

  function renderFrames() {
    const values = frameValues();
    $("#frames").innerHTML = values.map((value, index) =>
      '<button type="button" class="frame" data-frame="' + index + '" style="height:' + Math.max(10, value / 45 * 68) + 'px" aria-pressed="' + (state.frame === index) + '" aria-label="第 ' + (index + 1) + ' 帧，' + value.toFixed(1) + ' 毫秒，示意数据" title="Frame ' + (index + 1) + ' · ' + value.toFixed(1) + ' ms"></button>'
    ).join("");
    $$("#frames button").forEach((button) => button.addEventListener("click", () => {
      state.frame = Number(button.dataset.frame);
      state.selected = currentKind() === "hitch" && state.waits ? "wait" : "decode";
      renderFrames();
      renderTimeline();
    }));
  }

  function zoneMarkup(zone) {
    return '<button type="button" class="zone ' + zone.color + '" style="left:' + zone.start / 50 * 100 + '%;width:' + (zone.end - zone.start) / 50 * 100 + '%" data-zone="' + zone.id + '" aria-pressed="' + (state.selected === zone.id) + '" aria-label="' + escapeHtml(zone.label) + '，' + (zone.end - zone.start).toFixed(1) + ' 毫秒，查看证据" title="' + escapeHtml(zone.label) + ' · ' + zone.start + '–' + zone.end + ' ms">' + escapeHtml(zone.label) + "</button>";
  }

  function lane(name, subtitle, content) {
    return '<div class="time-lane"><div class="lane-name">' + name + "<small>" + subtitle + '</small></div><div class="lane-track">' + content + "</div></div>";
  }

  function renderTimeline() {
    const kind = currentKind();
    const data = modes[kind];
    $("#frame-duration").innerHTML = frameValues()[state.frame].toFixed(1) + " <small>ms</small>";
    $("#frame-label").textContent = "FRAME " + String(state.frame + 1).padStart(3, "0");
    $("#frame-summary").textContent = data.title;
    let markup = '<div class="time-ruler"><span>TIME / ms</span><div class="time-ticks"><span>0</span><span>10</span><span>20</span><span>30</span><span>40</span><span>50</span></div></div>';
    for (const [key, name, subtitle] of [["main", "Main", "主线程"], ["worker", "Worker", "资源线程"], ["gpu", "GPU", "设备区间"]]) {
      let content = "";
      if (state.mode === "samples") {
        if (key === "gpu") {
          content = '<span class="uncaptured">调用栈采样不能替代 GPU 区间接入</span>';
        } else {
          content = data.samples[key].map((time) => '<button type="button" class="sample ' + (key === "worker" ? "teal" : "") + '" style="left:' + time / 50 * 100 + '%" data-zone="' + (key === "worker" ? "decode" : "sample-main") + '" aria-label="' + name + ' 在 ' + time + ' 毫秒的调用栈样本"></button>').join("");
          if (key === "main" && kind === "hitch" && state.waits) content += zoneMarkup(data.main.find((zone) => zone.id === "wait"));
        }
      } else {
        content = data[key].map((zone) => {
          if (zone.id === "wait" && !state.waits) return '<button type="button" class="zone muted-zone" style="left:4%;width:56%" data-zone="unknown" aria-pressed="' + (state.selected === "unknown") + '">缺少等待原因记录</button>';
          return zoneMarkup(zone);
        }).join("");
      }
      markup += lane(name, subtitle, content);
    }
    if (state.waits) markup += lane("Lock L1", "锁事件", data.locks.map(zoneMarkup).join(""));
    $("#timeline").innerHTML = markup;
    $$("#timeline button").forEach((button) => button.addEventListener("click", () => {
      state.selected = button.dataset.zone;
      renderTimeline();
    }));
    let explanation = data.note;
    if (state.mode === "samples") explanation = "点表示离散调用栈样本，不代表每次函数调用的完整起止。GPU 区间没有由 CPU 采样自动生成。" + (state.waits ? "此处另外叠加已接入的锁与调度事件。" : "缺少等待事件时，主线程样本稀疏本身不能证明它在等哪把锁。");
    else if (!state.waits && kind === "hitch") explanation = "区间记录能显示资源处理很长，但缺少锁与调度事件时，不能仅凭时间重叠断言主线程在等它。";
    $("#trace-explanation").textContent = explanation + " 时间轴保留相邻后台任务上下文。";
    renderEvidence(kind);
  }

  function renderEvidence(kind) {
    const sampled = state.mode === "samples";
    const id = state.selected;
    let evidence;
    if ((id === "wait" || id === "hold") && state.waits && kind === "hitch") {
      evidence = {
        title: id === "hold" ? "同一把锁，持有者是 Worker" : "主线程在等锁",
        description: "等待、获得和释放事件关联到 L1；与资源线程的解压区间对齐后，可以继续检查锁内工作。",
        facts: [["等待区间", "2.0–30.0 ms"], ["等待时长", "28.0 ms"], ["持锁线程", "Worker"], ["证据类型", "锁事件 + 时间轴"]],
        file: "resource_loader.cpp:48",
        code: "lock(resourceMutex);\nuseReadyResource();",
        next: "检查解压是否必须持锁；评估预加载或缩小临界区，修改后验证相同业务结果。",
      };
    } else if (id === "unknown") {
      evidence = {
        title: "看见空白，还不能解释空白",
        description: "当前没有记录完整等待原因。另一线程很忙与主线程发生延迟，只能形成线索，不能直接证明因果。",
        facts: [["已有信息", "区间起止 / 部分执行记录"], ["缺少信息", "锁身份、持有关系或调度原因"], ["继续定位", "补充事件或等待栈"]],
        file: "未记录",
        code: "// 当前证据不足",
        next: "启用锁与系统调度采集，或在可疑同步路径增加少量埋点。",
      };
    } else if (id === "sample-main") {
      evidence = {
        title: "采样看到调用路径",
        description: "一个样本表示这个时刻获取到的执行位置和调用栈，不表示整次函数调用的持续时间。",
        facts: [["样本上下文", "Main → LoadModel → Submit"], ["位置来源", "执行地址 + 调试符号"], ["限制", "可能漏过短暂调用"]],
        file: "render_submit.cpp:76",
        code: "Main → LoadModel\n     → Submit",
        next: "汇总热点，结合线程调度或关键区间计时，继续检查这一次延迟。",
      };
    } else if (id === "gpu" || id === "gpu-previous") {
      evidence = {
        title: "GPU 区间需要单独采集",
        description: "这里的设备任务是已接入 GPU 时间查询后的区间示意；CPU 调用提交函数的时长不等于 GPU 执行时长。",
        facts: [["区间", id === "gpu-previous" ? "相邻前一帧" : "当前帧 Render"], ["证据类型", "GPU 时间戳"], ["接入条件", "对应图形 / 计算 API"]],
        file: "renderer.cpp:120",
        code: '// GPU zone: "Render"',
        next: "对照 CPU 提交与 GPU 执行，确认瓶颈，再用适合设备的分析器深入。",
      };
    } else if (id === "input" || id === "update" || id === "submit" || id === "prepare" || id === "commit") {
      const zone = [...modes[kind].main, ...modes[kind].worker].find((item) => item.id === id);
      evidence = {
        title: "区间告诉你“这一次多久”",
        description: "进入作用域记录 ZoneBegin，离开时记录 ZoneEnd。源码位置由埋点携带，不需要每次抓完整调用栈。",
        facts: [["区间", zone?.label || id], ["耗时", zone ? (zone.end - zone.start).toFixed(1) + " ms" : "示意"], ["证据类型", "开始 / 结束事件"], ["源码含义", "埋点定义位置"]],
        file: "application.cpp:32",
        code: 'ZoneScopedN("' + (zone?.label || id) + '");',
        next: "若区间仍太大，可在内部步骤继续埋点，或结合采样寻找更细的热点。",
      };
    } else if (id === "hold") {
      evidence = {
        title: kind === "proposed" ? "只在提交时短暂持锁" : "锁记录没有明显长等待",
        description: kind === "proposed" ? "假设解压在锁外完成，仅在共享状态提交时持锁。后台解压仍占用计算资源。" : "在这个合成片段里，共享资源很快释放，主线程没有长时间等待。",
        facts: [["证据类型", "锁等待 / 获得 / 释放"], ["方案状态", kind === "proposed" ? "待实测的设计推演" : "机制示意"], ["仍需验证", "并发正确性与资源时序"]],
        file: "resource_cache.cpp:92",
        code: "decodeOutsideLock();\ncommitUnderLock();",
        next: "验证资源生命周期、并发访问和完整场景性能，不能只看单帧数字。",
      };
    } else {
      evidence = {
        title: sampled ? "采样把热点缩小到解压路径" : kind === "proposed" ? "解压仍在后台继续" : "资源处理区间可继续细查",
        description: sampled ? "反复采到 DecodeTexture 所在调用路径，说明它可能是 CPU 热点；这不是单次耗时的精确测量。" : kind === "proposed" ? "方案通过预加载和调整同步范围缩短关键路径，不代表解压工作量消失，也不是测得的优化增益。" : "关键埋点记录了解压区间。是否影响主线程，要再结合锁、调度或业务依赖证据。",
        facts: [["线程", "Worker"], ["调用路径", "LoadResource → DecodeTexture"], ["记录方式", sampled ? "离散调用栈样本" : "区间起止事件"], ["作用范围", "合成示意任务"]],
        file: "texture_decoder.cpp:64",
        code: sampled ? "Worker → LoadResource\n       → DecodeTexture" : 'ZoneScopedN("DecodeTexture");',
        next: sampled ? "阅读热点源码，在需要精确追踪的位置补少量埋点，再复现相同场景。" : "继续检查算法、拷贝与分配；每次只做可验证的改动。",
      };
    }
    $("#evidence-title").textContent = evidence.title;
    $("#evidence-description").textContent = evidence.description;
    $("#evidence-facts").innerHTML = evidence.facts.map(([key, value]) => "<dt>" + escapeHtml(key) + "</dt><dd>" + escapeHtml(value) + "</dd>").join("");
    $("#evidence-file").textContent = evidence.file;
    $("#evidence-code").textContent = evidence.code;
    $("#evidence-next").textContent = evidence.next;
  }

  $$("[data-scenario]").forEach((button) => button.addEventListener("click", () => {
    state.scenario = button.dataset.scenario;
    state.frame = state.scenario === "normal" ? 4 : 11;
    state.selected = state.scenario === "hitch" && state.waits ? "wait" : "decode";
    setPressed("[data-scenario]", "scenario", state.scenario);
    renderFrames();
    renderTimeline();
  }));
  $$("[data-mode]").forEach((button) => button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    state.selected = state.mode === "samples" ? "decode" : currentKind() === "hitch" && state.waits ? "wait" : "decode";
    setPressed("[data-mode]", "mode", state.mode);
    renderTimeline();
  }));
  $("#wait-events").addEventListener("change", (event) => {
    state.waits = event.target.checked;
    state.selected = currentKind() === "hitch" ? state.waits ? "wait" : state.mode === "events" ? "unknown" : "decode" : "decode";
    renderTimeline();
  });

  const principles = {
    sampling: {
      title: "定时获取调用栈，统计执行热点。",
      text: "系统周期性获取目标线程的执行位置和调用栈，再通过符号信息映射到函数或源码。某条调用路径经常出现在样本中，说明它可能消耗较多 CPU 时间。",
      steps: [["系统采样", "指令地址 / 调用栈"], ["符号解析", "函数 / 文件 / 行"], ["统计热点", "引导下一步检查"]],
      code: "Main → LoadModel → DecodeTexture\n             ↑ 多次出现在样本中",
      limit: "得到的是统计线索，不是每次调用的完整起止。Tracy 的自动采样支持和权限依平台而异；源码映射还依赖调试符号。",
      link: "https://github.com/wolfpld/tracy/blob/master/manual/tracy.tex#L2690",
      linkText: "官方手册：调用栈采样与平台矩阵",
    },
    zones: {
      title: "用作用域的生命周期，记录一次耗时。",
      text: "ZoneScoped 宏创建局部对象。构造时写入开始事件与源码位置，析构时写入结束事件。分析器根据事件和线程上下文重建区间；调用栈采集可另外选择。",
      steps: [["进入作用域", "ZoneBegin + 时间"], ["执行业务代码", "嵌套区间可细分"], ["离开作用域", "ZoneEnd + 时间"]],
      code: "void DecodeTexture() {\n    ZoneScoped;\n    // 原有业务实现……\n}",
      limit: "埋点行号是区间定义位置。只标记整个函数，并不能直接证明内部某一行最慢；区间时长也可能包含等待。",
      link: "https://github.com/wolfpld/tracy/blob/master/public/client/TracyScoped.hpp",
      linkText: "源码：ScopedZone 的构造与析构",
    },
    waits: {
      title: "把等待与持有关系，放回时间轴。",
      text: "系统调度记录说明线程何时实际运行或被切出。已接入的锁事件记录等待、获得和释放，可关联锁与线程，帮助解释一个长区间为什么长。",
      steps: [["记录线程状态", "运行 / 暂停"], ["记录锁事件", "等待 / 获得 / 释放"], ["时间关联", "检查持锁与关键路径"]],
      code: "Main:   wait(L1) ─────────→ acquired\nWorker: hold(L1) + decode → release",
      limit: "另一线程很忙，并不足以证明它是等待原因。需要锁事件、等待栈或业务依赖证据；未接入的锁关系不能自动恢复。",
      link: "https://github.com/wolfpld/tracy/blob/master/manual/tracy.tex#L1368",
      linkText: "官方手册：锁标记与系统调度采集",
    },
    memory: {
      title: "跟踪分配与释放，而不只是看内存百分比。",
      text: "程序上报分配地址、大小、时间以及释放事件；需要时关联调用栈。分析器据此展示已追踪分配的存活情况、分配热点与内存变化。",
      steps: [["分配事件", "地址 + 大小 + 时间"], ["来源关联", "可选调用栈"], ["释放事件", "配对并统计存活"]],
      code: "alloc(ptr, 4 MiB) → allocation stack\nfree(ptr)        → lifetime ends",
      limit: "要接入分配器等采集点。未上报的库分配和系统内存不一定包含在统计里，不能把这条曲线直接视为完整进程 RSS。",
      link: "https://github.com/wolfpld/tracy/blob/master/manual/tracy.tex#L1463",
      linkText: "官方手册：内存事件与接入要求",
    },
  };

  function renderPrinciple(key, focus = false) {
    const data = principles[key];
    $$("[data-principle]").forEach((button) => {
      const active = button.dataset.principle === key;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focus) button.focus();
    });
    const panel = $("#principle-content");
    panel.setAttribute("aria-labelledby", "tab-" + key);
    panel.innerHTML = "<h3>" + data.title + "</h3><p>" + data.text + '</p><div class="mechanism-flow">' + data.steps.map(([title, text]) => "<div><b>" + title + "</b>" + text + "</div>").join("<i aria-hidden='true'>→</i>") + '</div><div class="principle-code">' + escapeHtml(data.code) + '</div><div class="mechanism-limit">' + data.limit + '</div><a class="mechanism-source" href="' + data.link + '" target="_blank" rel="noreferrer">' + data.linkText + " ↗</a>";
    pinSourceLinks();
  }
  $$("[data-principle]").forEach((button, index, buttons) => {
    button.addEventListener("click", () => renderPrinciple(button.dataset.principle));
    button.addEventListener("keydown", (event) => {
      let target = index;
      if (["ArrowRight", "ArrowDown"].includes(event.key)) target = (index + 1) % buttons.length;
      else if (["ArrowLeft", "ArrowUp"].includes(event.key)) target = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === "Home") target = 0;
      else if (event.key === "End") target = buttons.length - 1;
      else return;
      event.preventDefault();
      renderPrinciple(buttons[target].dataset.principle, true);
    });
  });

  const products = window.PRODUCT_RESEARCH?.products || [];
  const stageLabels = { measure: "测试与验收", diagnose: "采集与定位", optimize: "AI 优化工作流" };

  function renderProducts() {
    const query = $("#product-search").value.trim().toLocaleLowerCase();
    const focus = $("#product-focus").value.toLocaleLowerCase();
    const selected = products.filter((product) => (state.productFilter === "all" || product.stage === state.productFilter) && (!query || [product.name, product.meta, product.output, product.access, product.difference, product.limit, product.keywords].join(" ").toLocaleLowerCase().includes(query)) && (!focus || [product.meta, product.output, product.keywords].join(" ").toLocaleLowerCase().includes(focus)));
    $("#product-rows").innerHTML = selected.length ? selected.map((product) => '<tr><td><a href="' + escapeHtml(product.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(product.name) + ' ↗</a><small>' + escapeHtml(product.meta) + '</small></td><td><span class="layer-badge ' + product.stage + '">' + stageLabels[product.stage] + '</span></td><td>' + escapeHtml(product.output) + '<small class="product-difference">差异：' + escapeHtml(product.difference) + '</small></td><td>' + escapeHtml(product.access) + '</td><td>' + escapeHtml(product.limit) + '</td></tr>').join("") : '<tr><td colspan="5" class="empty-result">没有匹配项目，请更换关键词、场景或选择“全部”。</td></tr>';
    $("#filter-result").textContent = "显示 " + selected.length + " / " + products.length + " 项。产品与开源工作流分别标注；资料支持不等于已在本机验证兼容。";
  }
  $$("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    state.productFilter = button.dataset.filter;
    setPressed("[data-filter]", "filter", state.productFilter);
    renderProducts();
  }));
  $("#product-search").addEventListener("input", renderProducts);
  $("#product-focus").addEventListener("change", renderProducts);

  const candidates = {
    valid: { times: [86, 88, 87, 89, 85], correct: true },
    slower: { times: [118, 121, 119, 120, 122], correct: true },
    wrong: { times: [30, 31, 29, 30, 30], correct: false },
  };
  function renderGate() {
    const candidate = candidates[state.candidate];
    const mean = candidate.times.reduce((sum, value) => sum + value, 0) / candidate.times.length;
    const delta = mean - 100;
    const threshold = Number($("#threshold").value);
    const accepted = candidate.correct && delta <= threshold;
    $("#threshold-value").value = threshold + "%";
    $("#threshold-value").textContent = threshold + "%";
    $("#candidate-time").innerHTML = mean.toFixed(0) + " <small>ms</small>";
    $("#candidate-delta").textContent = (delta > 0 ? "+" : delta < 0 ? "−" : "") + Math.abs(delta).toFixed(0) + "%";
    $("#candidate-delta").style.color = delta > threshold ? "#e3b39e" : "#a7d3c7";
    const status = $("#gate-status");
    status.classList.toggle("fail", !accepted);
    let title, detail;
    if (!candidate.correct) {
      title = "拒绝候选：正确性未通过";
      detail = "即使耗时更短，也不能用错误结果换取速度。";
    } else if (!accepted) {
      title = "拒绝候选：性能超过当前阈值";
      detail = "结果正确，但耗时增加 " + delta.toFixed(0) + "%，超过允许的 " + threshold + "%。";
    } else {
      title = delta > 0 ? "当前规则允许：候选仍比基线慢" : "接受候选：两道检查均通过";
      detail = delta > 0 ? "阈值决定允许的退化范围；通过不代表变快，应按产品目标解释。" : "合成记录中结果正确，耗时也在预算内。实际效果仍以真实复测为准。";
    }
    status.innerHTML = "<span aria-hidden='true'>" + (accepted ? "✓" : "×") + "</span><div><b>" + title + "</b><small>" + detail + "</small></div>";
    $("#gate-data").textContent = "基线样本 [101, 100, 99, 102, 98] ms · 候选样本 [" + candidate.times.join(", ") + "] ms · 业务结果 " + (candidate.correct ? "PASS" : "FAIL") + " · 预设数据";
  }
  $$("[data-candidate]").forEach((button) => button.addEventListener("click", () => {
    state.candidate = button.dataset.candidate;
    setPressed("[data-candidate]", "candidate", state.candidate);
    renderGate();
  }));
  $("#threshold").addEventListener("input", renderGate);

  function pinSourceLinks() {
    const tracy = window.UPSTREAM_RESEARCH?.repositories.find((item) => item.key === "tracy");
    if (!tracy || !/^[a-f0-9]{40}$/.test(tracy.commit || "")) return;
    $$('a[href*="github.com/wolfpld/tracy/blob/master/"],a[href*="github.com/wolfpld/tracy/tree/master/"]').forEach((link) => {
      link.href = link.href.replace("/master/", "/" + tracy.commit + "/");
    });
  }

  function renderProvenance() {
    const data = window.UPSTREAM_RESEARCH;
    if (!data) return;
    const trustedRepositories = { tracy: "wolfpld/tracy", "profiler-md": "TomerAberbach/profiler-md", agr: "JoaquinMulet/Artificial-General-Research", paracodex: "Scientific-Computing-Lab/ParaCodex", atrex: "alibaba/atrex-kernel-agent" };
    const snapshots = data.repositories.filter((item) => trustedRepositories[item.key] && /^[a-f0-9]{40}$/.test(item.commit || "")).map((item) => '<a href="https://github.com/' + trustedRepositories[item.key] + "/tree/" + item.commit + '" target="_blank" rel="noreferrer">' + escapeHtml(item.key) + "@" + item.commit.slice(0, 8) + "</a>");
    const tracy = data.repositories.find((item) => item.key === "tracy");
    $("#upstream-record").innerHTML = "<b>固定查阅快照</b>　" + snapshots.join(" · ") + (tracy?.release ? "<br>Tracy 查阅时最新发布标签：" + escapeHtml(tracy.release) + "；主分支能力与发布版请分别核对。" : "") + "<br>快照记录只说明资料查阅版本，不代表上游运行或性能结果已验证。";
    pinSourceLinks();
  }

  const mapDialog = $("#map-dialog");
  let previousBodyOverflow = "";
  $("#open-map").addEventListener("click", () => {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    mapDialog.showModal();
    $("#close-map").focus();
  });
  $("#close-map").addEventListener("click", () => mapDialog.close());
  mapDialog.addEventListener("close", () => {
    document.body.style.overflow = previousBodyOverflow;
    $("#open-map").focus({ preventScroll: true });
  });
  $("#map-size").addEventListener("click", () => {
    const scroller = $(".map-dialog-scroll");
    const image = $("#full-map");
    const relativeTop = scroller.scrollTop / Math.max(1, image.clientHeight);
    const original = image.classList.toggle("original-size");
    $("#map-size").setAttribute("aria-pressed", String(original));
    $("#map-size").textContent = original ? "适应宽度" : "原始尺寸";
    scroller.scrollTop = relativeTop * image.clientHeight;
    if (!original) scroller.scrollLeft = 0;
  });

  let scrollPending = false;
  const sectionLinks = $$(".section-nav a");
  const sections = sectionLinks.map((link) => $(link.getAttribute("href")));
  function updateNavigation() {
    let active = sections[0]?.id;
    for (const section of sections) if (section && section.getBoundingClientRect().top <= 150) active = section.id;
    sectionLinks.forEach((link) => {
      const selected = link.getAttribute("href") === "#" + active;
      link.classList.toggle("active", selected);
      if (selected) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    scrollPending = false;
  }
  window.addEventListener("scroll", () => {
    if (!scrollPending) {
      scrollPending = true;
      window.requestAnimationFrame(updateNavigation);
    }
  }, { passive: true });

  renderFrames();
  renderTimeline();
  renderPrinciple("sampling");
  renderProducts();
  renderGate();
  renderProvenance();
  updateNavigation();
})();
