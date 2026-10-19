import {shortlist,careerProfile} from './assets/model.mjs';
const $ = id => document.getElementById(id);
const safe = value => String(value).replace(/[&<>"']/g,char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const guideDialog=$('guide-dialog');
for(const button of document.querySelectorAll('.open-guide'))button.addEventListener('click',()=>{guideDialog.showModal();$('guide-scroll').scrollTop=0;});
$('guide-close').addEventListener('click',()=>guideDialog.close());
$('guide-zoom').addEventListener('click',()=>{
  const natural=$('guide-scroll').classList.toggle('natural-size');
  $('guide-zoom').setAttribute('aria-pressed',String(natural));
  $('guide-zoom').textContent=natural?'适应宽度':'原尺寸';
});
guideDialog.addEventListener('close',()=>{
  $('guide-scroll').classList.remove('natural-size');
  $('guide-zoom').setAttribute('aria-pressed','false');
  $('guide-zoom').textContent='原尺寸';
});
const baseSource = 'https://github.com/can4hou6joeng4/boss-agent-cli/blob/4716ee1d211533db70ac7cc1ab2322eb269b43a0/';
const roleCards = {
  jobseeker:[['01 / DISCOVER','发现与筛选职位','关键词、城市、薪资、经验和学历等条件；福利词表及 HR 活跃度进一步筛选。','boss search "Python" --city 杭州'],['02 / ORGANIZE','管理岗位与跟进','候选池、标签、备注、离线对比、预设、增量观察和求职流程统计。','boss shortlist compare'],['03 / ASSIST','求职分析与沟通','可选模型分析简历和 JD、准备面试；平台端支持打招呼、立即沟通等操作。','boss ai analyze-jd --help']],
  recruiter:[['01 / FIND','发现候选人','候选人搜索、推荐和简历读取；需要招聘者会话与对应平台权限。','boss hr candidates "Python"'],['02 / COMMUNICATE','管理简历和会话','读取聊天与最近消息、回复、请求和接收附件简历；真实数据须按权限使用。','boss hr applications'],['03 / OPERATE','管理招聘职位','查询职位列表、上下线管理，结合平台接口推进招聘工作。','boss hr jobs list']],
  agent:[['01 / DESCRIBE','能力自描述','schema 给出参数、平台支持和错误结构，让宿主按明确定义调用工具。','boss schema'],['02 / INVOKE','统一调用入口','CLI、Python API 与 MCP 接入同一业务层，普通搜索筛选无需大模型。','boss-mcp --help'],['03 / CONTINUE','可恢复的工作流','JSON 结果与下一步提示，结合 run ID、SQLite 状态、预算与断点继续任务。','boss wizard --help']],
};
const steps = [
  ['用户正常登录，工具管理会话','AuthManager 保存和复用登录状态。部分访问还需要网页 JS 生成的 __zp_stoken__ 与浏览器环境。','Cookie + 页面 Token + 账号权限','有效登录态只是访问条件，不能保证请求通过平台检查。','src/boss_agent_cli/auth/manager.py'],
  ['在适用的 HTTP 或浏览器通道发请求','httpx 直接请求适用接口；搜索等操作使用 CDP / Patchright，在 BOSS 页面环境执行 fetch。一般无需逐次识图点击。','httpx / CDP / Patchright → 平台接口','CDP 是浏览器调试协议，不是服务端特权入口，也不能保证自动化不被发现。','src/boss_agent_cli/api/browser_client.py'],
  ['把原始数据转成可用的业务结果','适配平台字段，检查列表条件；福利先看标签，必要时补查描述。SQLite 保存缓存、候选池、任务状态和预算。','标签 → 描述 → AND → 本地状态','子串匹配不理解否定、承诺时效或实际待遇。多次查详情也会增加请求量。','src/boss_agent_cli/search_filters.py'],
  ['需要分析时，再调用配置的大模型','把简历、JD 等资料组织成提示词，调用兼容接口；可接本地模型服务。词表规则和基础搜索本身不依赖模型。','简历 + JD → 提示词 → 模型服务','建议质量取决于模型和输入。分析分数与固定规则分数都不能当录用概率。','src/boss_agent_cli/ai/service.py'],
  ['用结构化结果连接下一步','CLI / MCP / Python API 输出统一 JSON，包含数据、分页、错误和后续提示；多步骤流程保存 run ID 与断点。','{ ok, data, pagination, error, hints }','可恢复是本地业务能力，不能自动解除平台账号或环境限制。','docs/commands.md'],
];
const accessCases = {
  search:{title:'普通搜索：浏览器内调用网页 API',path:['搜索参数','已登录 BOSS 页面','fetch /wapi/…','接口 JSON','规则筛选'],data:'JSON 响应是职位数据来源；浏览器负责提供页面会话环境。',boundary:'不是逐条识别截图或提取 DOM 卡片，也不是官方开放平台授权。搜索与推荐直接进入 _browser_request。',source:'src/boss_agent_cli/api/client.py#L165-L206'},
  detail:{title:'允许 HTTP 的会话：详情可由 httpx 读取',path:['详情 / 卡片方法','未进入 browser-only','httpx + 保存的凭据','接口 JSON'],data:'job_detail 走 _request；job_card 先尝试 httpx，普通异常可回退浏览器。',boundary:'风险停止异常不会触发 job_card 的通道回退。若已有 CDP 会话，实际会改按 browser-only 处理，不能只按命令名判断。',source:'src/boss_agent_cli/api/client.py#L226-L259'},
  cdp:{title:'browser-only：平台请求保留在浏览器环境',path:['显式 CDP / 浏览器来源，或已接入 CDP','_request 的通道路由','页面 fetch','接口 JSON'],data:'CDP、非 auto 浏览器来源或已接入 CDP 的会话会触发 browser-only；适用平台读写转到浏览器。',boundary:'_get_client 设有闸门，防止这类会话继续用 httpx 携带浏览器凭据。缺少浏览器实现的操作可能直接报错，并非所有操作都能自动成功。',source:'src/boss_agent_cli/api/_base_client.py#L106-L123'},
  crawl:{title:'crawl：页面操作触发请求，监听 JSON',path:['DrissionPage 页面导航','滚动加载下一页','监听 joblist.json','接口 JSON','保存与断点'],data:'主要读取网络响应体；监听失败时可退到同一页面内 fetch。详情使用页面内 job_card 请求。',boundary:'页面 / DOM 用于导航、滚动和风险状态检查。监听失败不会自动把浏览器 Cookie 拷给进程内 httpx。',source:'src/boss_agent_cli/crawler/transport.py#L204-L272'},
  local:{title:'本地处理：在已保存的数据上执行',path:['已保存岗位','SQLite / 规则函数','离线比较与匹配','本地结果'],data:'候选池的离线比较与词表判断不需要 BOSS 网络请求，也不需要大模型。',boundary:'如果操作另行刷新数据或补查详情，就会增加平台读取。字符串命中不等于岗位真的具备该待遇。',source:'docs/capability-matrix.md'},
  ai:{title:'AI 分析：请求用户配置的模型 API',path:['简历 / JD 文本','提示词','配置的 /chat/completions','模型建议'],data:'这条 HTTP 通道通向外部或本地模型服务，与 BOSS 网页接口是两套数据流。',boundary:'是否出本机取决于端点配置。模型服务本身不替代 BOSS 登录、获取数据的权限或事实核对。',source:'src/boss_agent_cli/ai/service.py#L57-L65'},
};
function renderAccess(){
  const item=accessCases[$('access-case').value];
  $('access-panel').innerHTML=`<h4>${safe(item.title)}</h4><ol class="access-flow">${item.path.map(step=>`<li>${safe(step)}</li>`).join('')}</ol><div class="access-fields"><div><strong>数据从哪里来</strong><p>${safe(item.data)}</p></div><div><strong>依赖与边界</strong><p>${safe(item.boundary)}</p></div></div><a class="text-link" href="${baseSource+item.source}" target="_blank" rel="noreferrer">核对这一条路径的源码 ↗</a>`;
}
$('access-case').addEventListener('change',renderAccess);
renderAccess();
const goals = {
  search:{kind:'已有业务基础',title:'筛选值得进一步了解的机会',question:'哪些岗位符合我的城市、薪资和福利条件？',path:['明确条件','搜索与详情','规则筛选','候选池与人工核对'],reuse:'搜索、多维条件、福利匹配、详情、候选池与备注。',add:'按个人目标设计条件表；必要时增加自定义证据核对与排序。',boundary:'福利命中需要人工确认；apply 当前复用立即沟通接口，不证明简历附件送达。',output:'list',action:'查看岗位清单演示'},
  profile:{kind:'可实现扩展 · 本页有原型',title:'建立职业的岗位要求画像',question:'这个职业在招聘时，通常要求做什么、会什么？',path:['收集岗位样本','提取技能与任务','术语归一化','统计并回链证据'],reuse:'职位搜索、详情、候选池、导出，以及可选模型服务接口。',add:'JD 技能提取、同义术语归一化、去重、频次统计和原文证据。',boundary:'本页画像只使用手工结构化的合成样本；招聘要求不等于实际工作的全部。',output:'career',action:'体验职业画像原型'},
  compare:{kind:'可实现扩展 · 需新增分析',title:'比较职业方向、城市与行业',question:'后端、数据工程和 AI 应用开发，任务与技能要求差在哪？',path:['固定样本条件','分方向采样','对齐字段','比较共性与差异'],reuse:'按关键词和城市等条件搜索、读取详情、保存样本。',add:'职业分类、样本口径、技能归一化、薪资范围解析和比较视图。',boundary:'少量或个性化搜索样本不代表整个市场；本页切换方向只比较合成示例。',output:'career',action:'切换职业方向看看'},
  gap:{kind:'可实现扩展 · 需个人资料与分析',title:'探索个人经历与目标要求的差距',question:'我已经能证明什么，还有哪些要求需要学习或核实？',path:['整理经历证据','选择目标岗位','逐项对照','形成探索行动'],reuse:'本地简历、JD 分析、候选池匹配与模型兼容接口。',add:'个人能力证据、可解释的差距表、人工复核与行动清单。',boundary:'勾选技能只表示自述，不是能力认证。此原型不做录用预测或自动职业决策。',output:'career',action:'对照已有技能'},
  watch:{kind:'可实现扩展 · 需历史数据',title:'观察岗位要求随时间的变化',question:'同一方向的技能要求，经过一段时间是否发生变化？',path:['固定观察口径','有界增量读取','保存历史快照','按时间对比'],reuse:'增量观察、缓存、本地状态与可恢复采集基础。',add:'带时间戳的历史样本、去重、样本覆盖记录与趋势统计。',boundary:'单次搜索无法说明趋势。真实读取仍受会话、平台规则和风控约束。',output:'json',action:'查看可积累的数据结构'},
  hr:{kind:'已有招聘者侧基础',title:'把招聘处理流程接入自己的助手',question:'能否把候选人发现、简历处理和沟通整理成可管理的工作流？',path:['招聘者会话','读取允许的数据','整理与人工复核','推进已授权动作'],reuse:'候选人搜索、简历、会话、附件接收与职位管理接口。',add:'业务界面、权限边界、操作确认、记录与团队流程。',boundary:'需要招聘者权限，不能凭工具绕过数据访问限制；本轮未读取真实候选人资料。',output:'json',action:'查看结构化输出示意'},
};

function tabs(id,callback) {
  const items = [...$(id).querySelectorAll('[role="tab"]')];
  const select = (button,focus=false) => {
    for (const item of items) { const active=item===button; item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1; }
    callback(button); if(focus)button.focus();
  };
  for(const item of items){
    item.addEventListener('click',()=>select(item));
    item.addEventListener('keydown',event=>{
      const i=items.indexOf(item), next={ArrowRight:(i+1)%items.length,ArrowDown:(i+1)%items.length,ArrowLeft:(i+items.length-1)%items.length,ArrowUp:(i+items.length-1)%items.length,Home:0,End:items.length-1}[event.key];
      if(next!==undefined){event.preventDefault();select(items[next],true);}
    });
  }
  select(items.find(item=>item.getAttribute('aria-selected')==='true')??items[0]);
  return select;
}
tabs('role-tabs',button=>{
  $('role-panel').setAttribute('aria-labelledby',button.id);
  $('role-panel').innerHTML=roleCards[button.dataset.role].map(([label,title,description,command])=>`<article class="cap-card"><div class="cap-label"><span>${label}</span><span>↗</span></div><h3>${title}</h3><p>${description}</p><code>${safe(command)}</code></article>`).join('');
});
tabs('step-tabs',button=>{
  const [title,text,code,boundary,path]=steps[Number(button.dataset.step)];
  $('step-panel').setAttribute('aria-labelledby',button.id);
  $('step-panel').innerHTML=`<div><h3>${title}</h3><p>${text}</p><a href="${baseSource+path}" target="_blank" rel="noreferrer">核对源码 ↗</a></div><aside><span class="small-label">这一层的作用与边界</span><code>${safe(code)}</code><p>${boundary}</p></aside>`;
});
const selectOutput=tabs('output-tabs',button=>{
  const view=button.dataset.output;
  $('output-panel').setAttribute('aria-labelledby',button.id);
  for(const id of ['list','json','career']) $(id==='list'?'job-output':`${id}-output`).hidden=id!==view;
});
tabs('goal-tabs',button=>{
  const goal=goals[button.dataset.goal];
  $('goal-panel').setAttribute('aria-labelledby',button.id);
  $('goal-panel').innerHTML=`<span class="badge ${['search','hr'].includes(button.dataset.goal)?'existing':'prototype'}">${goal.kind}</span><h3>${goal.title}</h3><p class="goal-question">${goal.question}</p><div class="goal-path">${goal.path.map(s=>`<span>${s}</span>`).join('<i>→</i>')}</div><div class="goal-fields"><div><strong>可以复用库的什么</strong><p>${goal.reuse}</p></div><div><strong>还需要补什么</strong><p>${goal.add}</p></div></div><p class="goal-boundary">${goal.boundary}</p><button id="goal-preview" class="button subtle">${goal.action} ↗</button>`;
  $('goal-preview').addEventListener('click',()=>{selectOutput($(`output-${goal.output}`));$('outputs').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
});

let welfare, careers, renderedJson='';
function renderJobs(){
  if(!welfare)return;
  const conditions=$('welfare-filter').checked?['双休','五险一金']:[];
  const jobs=shortlist(welfare.jobs,{city:$('job-city').value,conditions},welfare.welfare_keywords);
  const falseHits=jobs.filter(job=>conditions.some(condition=>job.truth[condition]!==true)).length;
  $('job-summary').innerHTML=`<strong>${jobs.length} / 8 个命中</strong><span>当前城市：${safe($('job-city').value||'不限')} · 语义误命中 ${falseHits} 个（按合成标注）</span>`;
  $('job-list').innerHTML=jobs.map(job=>`<article class="job"><h3>${safe(job.title)}</h3><small>${safe(job.company)} · ${safe(job.city)} · ${safe(job.salary)}</small><p>${safe(job.description)}</p><p class="job-match">${safe(job.matches.join(' · ')||'未限制福利')}</p>${conditions.some(condition=>job.truth[condition]!==true)?'<p class="job-review">人工标注：不满足，需复核</p>':''}</article>`).join('')||'<p>没有样本命中，可放宽条件。</p>';
  renderedJson=JSON.stringify({ok:true,data:jobs.map(job=>({sample_id:job.id,title:job.title,city:job.city,welfare_match:job.matches})),pagination:{total:jobs.length},error:null,hints:{next_actions:['继续查看岗位描述、保存候选项并核对条件']},research_demo:{synthetic:true,live_platform_requests:0,note:'简化信封示意，非真实平台或 CLI 响应'}},null,2);
  $('json-preview').textContent=renderedJson;
}
function renderCareer(){
  if(!careers)return;
  const selected=[...$('skill-options').querySelectorAll('input:checked')].map(input=>input.value);
  const profile=careerProfile(careers.samples,$('career-direction').value,selected);
  $('career-summary').innerHTML=`当前方向 <strong>${profile.sampleCount}</strong> 个合成样本 · 按岗位计数，非市场占比`;
  $('skill-bars').innerHTML=profile.skills.map(item=>`<div class="skill-row${item.selected?' selected':''}"><span>${safe(item.skill)}${item.selected?' ✓':''}</span><div class="skill-track"><span style="width:${item.total?item.count/item.total*100:0}%"></span></div><small>${item.count}/${item.total}</small></div>`).join('');
  $('career-gap').textContent=profile.toExplore.length?profile.toExplore.map(item=>`${item.skill}（${item.count}/${item.total}）`).join('、'):'样本提及的技能都已勾选；这不代表能力达标，仍需经历证据。';
  $('career-tasks').innerHTML=`<strong>样本中的工作任务</strong><p>${profile.tasks.map(item=>`${safe(item.task)} · ${item.count}/${profile.sampleCount}`).join('<br>')}</p>`;
  $('career-samples').innerHTML=profile.jobs.map(job=>`<article><strong>${safe(job.id)} · ${safe(job.title)}</strong><p>${safe(job.description)}</p><p>人工结构化技能：${job.skills.map(safe).join(' / ')}</p></article>`).join('');
}
$('job-city').addEventListener('change',renderJobs);
$('welfare-filter').addEventListener('change',renderJobs);
$('career-direction').addEventListener('change',renderCareer);
$('skill-options').addEventListener('change',renderCareer);
$('copy-json').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(renderedJson);$('copy-json').textContent='已复制';}
  catch{$('copy-json').textContent='请选中下方文本复制';}
});
try{
  const inlineData=document.getElementById('offline-data');
  if(inlineData){
    const embedded=JSON.parse(inlineData.textContent);[welfare,careers]=[embedded.welfare,embedded.careers];
    if(embedded.guide_png)for(const img of document.querySelectorAll('[data-guide-image]'))img.src=embedded.guide_png;
    for(const type of ['png','svg'])if(embedded[`guide_${type}`])for(const link of document.querySelectorAll(`[data-guide-${type}]`))link.href=embedded[`guide_${type}`];
  }
  else [welfare,careers]=await Promise.all(['assets/welfare-evidence.json','assets/career-samples.json'].map(async path=>{const response=await fetch(path);if(!response.ok)throw new Error(`${path}: HTTP ${response.status}`);return response.json();}));
  renderJobs();renderCareer();
}catch(error){$('load-error').hidden=false;$('load-error').textContent=`演示数据未载入：${error.message}。请通过本地 HTTP 服务打开构建后的网页。`;}
