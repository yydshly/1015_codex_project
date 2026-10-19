/* Static research presentation. Prices and evidence are dated snapshots. */
"use strict";
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const data = window.RESEARCH_DATA;
  if (!data) { $("#scopePanel").textContent = "研究资料未加载，请重新运行 tools/prepare_web.py。"; return; }
  const demoFrame=$("#liveDemoFrame"), demoLoad=$("#loadLiveDemo"), demoStop=$("#stopLiveDemo"), demoOpen=$("#openLiveDemo");
  const isLocal=["127.0.0.1","localhost"].includes(location.hostname)&&location.protocol==="http:";
  if(!isLocal){
    demoLoad.textContent="查看本地演示运行说明";
    $("#live-demo .section-heading h2").innerHTML="我们做过的演示，<br>有画面，也有实测记录。";
    $("#live-demo .section-heading>p").innerHTML="公开研究页保留播放证据与实现说明。<br>在本地启动联合服务后，可实时搜片、选集和播放。";
    $("#liveDemoStatus").textContent="当前为公开研究页；实时搜播需运行本机后端。";
    $("#liveDemoInstructions").hidden=false;
    $(".hero-actions a[href='#live-demo']").textContent="查看演示与运行方式 ↗";
  }
  demoLoad.addEventListener("click",async()=>{
    if(!isLocal){openDocument("demo");return;}
    demoLoad.disabled=true;$("#liveDemoStatus").textContent="正在连接本地 007 服务…";
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),6000);
    try{
      const response=await fetch("/api/research-demo",{signal:controller.signal,cache:"no-store"});
      if(!response.ok)throw Error("service missing");
      const info=await response.json();
      if(info.application!=="zhuiju-research-with-007"||info.version!==1)throw Error("service mismatch");
      demoFrame.src="/live-demo/";demoFrame.hidden=false;$("#liveDemoLaunch").hidden=true;
      demoStop.hidden=false;demoOpen.hidden=false;$("#liveDemoInstructions").hidden=true;
      $("#liveDemoStatus").textContent="007 已接入；搜索结果、集数与媒体状态会显示在下方。";
    }catch(error){$("#liveDemoStatus").textContent="没有连接到联合演示服务。请按下方命令启动；静态 HTTP 服务不提供播放接口。";$("#liveDemoInstructions").hidden=false;}
    finally{clearTimeout(timeout);demoLoad.disabled=false;}
  });
  demoStop.addEventListener("click",()=>{demoFrame.removeAttribute("src");demoFrame.hidden=true;$("#liveDemoLaunch").hidden=false;demoStop.hidden=true;demoOpen.hidden=true;$("#liveDemoStatus").textContent="演示已关闭，媒体请求已停止。";demoLoad.focus();});
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const scopes = {
    upstream: {label:"UPSTREAM / 资源情报与维护", title:"可追溯的资源导航与社区维护流程", text:"119 条结构化资源记录，经脚本生成目录。定时 HTTP 检查、问题反馈和维护者审核，让入口的发现与维护可以持续。上游代码和目录采用 CC BY 4.0；影片需独立核实许可。", features:[["分类与筛选","9 类资源、状态、标签与评分"],["检测与更新","定时探测入口的 HTTP 响应"],["社区提交","Issue → 审核 → 数据与目录更新"]]},
    demo: {label:"OUR EXPERIMENT / 007 历史实测",title:"把发现的接口，接成站内搜片与选集播放",text:"从 TVBox 配置里发现 HTTP API，适配搜索和详情，再让浏览器加载上游 HLS。2026.10.15 抽样首两集，取得 1080p 解码和实际播放证据；这条实验链路的商业使用权仍未确认。",features:[["搜索与详情","字段映射、播放线路和剧集解析"],["媒体验证","HLS 清单、分片、ffprobe 与 CORS"],["浏览器播放","首两集有播放时间，保留截图与日志"]]},
    product: {label:"NEXT / 尚待验证的产品",title:"把一次可播放，变成可经营的观看服务",text:"完整产品还需要内容授权、稳定供应、地域与期限管理、生产分发、成本控制，以及用户和收入验证。当前建议从动画短片精选与原创专题起步，再考虑采购更大的片库。",features:[["内容供应","逐片许可与合同，明确可用范围"],["生产能力","存储、转码、CDN 与质量监控"],["经营验证","复访、有效观看、真实付费与利润"]]}
  };
  function renderScope(key) {
    const s=scopes[key];
    $("#scopePanel").innerHTML=`<div class="panel-kicker">${s.label}</div><h3>${s.title}</h3><p>${s.text}</p><div class="scope-features">${s.features.map(f=>`<div><b>${f[0]}</b><span>${f[1]}</span></div>`).join("")}</div>`;
    $("#scopePanel").setAttribute("aria-labelledby",`scope-${key}`);
  }
  function bindChoice(attribute, callback, tabs=false) {
    const buttons=$$(`[data-${attribute}]`);
    const activate=button=>{
      for(const item of buttons){const on=item===button;item.classList.toggle("selected",on);item.setAttribute(tabs?"aria-selected":"aria-pressed",String(on));if(tabs)item.tabIndex=on?0:-1;}
      callback(button.dataset[attribute]);
    };
    buttons.forEach(button=>{
      button.addEventListener("click",()=>activate(button));
      if(tabs)button.addEventListener("keydown",event=>{
        const i=buttons.indexOf(button);let next;
        if(event.key==="ArrowRight"||event.key==="ArrowDown")next=(i+1)%buttons.length;
        if(event.key==="ArrowLeft"||event.key==="ArrowUp")next=(i-1+buttons.length)%buttons.length;
        if(event.key==="Home")next=0;if(event.key==="End")next=buttons.length-1;
        if(next!==undefined){event.preventDefault();activate(buttons[next]);buttons[next].focus();}
      });
    });
    activate(buttons[0]);
  }
  bindChoice("scope",renderScope,true);
  const steps=[
    ["从目录里找到配置线索","原库的 tvbox_config 分类提供配置入口。在探索记录中共读取 17 份配置，进一步对其中发现的 HTTP API 发出 26 次请求。请求次数不能直接理解成独立片源数。","入口：resources/resources.json → 小马 TVBox 配置"],
    ["只解析 JSON，提取 HTTP API","读取小马配置中的 sites[]，筛出可识别的 HTTP API。暴風对应 type: 1，并带有苹果 CMS 风格的 provide/vod 路径。实验没有执行远程 Spider 代码。","https://szyyds.cn/tv/x.json → bfzyapi.com"],
    ["验证搜索、详情和选集数据","用 ac=detail&wd=关键词&pg=1 搜索，以 ac=detail&ids=编号读取详情。解析 vod_play_from 与 vod_play_url，得到播放线路和剧集地址；/api/play 是我们自己的适配层。","metadata ID 168380 / 上游返回 8 集"],
    ["让浏览器真正解码并前进","HLS 清单和样本分片可读取，ffprobe 识别 H.264、AAC、1920×1080。浏览器首两集分别记录到约 31.55 秒和 14.06 秒的播放时间，保留网络与截图证据。","2026.10.15 / 只做播放抽样，未验证持续可用性"]
  ];
  bindChoice("step",key=>{const s=steps[Number(key)];$("#experimentDetail").innerHTML=`<p class="panel-kicker">EXPERIMENT 0${Number(key)+1}</p><h3>${s[0]}</h3><p>${s[1]}</p><p><code>${s[2]}</code></p>`;});
  const nodes=[
    ["它给的是入口", "固定版本有 119 条记录，涵盖在线影视、TVBox 配置、播放器等。维护者和社区整理网站与工具，目录本身没有存储这些影视媒体。", "resources/resources.json → tvbox_config → 小马"],
    ["配置描述如何接入", "小马 JSON 的 sites[] 包含站点名、type、api 等字段。我们选取可以直接理解的 HTTP API；远程爬虫扩展可能另有执行逻辑，这次没有加载它。", "https://szyyds.cn/tv/x.json → sites[]"],
    ["接口返回元数据与剧集地址", "暴風 API 兼容常见 provide/vod 数据格式。搜索、详情由后端做字段适配，播放链接从详情数据解析获得。公开 HTTP 响应没有说明影片传播授权。", "https://bfzyapi.com/api.php/provide/vod/"],
    ["真正的字节来自媒体 CDN", "详情里的 HLS 链接指向另一域名。播放器读取 .m3u8 后继续请求媒体分片，再由浏览器解码。这层可能受签名、Referer、地域、跨域、有效期或限速影响。", "v.fengbao14.com / … / index.m3u8 → 媒体分片"]
  ];
  bindChoice("node",key=>{const n=nodes[Number(key)];$("#nodeDetail").innerHTML=`<h3>${n[0]}</h3><div><p>${n[1]}</p><code>${n[2]}</code></div>`;});
  const box=(title,sub,highlight=false)=>`<div class="flow-box${highlight?" highlight":""}"><b>${title}</b><small>${sub}</small></div>`;
  const arrow=label=>`<div class="flow-arrow"><small>${label}</small><span aria-hidden="true">→</span></div>`;
  const traffic={
    direct:{diagram:box("上游媒体 CDN","第三方负责存储与分发",true)+arrow("媒体字节")+box("用户浏览器","HLS / 分片直接加载"),aside:"我们的后端只适配搜索、详情与播放地址。007 正常页面采用此路径。",text:"<b>视频流量主要由上游承担。</b> 自己仍支付页面和元数据服务成本。上游并未为本项目给出商用授权、流量额度或可用性承诺；技术可连通，只是实验结果。"},
    relay:{diagram:box("上游媒体 CDN","提供原始媒体")+arrow("拉取")+box("我们的后端","代取媒体并向外转发",true)+arrow("媒体字节")+box("用户浏览器","从我们的域名取视频"),aside:"这是路径说明。007 有受限的 token 中继能力，正常页面未启用它。",text:"<b>我们的出口带宽、请求和连接成本会随观看增长。</b> 上游仍可能计量流量；重复拉取与跨云传输也可能收费。转发不会自动获得再分发许可。"},
    owned:{diagram:box("获准使用的文件","交付与上传")+arrow("转码 / 存储")+box("自选视频 CDN","我们采购分发服务",true)+arrow("媒体字节")+box("用户浏览器","按授权范围观看"),aside:"以授权文件交付为例。存储、转码、分发与地域控制按合同及服务配置承担。",text:"<b>可规划自己的成本与观看体验。</b> 内容方交付原片后，接收存储、CDN、报表与下架通常需要渠道安排。选择托管视频平台可减少工程工作；不同地区的实际播放表现仍需测量。"}
  };
  bindChoice("traffic",key=>{$("#trafficCanvas").innerHTML=`<div class="flow-row">${traffic[key].diagram}</div><p class="flow-aside">${traffic[key].aside}</p>`;$("#trafficCaption").innerHTML=traffic[key].text;});
  const supplies=[
    {kind:"licensed",name:"Blender 开放电影",tag:"具体作品 / 开放许可",what:"Big Buck Bunny、Sintel 等动画短片",rule:"核实具体版本许可；这些作品可按 CC BY 3.0 商用与再分发，保留完整署名。Logo 等另有条件，不能一概套用于所有 Blender 作品。",use:"动画精选起步，文件自行分发"},
    {kind:"licensed",name:"Wikimedia Commons",tag:"逐文件核查",what:"开放许可或公有领域视频",rule:"检查每个文件的来源、署名及许可，不把上传声明当绝对保证。公共站点不应视为承诺长期容量的视频 CDN。",use:"历史 / 文化专题"},
    {kind:"embed",name:"YouTube 官方嵌入",tag:"平台播放器",what:"允许嵌入的公开视频",rule:"保留官方播放器与品牌规则；商业网站需有独立价值。不得向用户收取观看嵌入内容本身的费用；API 搜索配额与视频流量不同。",use:"原创策展、解析与专题"},
    {kind:"licensed",name:"Pexels",tag:"素材 / 非整片片库",what:"短视频素材与 API",rule:"API 默认 200 次/小时、20,000 次/月。许可不允许把素材单独重新分发，或克隆核心图库服务。",use:"原创剪辑与专题配图"},
    {kind:"licensed",name:"Pixabay",tag:"素材 / 非整片片库",what:"短视频素材与 API",rule:"API 默认 100 次/分钟、结果缓存 24 小时；视频可嵌入不代表可以独立再分发或搭建素材克隆站。",use:"原创作品的素材补充"},
    {kind:"contract",name:"Filmhub",tag:"渠道合作 / 需协议",what:"独立电影、节目与交付素材",rule:"片库、地区、窗口、分成、预付款和最低要求以渠道合同为准。标准流程是交付文件；小团队是否获批尚待书面答复。",use:"验证需求后采购片库"},
    {kind:"unknown",name:"配置发现的暴風 API",tag:"007 实验来源 / 权利未确认",what:"搜索、详情与 HLS 播放链接",rule:"仅有历史技术抽样证据。未取得授权、服务协议、商用条件或明确流量上限；不能据此承诺生产服务。",use:"理解协议与适配过程"}
  ];
  bindChoice("filter",key=>{$("#sourceRows").innerHTML=supplies.filter(s=>key==="all"||s.kind===key).map(s=>`<tr><td><b>${s.name}</b><small>${s.tag}</small></td><td>${s.what}</td><td>${s.rule}</td><td>${s.use}</td></tr>`).join("");});
  const form=$("#costForm");
  const number = n => new Intl.NumberFormat("zh-CN",{maximumFractionDigits:2}).format(n);
  const money = n => `$${(Math.round((n+Number.EPSILON)*100)/100).toFixed(2)}`;
  function calculateCost(){
    const inputs=$$("input",form);const invalid=inputs.find(input=>!input.validity.valid||!Number.isFinite(input.valueAsNumber));
    $(".cost-results").classList.toggle("invalid",Boolean(invalid));
    if(invalid){["trafficValue","bunnyCost","cfCost"].forEach(id=>{$(`#${id}`).textContent="—";});$("#costEquation").textContent="请补全有效的观看情景。";$("#costFeedback").textContent="请输入允许范围内的数字；观看次数需为整数，额外传输系数至少为 1。";$("#bunnyBar").style.width="0%";$("#cfBar").style.width="0%";return;}
    const v=Object.fromEntries(inputs.map(input=>[input.id,input.valueAsNumber]));const rate=Number($("#region").value);
    const delivered=v.plays*v.minutes*v.overhead,gb=delivered*60*v.mbps/8000;
    const bunny=Math.max(1,v.storage*.01+gb*rate),cf=Math.ceil(v.catalog/1000)*5+delivered/1000;
    const volumeOverflow=rate===.005&&gb>500000;const maximum=Math.max(volumeOverflow?0:bunny,cf,1);
    $("#trafficValue").textContent=number(gb);$("#costEquation").textContent=`${number(v.plays)} 次 × ${number(v.minutes)} 分钟 × ${number(v.mbps)} Mbps × ${number(v.overhead)}`;
    $("#bunnyCost").textContent=volumeOverflow?"需按阶梯询价":money(bunny);$("#cfCost").textContent=money(cf);
    $("#bunnyBar").style.width=volumeOverflow?"0%":`${bunny/maximum*100}%`;$("#cfBar").style.width=`${cf/maximum*100}%`;
    $("#costFeedback").textContent=volumeOverflow?"已超过 Volume 首 500 TB 示例适用范围，停止外推该档单价。Cloudflare 仍按本页快照计算。":"含假设存储与最低消费，未含内容授权、网站、支付、营销、人力及可选功能。存储假设单一默认地区。";
  }
  form.addEventListener("input",calculateCost);form.addEventListener("change",calculateCost);form.addEventListener("submit",event=>event.preventDefault());
  form.addEventListener("reset",event=>{
    event.preventDefault();
    $$("input",form).forEach(input=>{input.value=input.defaultValue;});
    $("#region").value=$("#region").options[0].value;
    calculateCost();
  });
  calculateCost();
  const routes={
    curated:["动画短片精选＋原创解析","从少量已核实许可的作品开始，做中文导览、主题片单、创作背景与观看笔记。用编辑体验吸引复访，再邀请作者做小规模授权合作。","如何验证收益？","测试<b>原创解析、课程、社区服务或明确的专题赞助</b>；先核实各内容许可与平台条款，定义收费项。每周观察有效观看、收藏、复访和真实支付，同时扣除内容、支付、分发与获客成本。"],
    directory:["维护垂直、可信的资源目录","沿用上游的分类、审核和检测方法，围绕一个细分受众做精选导航。为每条资源补上访问条件、语言、地区、许可说明和核查日期。","如何验证收益？","可试验<b>专题赞助、维护服务或信息服务</b>。赞助必须清楚标识，不能用付费排名冒充独立评价。持续更新的价值，要通过复访、有效跳转或客户付款证明。"],
    catalog:["签约片库＋自有观看服务","在明确受众和收入证据后，申请 Filmhub 等渠道合作。按目标地区选片，接收交付文件，建立权限、播放分发、下架、结算和报表能力。","如何验证收益？","先争取<b>小片单、短周期、非独家试点</b>。合同明确 AVOD / SVOD / TVOD、分成基数与费用后再测算。广告展示没有填充时，视频流量仍会消耗成本。"]
  };
  bindChoice("route",key=>{const r=routes[key];$("#routePanel").innerHTML=`<div><h3>${r[0]}</h3><p>${r[1]}</p></div><div><h3>${r[2]}</h3><p>${r[3]}</p></div>`;$("#routePanel").setAttribute("aria-labelledby",`route-${key}`);},true);
  const docs=Object.entries(data.documents);$("#documentLinks").innerHTML=docs.map(([key,doc],i)=>`<button class="document-link" data-doc="${key}"><span>${String(i+1).padStart(2,"0")}</span><b>${escape(doc.title)}</b><i aria-hidden="true">↗</i></button>`).join("");
  $("#docSelect").innerHTML=docs.map(([key,doc])=>`<option value="${key}">${escape(doc.title)}</option>`).join("");
  const reader=$("#readerDialog");let priorHash="#library",priorFocus=null;
  function loadDocument(key){
    const doc=data.documents[key];if(!doc)return;
    $("#readerTitle").textContent=doc.title;$("#docSelect").value=key;$("#readerContent").innerHTML=doc.html;
    $$("table",$("#readerContent")).forEach(table=>{const wrapper=document.createElement("div");wrapper.className="doc-table-scroll";table.replaceWith(wrapper);wrapper.append(table);});
    $("#readerContent").scrollTop=0;
    if(!reader.open){priorFocus=document.activeElement;reader.showModal();$("#docSelect").focus();}
  }
  function openDocument(key){if(!data.documents[key])return;if(!location.hash.startsWith("#read/"))priorHash=location.hash||"#library";history.replaceState(null,"",`#read/${key}`);loadDocument(key);}
  document.addEventListener("click",event=>{const trigger=event.target.closest("[data-doc]");if(trigger){event.preventDefault();openDocument(trigger.dataset.doc);}});
  $("#docSelect").addEventListener("change",event=>openDocument(event.target.value));
  $("#closeReader").addEventListener("click",()=>reader.close());
  reader.addEventListener("close",()=>{if(location.hash.startsWith("#read/"))history.replaceState(null,"",priorHash);if(priorFocus?.isConnected)priorFocus.focus({preventScroll:true});});
  reader.addEventListener("click",event=>{if(event.target===reader){const rect=reader.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)reader.close();}});
  window.addEventListener("hashchange",()=>{if(location.hash.startsWith("#read/"))loadDocument(location.hash.slice(6));else if(reader.open)reader.close();});
  if(location.hash.startsWith("#read/"))loadDocument(location.hash.slice(6));
  const image=$("#imageDialog");$("#showProof").addEventListener("click",()=>image.showModal());$("#closeImage").addEventListener("click",()=>image.close());image.addEventListener("click",event=>{if(event.target===image){const r=image.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)image.close();}});
  const overview=$("#overviewDialog");$("#showOverview").addEventListener("click",()=>overview.showModal());$("#closeOverview").addEventListener("click",()=>overview.close());overview.addEventListener("click",event=>{if(event.target===overview){const r=overview.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)overview.close();}});
  let expanded=false;
  const usefulTitle=source=>{
    if(!source.supports.startsWith("相关官方说明"))return source.supports;
    const url=new URL(source.url);return `${url.hostname.replace(/^www\./,"")} · ${decodeURIComponent(url.pathname.split("/").filter(Boolean).slice(-1)[0]||"官方首页").replace(/-/g," ")}`;
  };
  function renderSources(){
    const term=$("#sourceSearch").value.trim().toLowerCase();const found=data.sources.filter(source=>`${source.url} ${source.supports} ${source.cited_in.join(" ")}`.toLowerCase().includes(term));
    const visible=term||expanded?found:found.slice(0,6);
    $("#officialSources").innerHTML=visible.length?visible.map(source=>`<a class="official-source" href="${escape(source.url)}" target="_blank" rel="noopener noreferrer"><span>${escape(source.id)}</span><div><b>${escape(usefulTitle(source))}</b><small>${escape(source.url)}</small></div><i aria-hidden="true">↗</i></a>`).join(""):'<p class="empty-sources">没有匹配的资料，试试机构名、网址或主题关键词。</p>';
    $("#moreSources").hidden=Boolean(term)||found.length<=6;$("#moreSources").textContent=expanded?"收起来源 ↑":`展开全部 ${data.sources.length} 项来源 ↓`;
  }
  $("#sourceSearch").addEventListener("input",renderSources);$("#moreSources").addEventListener("click",()=>{expanded=!expanded;renderSources();});renderSources();
  if("IntersectionObserver" in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){$$('.chapter-nav a').forEach(a=>a.classList.toggle("active",a.hash===`#${entry.target.id}`));}}},{rootMargin:"-12% 0px -68% 0px",threshold:0});$$('main>section[id],main>section>div.shell').filter(e=>e.matches('section[id]')).forEach(e=>observer.observe(e));}
})();
