/* Code intelligence workbench. All saved tool responses come from real runs.
   Browser graph filtering, layouts, guided narration and playback are ours. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ns = 'http://www.w3.org/2000/svg';
  const groupColors=['#64bba6','#c0d66a','#d3a16b','#b5a0d8'];
  const colors = {Function:'#a8c982',File:'#6ab8b4',Interface:'#ac9ed1',Property:'#8b9eaf',Const:'#d6b77c',Folder:'#597e8a',Community:'#d4f76c',Process:'#e5b16e',Route:'#e5b16e',Statement:'#8ac3b1',BasicBlock:'#9c9ed6',Tool:'#d5b475'};
  const labels = {CALLS:'调用',IMPORTS:'导入',DEFINES:'定义',MEMBER_OF:'归属分组',STEP_IN_PROCESS:'流程步骤',HAS_PROPERTY:'包含字段',CONTAINS:'目录包含',ACCESSES:'访问',IMPLEMENTS:'实现',USES:'使用'};
  const info = {
    overview:['REPOSITORY ATLAS','先看整仓，代码之间怎样连接。','71 个实体与 131 条真实关系。切换视角、查找实体、缩放和平移，再点一个节点查看源码。'],
    communities:['COMMUNITIES','目录之外，哪些代码联系更紧密？','选择自动分组，图上高亮实际成员；成员可能来自不同文件夹，同名分组通过 ID 区分。'],
    context:['SYMBOL CONTEXT','选一个函数，把上下文展开。','这次为全部 10 个业务函数分别执行了 context。点击函数切换真实结果，调用者与被调用者同步亮起。'],
    flows:['PROCESS + TRACE','沿着流程，一步一步走过代码。','选择 4 条真实候选流程之一，逐步播放或手动点步骤；连线、当前函数和源码同步变化。'],
    impact:['UPSTREAM IMPACT','改一个函数，要调查哪些地方？','选择目标与显示深度。图和列表联动展示真实 impact 返回的依赖实体，包含验证入口。'],
    search:['QUERY → GRAPH → SOURCE','让搜索命中回到代码地图。','选择三次实际关键词查询之一。点击命中定位实体；流程、符号与定义各自保留，不混成一个数量。'],
    changes:['DIFF → SYMBOL → PROCESS','把一次具体修改，放回关系图中。','免邮门槛由 100 元改到 120 元。查看 diff 如何定位函数、关联流程，以及业务行为怎样改变。'],
    rename:['GRAPH + TEXT CANDIDATES','改名字之前，先看确切修改位置。','回放独立高级样本中 rename 的预览。检查哪些绑定被识别、哪些候选只是文字匹配。'],
    api:['ROUTES / TOOLS / RESPONSE SHAPES','从客户端请求，连到服务端处理器。','独立 API 与客户端样本，展示路由、消费者、返回字段，以及识别成功与未覆盖的部分。'],
    pdg:['CONTROL / DATA DEPENDENCE','从函数关系，继续深入到语句。','开启 --pdg 的高级样本，用真实控制和数据依赖解释输入如何传递；静态线索需继续核对。'],
    agent:['A GRAPH-BACKED WORKFLOW','编程助手，怎样用这些能力？','跟着“修改免邮规则”任务走一次工具链。工具结果来自实跑，步骤讲解为教学编排，本页不调用大模型。'],
    coverage:['CAPABILITY LANDSCAPE','把所有入口，放进同一张能力地图。','从已演示的基础图谱到可选语义搜索、仓库组与 Wiki；每项都注明效果、条件和本次覆盖。']
  };
  let data, extra, advanced, evidence, probes;
  let mode='overview', scope='all', selected='Function:services/shipping.ts:calculateShipping', group='all';
  let impactTarget=shippingFallback(),touched=false;
  function shippingFallback(){return 'Function:services/shipping.ts:calculateShipping';}
  let processId='proc_3_submitorder', flowStep=-1, depth=2, queryIndex=0, queryText='', neighbors=false, changed=true, agentStep=0;
  let zoom=1,vx=0,vy=0,drag=null,playTimer=null,tourIndex=-1;
  let currentNodes=[],currentEdges=[],litNodes=new Set(),litEdges=new Set(),positions=new Map();
  let advancedTab='route_map';
  let pdgTab='controls',taintCase='unsafe',advancedFocus=new Set(),sourceLine=null;
  let requestedMode=null;
  const svg=$('atlas-graph');
  const graphCache=new Map();
  const shipping='Function:services/shipping.ts:calculateShipping';
  function element(tag,attrs={},text){const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([key,value])=>e.setAttribute(key,value));if(text!==undefined)e.textContent=text;return e;}
  function nodeById(id){return currentNodes.find(n=>n.id===id)||data?.nodes.find(n=>n.id===id)||advanced?.views?.[mode]?.nodes?.find(n=>n.id===id);}
  function graphForMode(){
    if(['rename','api','pdg'].includes(mode)&&advanced?.views?.[mode]){
      const view=advanced.views[mode];let nodes=view.nodes.map(n=>({...n,kind:n.kind||n.label||'Function'}));
      if(mode==='api'&&advancedTab==='route_map')nodes=nodes.filter(n=>(n.kind==='File'||n.kind==='Route')&&!n.filePath.startsWith('tools/'));
      if(mode==='api'&&advancedTab==='tool_map')nodes=nodes.filter(n=>n.filePath.startsWith('tools/')||n.kind==='Tool');
      if(mode==='api'&&['shape_check','api_impact'].includes(advancedTab))nodes=nodes.filter(n=>['client/create-order.ts','server/create-order.ts'].includes(n.filePath)||n.id==='Route:POST /api/orders');
      if(mode==='pdg'){
        if(pdgTab!=='taint')nodes=nodes.filter(n=>n.filePath==='services/shipping.ts');
        else {const ranges={unsafe:[2,6],safe:[8,12],wrapped:[14,21],callback:[23,26]},range=ranges[taintCase];nodes=nodes.filter(n=>n.filePath==='security/preview.ts'&&n.startLine>=range[0]&&n.startLine<=range[1]);}
      }
      const ids=new Set(nodes.map(n=>n.id));return {nodes,edges:view.edges.filter(e=>ids.has(e.source)&&ids.has(e.target)&&(mode!=='api'||['FETCHES','HANDLES_ROUTE','DEFINES','IMPORTS','HANDLES_TOOL'].includes(e.type))).map((e,i)=>({...e,id:e.id||`advanced-${i}`}))};
    }
    let nodes=data.nodes,edges=data.edges;
    if(mode==='communities'){
      const ids=new Set(extra.communities.flatMap(c=>[c.id,...c.members.map(n=>n.id)]));
      nodes=nodes.filter(n=>ids.has(n.id));edges=edges.filter(e=>ids.has(e.source)&&ids.has(e.target));
    } else if(scope==='business') {
      nodes=nodes.filter(n=>n.kind==='Function'||n.id==='File:verify.ts');
      const ids=new Set(nodes.map(n=>n.id));edges=edges.filter(e=>e.type==='CALLS'&&ids.has(e.source)&&ids.has(e.target));
    } else if(scope==='files'){
      nodes=nodes.filter(n=>n.kind==='File');edges=edges.filter(e=>e.type==='IMPORTS');
    }
    if(queryText.trim()){
      const q=queryText.toLowerCase();nodes=nodes.filter(n=>(n.name+' '+n.filePath+' '+n.id).toLowerCase().includes(q));
    }
    if(neighbors){const ids=new Set([selected]);edges.forEach(e=>{if(e.source===selected)ids.add(e.target);if(e.target===selected)ids.add(e.source);});nodes=nodes.filter(n=>ids.has(n.id));}
    const ids=new Set(nodes.map(n=>n.id));return {nodes,edges:edges.filter(e=>ids.has(e.source)&&ids.has(e.target))};
  }
  function businessLayout(nodes){
    const map=new Map();const slots={submitOrder:[130,210],checkoutOrder:[380,230],estimateOrder:[130,495],applyDiscount:[650,120],calculateSubtotal:[650,250],calculateShipping:[650,390],reserveStock:[650,530],saveOrder:[875,230]};
    nodes.forEach(n=>{let p=slots[n.name];if(n.name==='validate')p=n.filePath.includes('customer')?[380,80]:[875,530];if(n.id==='File:verify.ts')p=[130,70];if(p)map.set(n.id,{x:p[0],y:p[1]});});return map;
  }
  function layoutGraph(nodes,edges){
    if(scope==='business'&&!['communities','rename','api','pdg'].includes(mode))return businessLayout(nodes);
    if(mode==='api'){
      const slots={
        'File:client/create-order.ts':[160,130],'Function:client/create-order.ts:placeOrder':[160,370],
        'Route:POST /api/orders':[500,130],'File:server/create-order.ts':[840,130],'Function:server/create-order.ts:createOrder':[840,370],
        'File:services/shipping.ts':[840,240],
        'File:client/order-detail.ts':[160,330],'File:client/dynamic-order.ts':[160,465],
        'Route:GET /api/orders/:id':[500,380],'File:server/order-detail.ts':[840,380],
        'Route:GET /api/health':[500,550],'File:server/health.ts':[840,550],
        'File:tools/shipping_tool.py':[160,310],'Function:tools/shipping_tool.py:quote_shipping':[500,310],'Tool:quote_shipping':[840,310]
      };
      return new Map(nodes.map((n,i)=>[n.id,{x:slots[n.id]?.[0]||170+(i%3)*325,y:slots[n.id]?.[1]||100+Math.floor(i/3)*120}]));
    }
    if(mode==='pdg'){
      const sorted=[...nodes].sort((a,b)=>(a.startLine||0)-(b.startLine||0)||a.kind.localeCompare(b.kind)||a.id.localeCompare(b.id));
      return new Map(sorted.map((n,i)=>[n.id,{x:170+(i%3)*325,y:90+Math.floor(i/3)*135}]));
    }
    const key=nodes.map(n=>n.id).join('|')+':'+mode;
    if(graphCache.has(key))return graphCache.get(key);
    const memberGroup=new Map(extra.communities.flatMap((c,i)=>c.members.map(n=>[n.id,i])));
    const centers=[[230,190],[650,210],[740,480],[250,490]];
    const points=nodes.map((n,i)=>{const g=memberGroup.get(n.id)??(n.kind==='Community'?Number(n.id.slice(-1)):i%4);const c=centers[g%4];const a=i*2.399;return {...n,x:c[0]+Math.cos(a)*(35+(i%8)*13),y:c[1]+Math.sin(a)*(35+(i%7)*15),dx:0,dy:0};});
    const by=new Map(points.map(n=>[n.id,n]));
    for(let tick=0;tick<220;tick++){
      const heat=1-tick/260;
      points.forEach(p=>{p.dx=(500-p.x)*.002;p.dy=(325-p.y)*.002;});
      for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
        const a=points[i],b=points[j];let dx=a.x-b.x,dy=a.y-b.y;if(!dx&&!dy)dx=.1;
        const d=Math.sqrt(dx*dx+dy*dy);const f=Math.min(15,2000/(d*d+5));a.dx+=dx/d*f;a.dy+=dy/d*f;b.dx-=dx/d*f;b.dy-=dy/d*f;
      }
      edges.forEach(e=>{const a=by.get(e.source),b=by.get(e.target);if(!a||!b)return;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;const target=mode==='communities'?112:90;const f=(d-target)*.014;a.dx+=dx/d*f;a.dy+=dy/d*f;b.dx-=dx/d*f;b.dy-=dy/d*f;});
      points.forEach(p=>{p.x=Math.max(60,Math.min(940,p.x+p.dx*heat));p.y=Math.max(65,Math.min(585,p.y+p.dy*heat));});
    }
    const result=new Map(points.map(n=>[n.id,{x:n.x,y:n.y}]));graphCache.set(key,result);return result;
  }
  function activeState(){
    litNodes=new Set();litEdges=new Set();
    const addPairs=ids=>{ids.forEach(id=>litNodes.add(id));currentEdges.forEach(e=>{if(litNodes.has(e.source)&&litNodes.has(e.target))litEdges.add(e.id);});};
    if(mode==='context'||(mode==='overview'&&selected&&touched)){
      litNodes.add(selected);currentEdges.forEach(e=>{if(e.source===selected||e.target===selected){litNodes.add(e.source);litNodes.add(e.target);litEdges.add(e.id);}});
    }
    if(mode==='communities'){
      const groups=group==='all'?extra.communities:extra.communities.filter(c=>c.id===group);
      addPairs(groups.flatMap(c=>[c.id,...c.members.map(n=>n.id)]));
    }
    if(mode==='flows'||(mode==='changes'&&changed)||(mode==='agent'&&agentStep===3)){
      const process=extra.processes.find(p=>p.id===(mode==='changes'||mode==='agent'?'proc_3_submitorder':processId));
      const count=mode==='flows'&&flowStep>=0?flowStep+1:process.steps.length;
      addPairs(process.steps.slice(0,count).map(n=>n.id));
    }
    if(mode==='impact'||(mode==='agent'&&agentStep===2)){
      const result=data.impacts[mode==='agent'?shipping:impactTarget];
      if(result){addPairs([mode==='agent'?shipping:impactTarget,...Object.entries(result.byDepth||{}).filter(([d])=>Number(d)<=depth).flatMap(([,list])=>list.map(n=>n.id||n.uid))]);}
    }
    if(mode==='search'||(mode==='agent'&&agentStep===0)){
      const result=data.searches[mode==='agent'?0:queryIndex].result;
      addPairs([...result.processes,...result.process_symbols,...result.definitions].map(n=>n.id||n.uid));
    }
    if(mode==='agent'&&agentStep===1){litNodes.add(shipping);currentEdges.forEach(e=>{if(e.target===shipping||e.source===shipping){litNodes.add(e.source);litNodes.add(e.target);litEdges.add(e.id);}});}
    if(['rename','api','pdg'].includes(mode)){
      if(advancedFocus.size)addPairs([...advancedFocus]);
      else if(mode==='pdg'){
        const types=pdgTab==='controls'?['CDG']:pdgTab==='flows'?['REACHING_DEF']:['TAINTED','TAINT_PATH','SANITIZES'];
        currentEdges.forEach(e=>{if(types.includes(e.type)){litNodes.add(e.source);litNodes.add(e.target);litEdges.add(e.id);}});
      } else addPairs(currentNodes.map(n=>n.id));
    }
  }
  function drawGraph(){
    if(!data)return;
    const graph=graphForMode();currentNodes=graph.nodes;currentEdges=graph.edges;positions=layoutGraph(currentNodes,currentEdges);activeState();
    const defs=element('defs');const marker=element('marker',{id:'arrow',viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:5,markerHeight:5,orient:'auto'});marker.append(element('path',{d:'M0 1L7 4L0 7',fill:'none',stroke:'#769c83','stroke-width':1.2}));defs.append(marker);
    const lines=element('g'),dots=element('g');
    currentEdges.forEach(e=>{const a=positions.get(e.source),b=positions.get(e.target);if(!a||!b)return;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;const rectangle=mode==='api'?[132,30]:mode==='pdg'?[115,27]:scope==='business'&&!['communities','rename','api'].includes(mode)?[87,23]:null;const radius=rectangle?Math.min(rectangle[0]/Math.max(.00001,Math.abs(dx/d)),rectangle[1]/Math.max(.00001,Math.abs(dy/d))):13;const sx=a.x+dx/d*radius,sy=a.y+dy/d*radius,tx=b.x-dx/d*(radius+3),ty=b.y-dy/d*(radius+3);const active=litEdges.has(e.id);const curve=e.source===e.target?`M${a.x-20} ${a.y-20}C${a.x-95} ${a.y-110} ${a.x+95} ${a.y-110} ${a.x+20} ${a.y-20}`:`M${sx} ${sy}L${tx} ${ty}`;const path=element('path',{d:curve,class:`graph-edge ${e.type} ${active?'lit':litNodes.size?'dim':''}${mode==='flows'&&active&&flowStep>=0?' flow-active':''}`,'marker-end':'url(#arrow)'});path.append(element('title',{},`${nodeById(e.source)?.name} → ${nodeById(e.target)?.name} · ${e.type}`));lines.append(path);});
    currentNodes.forEach(n=>{const p=positions.get(n.id);if(!p)return;const focused=n.id===selected;const clusterIndex=extra.communities.findIndex(c=>c.id===n.id||c.members.some(member=>member.id===n.id));const nodeColor=mode==='communities'&&clusterIndex>=0?groupColors[clusterIndex]:colors[n.kind]||'#a1bead';const isBusiness=scope==='business'&&!['communities','rename','api','pdg'].includes(mode);const currentProcess=extra.processes.find(p=>p.id===processId);const stepIndex=mode==='flows'?currentProcess.steps.findIndex(s=>s.id===n.id):-1;const now=mode==='flows'&&flowStep>=0&&stepIndex===flowStep;const g=element('g',{class:`atlas-node${focused?' selected':''}${litNodes.has(n.id)?' lit':litNodes.size?' dim':''}${now?' step-current':''}`,transform:`translate(${p.x} ${p.y})`,role:'button',tabindex:0,'data-node-id':n.id,'aria-label':`${n.name}，${n.filePath||n.kind}，查看详情`,'style':`--node-color:${nodeColor}`});
      if(mode==='api'){g.append(element('rect',{x:-132,y:-30,width:264,height:60,rx:7}));g.append(element('text',{'text-anchor':'middle',y:-7},n.kind==='Route'?n.id.slice(6):n.name));g.append(element('text',{'text-anchor':'middle',y:13,class:'node-file'},n.kind==='Route'?'API ROUTE':n.filePath));}
      else if(mode==='pdg'){g.append(element('rect',{x:-115,y:-27,width:230,height:54,rx:7}));g.append(element('text',{'text-anchor':'middle',y:-7},`L${n.startLine} · ${n.kind}`));g.append(element('text',{'text-anchor':'middle',y:12,class:'node-file'},(n.code||n.name).trim().split('\n')[0].slice(0,35)));}
      else if(isBusiness){g.append(element('rect',{x:-87,y:-23,width:174,height:46,rx:7}));g.append(element('text',{'text-anchor':'middle',y:2},n.name));g.append(element('text',{'text-anchor':'middle',y:16,class:'node-file'},n.filePath));}
      else {g.append(element('circle',{r:n.kind==='Community'?19:n.kind==='Function'?13:n.kind==='File'?11:8}));if(focused||currentNodes.length<32||['Function','Community'].includes(n.kind)||zoom>=1.6)g.append(element('text',{x:17,y:4},n.name.length>25?n.name.slice(0,23)+'…':n.name));}
      if(stepIndex>=0){g.append(element('circle',{cx:-76,cy:-26,r:10,class:'node-step'}));g.append(element('text',{x:-76,y:-22,'text-anchor':'middle',class:'step-index'},String(stepIndex+1)));}
      g.append(element('title',{},`${n.kind} · ${n.name}\n${n.filePath}${n.startLine?':'+n.startLine:''}\n${n.id}`));
      g.addEventListener('click',()=>selectNode(n.id));g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectNode(n.id);}});dots.append(g);
    });svg.replaceChildren(defs,lines,dots);applyViewport();
    $('graph-caption').textContent=`${currentNodes.length} 个实体 / ${currentEdges.length} 条关系${litNodes.size?' · 高亮 '+currentNodes.filter(n=>litNodes.has(n.id)).length+' 个':''}`;
    $('graph-empty').hidden=currentNodes.length>0;
    const kinds=[...new Set(currentNodes.map(n=>n.kind))];$('graph-legend').innerHTML=mode==='communities'?extra.communities.map((c,i)=>`<span><i style="--c:${groupColors[i]}"></i>${esc(c.label)} / ${c.id}</span>`).join(''):kinds.map(kind=>`<span><i style="--c:${colors[kind]||'#a1bead'}"></i>${esc(kind)}</span>`).join('')+'<span><i style="--c:#d4f76c"></i>当前关系</span>';
  }
  function selectNode(id,{source=false}={}){
    selected=id;touched=true;sourceLine=null;
    drawGraph();renderInspector();if(source)showSource();
    if(mode==='impact'||mode==='context')renderResults();
    if(mode==='flows'){
      const process=extra.processes.find(p=>p.id===processId),index=process.steps.findIndex(n=>n.id===id);
      if(index>=0){flowStep=index;drawGraph();renderResults();showSource();}
    }
  }
  function sourceFile(node){const file=(advanced&&['rename','api','pdg'].includes(mode)?advanced.files:data.files).find(f=>f.path===node.filePath);return file;}
  function showSource(){const node=nodeById(selected);if(!node)return;const file=sourceFile(node);$('source-box').hidden=false;$('source-file').textContent=node.filePath||'此节点没有源码文件';
    if(!file){$('entity-source').innerHTML='<span class="source-line">分组、流程或派生实体没有独立源码文件；请点成员查看定义。</span>';return;}
    let content=file.content;
    if(mode==='changes'&&changed&&node.filePath==='services/shipping.ts')content=content.replace('subtotal >= 10000','subtotal >= 12000');
    const start=sourceLine||node.startLine||1,end=sourceLine||node.endLine||start;
    $('entity-source').innerHTML=content.split('\n').map((line,i)=>`<span class="source-line${i+1>=start&&i+1<=end?' active':''}"><b>${i+1}</b>${esc(line)}</span>`).join('');
    $('entity-source').scrollTop=Math.max(0,(start-3)*18.5);
  }
  const nodeButton=node=>`<button class="entity-link" data-select="${esc(node.id||node.uid)}">${esc(node.name||node.filePath)}<small>${esc(node.filePath||node.kind||node.id)}${node.startLine?':'+node.startLine:''}</small></button>`;
  function renderInspector(){
    const node=nodeById(selected);if(!node){$('entity-name').textContent='选择一个节点';$('entity-location').textContent='';$('entity-summary').innerHTML='<p class="summary-text">在图中或结果列表中点选，查看结构和对应源码。</p>';$('entity-relations').innerHTML='';return;}
    $('entity-kind').textContent=node.kind||'ENTITY';$('entity-name').textContent=node.name;$('entity-location').textContent=(node.filePath||node.id)+(node.startLine?`:${node.startLine}`:'');
    const advancedMode=['rename','api','pdg'].includes(mode);
    const community=advancedMode?null:extra.communities.find(c=>c.members.some(n=>n.id===node.id));
    const result=advancedMode?null:data.contexts[node.id];
    $('entity-summary').innerHTML=(community?`<span class="entity-pill">${esc(community.label)} · ${esc(community.id)}</span>`:'')+(result?`<p class="summary-text">真实 context：${(result.incoming?.calls||[]).length} 个调用者，${(result.outgoing?.calls||[]).length} 个被调用者，${(result.processes||[]).length} 条流程参与。</p>`:`<p class="summary-text">从真实图谱读取 ${esc(node.kind)} 实体及相连关系。</p>`)+(mode==='changes'&&changed&&node.id===shipping?'<span class="entity-pill">当前显示改动后的源码预览</span>':'');
    let relations='';
    if(result&&['context','impact','flows','changes','agent'].includes(mode)){
      relations=`<div class="relation-group"><h3>CALLERS / 调用者</h3>${(result.incoming?.calls||[]).map(nodeButton).join('')||'<p class="summary-text">本次工具未返回调用者</p>'}</div><div class="relation-group"><h3>CALLEES / 被调用者</h3>${(result.outgoing?.calls||[]).map(nodeButton).join('')||'<p class="summary-text">本次工具未返回被调用符号</p>'}</div>`;
    } else {
      const related=currentEdges.filter(e=>e.source===node.id||e.target===node.id);
      const groups=new Map();related.forEach(e=>{const other=nodeById(e.source===node.id?e.target:e.source);if(!other)return;const key=(e.source===node.id?'→ ':'← ')+e.type;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(other);});
      relations=[...groups].map(([name,list])=>`<div class="relation-group"><h3>${esc(name)} / ${list.length}</h3>${list.map(nodeButton).join('')}</div>`).join('');
    }
    $('entity-relations').innerHTML=relations;
    const raw=mode==='impact'?data.impacts[selected]:mode==='context'?result:['rename','api','pdg'].includes(mode)?advanced?.views?.[mode]?.details:mode==='search'?data.searches[queryIndex].result:{entity:node,relations:currentEdges.filter(e=>e.source===node.id||e.target===node.id)};
    $('raw-preview').textContent=JSON.stringify(raw,null,2);
    $('raw-explanation').textContent=['rename','api','pdg'].includes(mode)?'高级案例使用独立索引。图与原始工具结果一起保存；未命中或未覆盖同样保留。':'数据来自固定 npm 分发的实际运行；图布局、筛选与动画由本展厅实现。';
    $('raw-link').href=['rename','api','pdg'].includes(mode)?'advanced.json':mode==='search'?'../references/atlas-query-'+queryIndex+'.json':mode==='changes'?'../references/showcase-changes.stdout.txt':'atlas.json';
    if(!$('source-box').hidden)showSource();
  }
  function functionSelect(id='target-function'){
    return `<label>目标函数<select id="${id}">${data.nodes.filter(n=>n.kind==='Function').map(n=>`<option value="${esc(n.id)}" ${n.id===(mode==='impact'?impactTarget:selected)?'selected':''}>${esc(n.name)} · ${esc(n.filePath)}</option>`).join('')}</select></label>`;
  }
  function renderControls(){
    const controls=$('mode-controls');
    const controlsByMode={
      overview:'<span class="control-note">全图包含文件、函数、类型、字段、分组与流程；每条边都可追溯。</span>',
      communities:`<label>自动分组<select id="community-select"><option value="all">全部 4 个分组</option>${extra.communities.map(c=>`<option value="${c.id}" ${c.id===group?'selected':''}>${esc(c.label)} / ${c.id} · ${c.symbolCount} 成员</option>`).join('')}</select></label>`,
      context:functionSelect(),
      flows:`<label>候选流程<select id="process-select">${extra.processes.map(p=>`<option value="${p.id}" ${p.id===processId?'selected':''}>${esc(p.label)} · ${p.stepCount} 步</option>`).join('')}</select></label><button id="flow-play">▶ 逐步播放</button><button id="flow-next">下一步</button><button id="flow-all">显示完整流程</button>`,
      impact:functionSelect()+`<label class="depth-slider">显示到第 <b id="depth-value">${depth}</b> 层<input id="impact-depth" type="range" min="1" max="4" value="${depth}"></label>`,
      search:`<label>实跑查询<select id="query-select">${data.searches.map((q,i)=>`<option value="${i}" ${i===queryIndex?'selected':''}>${esc(q.query)}</option>`).join('')}</select></label><span class="control-note">关键词 FTS · 未启用 embeddings</span>`,
      changes:`<div class="case-tabbar"><button data-change="before" class="${changed?'':'active'}">改动前视图</button><button data-change="after" class="${changed?'active':''}">改动后视图</button></div><button id="locate-diff">定位运费修改行 ↗</button>`,
      rename:'<span class="control-note">只回放 dry-run 预览；网页不会写入源码。</span>',
      api:`<div class="case-tabbar">${[['route_map','路由关联'],['shape_check','响应形状'],['api_impact','接口影响'],['tool_map','MCP 工具']].map(([key,label])=>`<button data-advanced="${key}" class="${advancedTab===key?'active':''}">${label}</button>`).join('')}</div>`,
      pdg:`<div class="case-tabbar">${[['controls','控制依赖'],['flows','变量 def → use'],['taint','输入 → 输出线索']].map(([key,label])=>`<button data-pdg="${key}" class="${pdgTab===key?'active':''}">${label}</button>`).join('')}</div>`,
      agent:'<span class="control-note">固定任务回放：把本地免邮门槛从 100 元提高到 120 元</span>',
      coverage:''
    };
    controls.innerHTML=controlsByMode[mode]||'';
    $('target-function')?.addEventListener('change',event=>{selected=event.target.value;if(mode==='impact')impactTarget=selected;render();});
    $('community-select')?.addEventListener('change',event=>{group=event.target.value;const c=extra.communities.find(c=>c.id===group);if(c)selected=c.id;render();});
    $('process-select')?.addEventListener('change',event=>{stopPlayback();processId=event.target.value;flowStep=-1;selected=extra.processes.find(p=>p.id===processId).steps[0].id;render();});
    $('flow-next')?.addEventListener('click',nextFlow);
    $('flow-all')?.addEventListener('click',()=>{stopPlayback();flowStep=-1;render();});
    $('flow-play')?.addEventListener('click',()=>{if(playTimer){stopPlayback();return;}flowStep=-1;nextFlow();playTimer=setInterval(()=>{const process=extra.processes.find(p=>p.id===processId);if(flowStep>=process.steps.length-1){stopPlayback();return;}nextFlow();},1300);$('flow-play').textContent='Ⅱ 暂停播放';});
    $('impact-depth')?.addEventListener('input',event=>{depth=Number(event.target.value);$('depth-value').textContent=depth;drawGraph();renderResults();});
    $('query-select')?.addEventListener('change',event=>{queryIndex=Number(event.target.value);queryText='';$('graph-search').value='';render();});
    $('locate-diff')?.addEventListener('click',()=>{selectNode(shipping,{source:true});});
  }
  function nextFlow(){const process=extra.processes.find(p=>p.id===processId);flowStep=Math.min(flowStep+1,process.steps.length-1);selected=process.steps[flowStep].id;drawGraph();renderResults();renderInspector();showSource();}
  function stopPlayback(){if(playTimer)clearInterval(playTimer);playTimer=null;if($('flow-play'))$('flow-play').textContent='▶ 逐步播放';}
  function renderNav(){document.querySelectorAll('[data-mode]').forEach(button=>{const active=button.dataset.mode===mode;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});$('mobile-mode').value=mode;const [kicker,title,description]=info[mode];$('mode-kicker').textContent=kicker;$('mode-title').textContent=title;$('mode-description').textContent=description;}
  function setMode(next){
    stopPlayback();mode=next;queryText='';neighbors=false;advancedFocus=new Set();sourceLine=null;$('graph-search').value='';$('source-box').hidden=true;
    scope=['overview','search'].includes(mode)?'all':['communities','rename','api','pdg'].includes(mode)?'all':'business';
    if(['context','impact'].includes(mode)&&!data.contexts[selected])selected=shipping;
    if(['changes','agent'].includes(mode))selected=shipping;
    if(mode==='impact')impactTarget=selected;
    if(['rename','api','pdg'].includes(mode)){const nodes=graphForMode().nodes;const preferred=mode==='api'?'Route:POST /api/orders':shipping;if(nodes.length)selected=nodes.some(n=>n.id===preferred)?preferred:nodes[0].id;}
    zoom=1;vx=0;vy=0;render();
  }
  function renderResults(){
    let html='',insight='';
    if(mode==='overview'){
      insight='<b>先试三个动作：</b>切换“文件依赖图”看 IMPORTS；切换“业务调用图”看 CALLS；点实体再“聚焦邻居”，把局部关系收拢。图谱比 AST 多了跨文件连接。';
      html='<div class="split-stats"><span><b>71</b>全部实体</span><span><b>131</b>全部关系</span><span><b>10</b>业务函数</span><span><b>12</b>索引文件</span></div>';
    }
    if(mode==='communities'){
      insight='<b>分组来自实际 MEMBER_OF 关系。</b>例如 storage/orders.ts 的 saveOrder 被归入 Services 分组，说明分组不是照抄目录。点击成员后可看其跨组调用。';
      const groups=group==='all'?extra.communities:extra.communities.filter(c=>c.id===group);
      html='<div class="result-grid">'+groups.map(c=>`<article class="result-card"><button data-select="${c.id}">${esc(c.label)} · ${c.id}</button><p>${c.symbolCount} 成员 · cohesion=${Number(c.cohesion).toFixed(3)}</p>${c.members.map(n=>`<button class="entity-link" data-select="${esc(n.id)}">${esc(n.name)}<small>${esc(n.filePath)}</small></button>`).join('')}</article>`).join('')+'</div>';
    }
    if(mode==='context'){
      const result=data.contexts[selected];insight='<b>点选函数，返回结果会换成该函数的真实 context。</b>调用者和被调用者由上游工具采集；右侧源码保留定义位置。两个 validate 以文件和唯一 ID 区分。';
      html=result?`<div class="split-stats"><span><b>${(result.incoming?.calls||[]).length}</b>调用者</span><span><b>${(result.outgoing?.calls||[]).length}</b>被调用者</span><span><b>${(result.processes||[]).length}</b>参与流程</span></div><div class="case-report"><h3>所属流程</h3>${(result.processes||[]).map(p=>`<p>${esc(p.name)} · 第 ${p.step_index} / ${p.step_count} 步</p>`).join('')||'<p>本次 context 没有返回流程参与。</p>'}</div>`:'';
    }
    if(mode==='flows'){
      const process=extra.processes.find(p=>p.id===processId);insight=`<b>${esc(process.label)}</b>：${flowStep<0?'当前显示完整路径。':'当前停在第 '+(flowStep+1)+' 步，图上只亮起已走过的前缀。'} 播放顺序来自 STEP_IN_PROCESS，不是运行时追踪。`;
      html=`<div class="flow-timeline">${process.steps.map((n,i)=>`<button data-flow-step="${i}" class="${flowStep===i?'active':flowStep>i?'done':''}"><span>${i+1}</span>${esc(n.name)}</button>`).join('')}</div><div class="case-report"><h3>另一种路径工具：trace</h3><p>真实 trace 找到 submitOrder → checkoutOrder → saveOrder，2 跳。它查询两个指定符号之间的有向路径，流程发现则是索引时预先归纳。</p><button class="inline-button" data-trace-save="true">高亮下单 → 存储路径</button></div>`;
    }
    if(mode==='impact'){
      const result=data.impacts[impactTarget];const layers=Object.entries(result?.byDepth||{}).filter(([d])=>Number(d)<=depth);
      insight=`<b>目标 ${esc(nodeById(impactTarget)?.name)}。</b>显示到第 ${depth} 层，节点与列表使用同一份真实返回。风险 ${esc(result?.risk||'未返回')} 是工具标签，需再结合源码和测试判断。`;
      html=layers.map(([d,list])=>`<div class="depth-row"><b>DEPTH ${d}</b><div>${list.map(n=>`<button data-select="${esc(n.id||n.uid)}">${esc(n.name||n.filePath)}</button>`).join('')}</div></div>`).join('')||'<p class="summary-text">本次范围没有上游返回项。</p>';
    }
    if(mode==='search'){
      const result=data.searches[queryIndex].result;insight=`<b>实际查询：${esc(data.searches[queryIndex].query)}。</b>返回 ${result.processes.length} 条流程、${result.process_symbols.length} 个流程符号、${result.definitions.length} 条定义。点击卡片即可定位图和源码；工具没有调用大模型。`;
      html=[['流程','processes'],['流程符号','process_symbols'],['定义','definitions']].map(([title,key])=>`<div class="result-head">${title}<small>${result[key].length} 项真实返回</small></div><div class="result-grid">${result[key].map(n=>`<article class="result-card${selected===(n.id||n.uid)?' selected':''}"><button data-search-hit="${esc(n.id||n.uid)}">${esc(n.summary||n.name)}</button><p>${esc(n.filePath||n.id)}</p><small>${n.step_count?n.step_count+' 步':esc((n.id||'').split(':')[0])}</small></article>`).join('')}</div>`).join('');
    }
    if(mode==='changes'){
      insight='<b>点 diff 中的新增行：</b>定位运费函数，在图上看到对应下单流程，右侧切换到改动预览。detect_changes 找到了 1 个变更符号与 1 条流程；这不等于证明业务行为正确。';
      html=`<div class="diff-view"><div class="diff-heading">services/shipping.ts · git diff</div><div class="diff-line old">− if (subtotal &gt;= 10000 &amp;&amp; region === "local") return 0;</div><div class="diff-line new"><button data-diff-line="true">+ if (subtotal &gt;= 12000 &amp;&amp; region === "local") return 0; ↗</button></div></div><div class="split-stats"><span><b>1</b>变更文件</span><span><b>1</b>变更符号</span><span><b>1</b>关联流程</span><span><b>medium</b>提交风险标签</span></div>${probeTable()}<div class="case-report"><h3>结构检查 / check</h3><p>独立运行循环导入检查：cycleCount=0，enumeration=complete。这里只验证静态导入规则，和业务金额测试是两类证据。</p></div>`;
    }
    if(['rename','api','pdg'].includes(mode)){
      const rendered=renderAdvanced();insight=rendered.insight;html=rendered.html;
    }
    if(mode==='agent'){
      const steps=[['query','先定位运费实现','关键词返回流程、符号与定义'],['context','检查函数上下文','确认两个直接调用者和定义'],['impact','调查上游影响','把 4 个返回项分层组织'],['detect_changes','检查实际修改','1 文件 → 1 函数 → 1 流程'],['tests + analyze','验证行为并维护索引','图谱上下文需要测试和新索引配合']];
      const notes=[`关键词查询命中 ${data.searches[0].result.processes.length} 条流程，相关实现包含 services/shipping.ts。`, 'context(calculateShipping) 实际返回 checkoutOrder 和 estimateOrder；通过它们可以继续调查下单与报价。','impact 的第 1 层有 checkoutOrder / estimateOrder，第 2 层还有 submitOrder 和 verify.ts；回归范围不应只看一个文件。','免邮门槛改为 12000 后，detect_changes 将差异映射到 calculateShipping 与 3 步的运费流程。','新增业务探针实际运行改动前后金额；代码修改后应重新 analyze 更新索引。本页没有运行 AI 修复或测量 Token 收益。'];
      insight='<b>工具负责提供结构证据，AI 继续读代码、做修改并验证。</b>这条任务由真实查询记录与教学讲解组成，不把图谱查询包装成已完成的 AI 推理。';
      html=`<div class="agent-steps">${steps.map(([tool,title,copy],i)=>`<button data-agent-step="${i}" class="${agentStep===i?'active':''}"><span>${i+1}</span><div>${title}<small>${tool} · ${copy}</small></div></button>`).join('')}</div><div class="readout">${esc(notes[agentStep])}</div>`;
    }
    $('mode-insight').innerHTML=insight;$('mode-results').innerHTML=html;
  }
  function probeTable(){
    if(!probes)return '<p class="summary-text">业务探针记录正在准备。</p>';
    return `<div class="case-report"><h3>真实业务探针：改动前后金额</h3><p>以下是执行结算源码的结果，不是 GitNexus 预测。它说明“找出影响范围”之后为什么仍要验证业务。</p><table class="mini-table"><thead><tr><th>输入场景</th><th>原运费 / 新运费</th><th>原总价 / 新总价</th></tr></thead><tbody>${probes.cases.map(c=>`<tr><td>${esc(c.label)}</td><td>¥${(c.before.shipping/100).toFixed(2)} / ¥${(c.after.shipping/100).toFixed(2)}</td><td>¥${(c.before.total/100).toFixed(2)} / ¥${(c.after.total/100).toFixed(2)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function renderAdvanced(){
    const view=advanced?.views?.[mode];
    if(!view)return {insight:'高级样本正在加载。此区域将显示独立实跑结果，基础索引保持原样。',html:'<p class="summary-text">若持续无法加载，请打开高级案例原始记录。</p>'};
    const raw=(result,title)=>`<details class="case-report"><summary>${title} · 原始输出</summary><pre>${esc(JSON.stringify(result,null,2))}</pre><a href="advanced.json" target="_blank">完整高级实验记录 ↗</a></details>`;
    if(mode==='rename'){
      const result=view.details;
      return {insight:'<b>这是固定 npm 分发的实际 dry-run。</b>4 处 graph 候选之外，它还把字符串中的提及列为 1 处 text_search 候选。两类证据要分别检查，不能把文字命中当成可靠绑定。',html:`<div class="rename-heading"><code>calculateShipping</code><span>→</span><code>computeShippingFee</code></div><div class="split-stats"><span><b>${result.files_affected}</b>涉及文件</span><span><b>${result.total_edits}</b>候选编辑</span><span><b>${result.graph_edits}</b>graph</span><span><b>${result.text_search_edits}</b>text_search</span></div>${result.edits.map((edit,i)=>`<div class="diff-view rename-edit" data-edit-index="${i}"><div class="diff-heading"><button data-edit="${i}">${esc(edit.file)} : ${edit.line} ↗</button><span class="status-pill${edit.classification==='text_search'?' pending':''}">${esc(edit.classification)}</span></div><div class="diff-line old">− ${esc(edit.oldText)}</div><div class="diff-line new"><button data-edit="${i}">+ ${esc(edit.newText)}</button></div></div>`).join('')}<div class="case-report"><h3>预览是否写入了文件？</h3><p>applied=${result.applied}。采集器比较预览前后源码哈希，源文件未改变。点击差异行只联动本展厅图谱和源码。</p></div>${raw(advanced.results.rename,'rename')}`};
    }
    if(mode==='api'){
      const details=view.details,result=details[advancedTab];let html='',insight='';
      if(advancedTab==='route_map'){
        insight='<b>绿色连线只画真实识别出的 FETCHES / HANDLES_ROUTE。</b>POST 的客户端已连到处理器；GET 参数路由的两个客户端没有被关联，图中也不会补造连线。';
        html=`<div class="result-head">实际识别的 API 路由<small>${result.total} 条 · 静态结果</small></div>`+result.routes.map(route=>`<div class="case-report"><h3><button class="route-button" data-select="${esc('Route:'+route.method+' '+route.route)}">${route.method} ${esc(route.route)} ↗</button></h3><p>处理器：<button class="inline-code" data-select="${esc('File:'+route.handler)}">${esc(route.handler)}</button></p><p>识别的消费者：${route.consumers.length?route.consumers.map(c=>`<button class="inline-code" data-select="${esc('File:'+c.filePath)}">${esc(c.filePath)} ↗</button>`).join(''):'0'}</p>${route.route.includes(':id')?'<p class="gap-note">未覆盖：样本中实际有 /api/orders/42 字面量请求和动态 URL 请求，本次均没有连上参数路由。</p>':''}</div>`).join('')+`<div class="case-report"><h3>查看未关联的真实客户端源码</h3>${details.uncoveredClients.map(path=>`<button class="entity-link" data-select="${esc('File:'+path)}">${esc(path)} ↗</button>`).join('')}</div>`;
      }
      if(advancedTab==='shape_check'){
        const route=result.routes[0],mismatch=details.mismatches[0];insight='<b>让字段偏差直接显形。</b>消费者读取 receiptId，提供者返回 orderId / total / status。工具报告 1 个 MISMATCH；点击字段可定位到真实源码行。';
        html=`<div class="shape-compare"><article><span>客户端读取</span><h3>client/create-order.ts</h3>${route.consumers[0].accessedKeys.map(field=>`<button class="field-chip ${field==='receiptId'?'mismatch':''}" data-code-file="${mismatch.consumer}" data-code-line="${mismatch.consumerLine}">${field}${field==='receiptId'?' ⚠':''}</button>`).join('')}</article><div class="shape-divider">↔</div><article><span>服务端返回</span><h3>server/create-order.ts</h3>${route.responseKeys.map(field=>`<button class="field-chip" data-code-file="${mismatch.provider}" data-code-line="${mismatch.providerLine}">${field}</button>`).join('')}</article></div><div class="case-report"><span class="status-pill pending">MISMATCH / high</span><h3>receiptId 没有出现在响应字段中</h3><p>同名 total 有对应返回；receiptId 与 orderId 存在命名偏差。点击两侧字段，在图和源码中检查消费位置与 res.json。</p><button class="inline-button" data-shape-focus="true">同时高亮客户端、路由和服务端</button></div>`;
      }
      if(advancedTab==='api_impact'){
        insight='<b>围绕一个接口调查消费者。</b>api_impact 把响应字段、消费者和不匹配一起返回；本样本没有返回关联执行流程。';
        html=`<div class="case-report"><h3>${esc(result.method)} ${esc(result.route)}</h3><div class="split-stats"><span><b>${result.impactSummary.directConsumers}</b>直接消费者</span><span><b>${result.impactSummary.affectedFlows}</b>关联流程</span><span><b>${result.impactSummary.riskLevel}</b>工具风险</span></div><p>响应 success 字段：${result.responseShape.success.map(esc).join(' / ')}</p>${result.consumers.map(c=>`<button class="entity-link" data-select="${esc('File:'+c.file)}">${esc(c.file)}<small>访问 ${c.accesses.map(esc).join(' / ')}</small></button>`).join('')}<p class="gap-note">返回字段变化需要复查 receiptId 的消费。没有关联流程不代表没有业务影响。</p></div>`;
      }
      if(advancedTab==='tool_map'){
        insight='<b>不只有 HTTP 路由。</b>本次识别到 Python FastMCP 的 quote_shipping 工具定义，并保留工具说明与处理函数位置。';
        html=result.tools.map(tool=>`<div class="case-report"><span class="status-pill">tool_map / ${result.total}</span><h3>${esc(tool.name)}</h3><p>${esc(tool.description)}</p><button class="entity-link" data-select="${esc('Function:'+tool.filePath+':'+tool.name)}">打开处理函数<small>${esc(tool.filePath)}</small></button><p>本次工具定义没有返回关联流程。</p></div>`).join('');
      }
      return {insight,html:html+raw(result,advancedTab)};
    }
    const details=view.details;
    if(pdgTab==='controls')return {insight:'<b>控制依赖回答“哪条判断决定后续语句能否执行”。</b>点一个分支关系，在图上高亮 CDG 的两端，并定位到被控制语句。T / F 是工具返回的分支标签。',html:`<div class="result-head">实际控制依赖<small>${details.controls.total} 条</small></div><div class="dependence-list">${details.controls.results.map(row=>`<button data-dependency="CDG" data-from="${row.controller.line}" data-to="${row.dependent.line}"><span>L${row.controller.line} <b>${row.label}</b> → L${row.dependent.line}</span><code>${esc(row.dependent.text)}</code></button>`).join('')}</div>${raw(advanced.results.pdg_controls,'pdg_query / controls')}`};
    if(pdgTab==='flows')return {insight:'<b>数据依赖回答“哪次赋值可能到达这个使用位置”。</b>shipping 的三处定义都可能到达 return shipping；点一项查看 REACHING_DEF 的实际两端。',html:`<div class="result-head">变量 shipping 的 def → use<small>${details.flows.total} 条</small></div><div class="dependence-list">${details.flows.results.map(row=>`<button data-dependency="REACHING_DEF" data-from="${row.def.line}" data-to="${row.use.line}"><span>L${row.def.line} → L${row.use.line} <b>${esc(row.variable)}</b></span><code>${esc(row.use.text)}</code></button>`).join('')}</div>${raw(advanced.results.pdg_flows,'pdg_query / flows')}`};
    const names={unsafe:'直接传递',safe:'编码处理',wrapped:'跨函数传递',callback:'回调漏报'},keys={unsafe:'explain_unsafe',safe:'explain_safe',wrapped:'explain_wrapped',callback:'explain_callback'};
    const result=advanced.results[keys[taintCase]],anchor=result.anchor,findings=result.findings;
    const insight=taintCase==='callback'?'<b>这是明确保留的漏报。</b>输入进入回调中的 res.send，但本次 explain 返回 0；它不覆盖 closure / callback 流，空结果不能当作安全证明。':taintCase==='safe'?'<b>编码处理对照。</b>本样本中解析到了 SANITIZES 边，explain 没有返回同类发现；这只描述本次静态结果。':'<b>追踪 source → sink 的静态线索。</b>点步骤查看传递位置；跨函数 finding 的原始零基行号已通过图中函数位置换成编辑器行号。';
    const steps=findings.flatMap(f=>f.hops.map(h=>{const functionNode=f.interprocedural?view.nodes.find(n=>n.kind==='Function'&&n.name===h.function):null;return {line:functionNode?.startLine||h.line,name:h.variable||h.function};}));
    return {insight,html:`<div class="case-tabbar taint-cases">${Object.entries(names).map(([key,label])=>`<button data-taint="${key}" class="${taintCase===key?'active':''}">${label}</button>`).join('')}</div><div class="case-report"><span class="status-pill${taintCase==='callback'?' pending':''}">${result.totalFindings} 个 finding</span><h3>${esc(anchor.symbol)}</h3>${steps.length?`<div class="flow-timeline">${steps.map((step,i)=>`<button data-code-file="security/preview.ts" data-code-line="${step.line}"><span>${i+1}</span>${esc(step.name)} · L${step.line}</button>`).join('')}</div>`:'<p>工具没有返回传播链。请查看源码与图中已持久化的边。</p>'}<button class="entity-link" data-select="${esc('Function:security/preview.ts:'+anchor.symbol)}">查看完整函数源码 ↗<small>security/preview.ts : ${anchor.startLine}</small></button>${taintCase==='unsafe'?'<p>三个传递行位于同一个 BasicBlock；图中的 TAINTED 自环来自真实存储，步骤用于展开该块内的行。</p>':''}</div>${raw(result,'explain')}`};
  }
  function renderCoverage(){
    const cards=[
      ['图谱与数据库','analyze / cypher / schema','源码实体、跨文件关系、节点类型、图查询。','71/131 全图、文件与业务视角已实跑。','overview','已验证 · 小样本',''],
      ['模块与流程','clusters / processes','自动分组、跨组关系和候选流程。','4 分组、4 条静态候选流程；播放为展厅交互。','communities','已验证 · 小样本',''],
      ['符号上下文','context / trace','定义、引用、调用者与有向路径。','10 个函数真实 context，入口到存储路径。','context','已验证 · 小样本',''],
      ['检索','query / grep / read_file','关键词、工作区查找、文件内容与可选语义召回。','3 次 FTS 查询已跑；未验证 embeddings 或全部检索工具。','search','部分验证 · FTS','limited'],
      ['影响与提交','impact / detect_changes / check','深度分层、Git diff 关联流程、结构检查。','10 个函数影响查询、规则变更和循环检查；不代表全部检查规则已覆盖。','changes','已验证 · 指定案例',''],
      ['重命名','rename','图谱绑定与文本匹配候选的改名差异预览。','4 文件 / 5 候选，仅 dry-run；含 1 项 text_search，未验证实际写入。','rename','部分验证 · 仅预览','limited'],
      ['API 与工具','route_map / tool_map / shape_check / api_impact','请求到处理器、字段使用、工具定义与接口影响。','3 路由、1 条客户端关联、1 个字段偏差；参数 URL 未关联。','api','已实跑 · 有缺口','limited'],
      ['语句与数据流','pdg_query / explain','控制依赖、到达定义与已保存的污点线索。','独立 --pdg 样本，7 条控制 / 3 条变量依赖；回调案例漏报。','pdg','已实跑 · 有缺口','limited'],
      ['仓库组','list_repos / group_list / group_sync','索引发现、契约注册与跨仓库连接。','跨仓库组与契约关联未实跑；单仓库 API 案例不能替代该验证。','api','尚未验证 · 跨仓库','pending'],
      ['AI 与文档','MCP / wiki / Web chat','工具调用、图谱上下文和模型生成模块文档。','工具结果已保存；Agent 步骤为教学编排，未做真实模型任务或 Wiki 生成。','agent','尚未验证 · 模型闭环','pending'],
      ['更新与运行','analyze / branch / auto-sync / serve','维护索引、分支索引和本地 HTTP / MCP 入口。','小样本 analyze 已跑；分支、自动同步、长期维护及 serve 未验证。','overview','部分验证 · 仅建索引','limited'],
      ['实际使用入口','CLI / MCP / official Web UI','研究页帮助理解；官方环境可分析自己的仓库。','CLI 工具已跑；MCP 接入真实 Agent 与官方 Web 完整流程未验证。','agent','部分验证 · CLI 工具','limited']
    ];
    $('coverage-panel').innerHTML='<div class="coverage-grid">'+cards.map(([title,tools,description,status,target,label,level])=>`<article class="coverage-card"><span class="status-pill ${level}">${label}</span><h2>${title}</h2><code>${tools}</code><p>${description}</p><p>${status}</p><button data-go-mode="${target}">${level==='pending'?'查看相关工作流与条件':'打开对应案例'} →</button></article>`).join('')+'</div><div class="case-report"><h3>把实际产出与展示方式分开理解</h3><p>核心是代码知识索引、分析与 AI 工具接入；GitNexus 产生图谱、查询结果和工具输出，本展厅用图、颜色、播放和源码联动帮助理解。公开站点只回放保存结果。理解能力与初步选型已有依据，真实大型项目的关系完整性、索引成本与任务收益仍需验证。</p><p><a href="#understanding">核心定位与三类验证范围 ↑</a> · <a href="https://gitnexus.vercel.app/" target="_blank" rel="noreferrer">官方 Web UI ↗</a> · <a href="../references/advanced-run-report.md" target="_blank">高级案例与边界 ↗</a></p></div>';
  }
  function render(){
    if(!data)return;renderNav();renderControls();$('graph-scope').value=['communities','rename','api','pdg'].includes(mode)?'case':scope;
    $('graph-scope').disabled=['communities','rename','api','pdg'].includes(mode);
    $('work-grid').hidden=mode==='coverage';$('coverage-panel').hidden=mode!=='coverage';
    if(mode==='coverage'){renderCoverage();return;}
    drawGraph();renderResults();renderInspector();
  }
  const tour=[
    ['overview','从整仓开始','这张图保留全部 71 个实体与 131 条边。可切换文件视角，观察导入关系。'],
    ['communities','识别功能分组','选 Services / comm_1：saveOrder 虽然在 storage 目录，也属于这个分组。'],
    ['context','查清运费上下文','calculateShipping 有两个直接调用者。点右侧源码，再沿调用者继续调查。'],
    ['flows','逐步走一条流程','点“逐步播放”，看下单、结算、运费依次亮起。它是静态路径，没有记录线上耗时。'],
    ['impact','展开修改范围','把深度从 1 拉到 2：除了结算与报价，入口和 verify.ts 也出现在结果中。'],
    ['search','让检索回到结构','切换库存查询，再点命中卡片，观察实体与源码的位置。'],
    ['changes','放入一行真实修改','点击绿色 diff 行。门槛变化关联到了函数与流程，金额探针展示业务差异。'],
    ['rename','检查改名覆盖','进入独立高级样本，检查实际编辑位置；dry-run 只预览，不写文件。'],
    ['api','连接接口两端','在路由、字段、接口影响与工具定义之间切换，查看成功识别和未覆盖部分。'],
    ['pdg','深入到语句依赖','函数调用图继续细化为控制和数据依赖。静态污点线索要结合源码解释。'],
    ['agent','把工具交给编程助手','逐项查看 query → context → impact → detect_changes，理解工具如何为开发任务提供证据。'],
    ['coverage','回到能力全景','检查每项能力的用途、条件与本次覆盖；分析新仓库需进入官方 CLI / MCP / Web UI。']
  ];
  function showTour(index){tourIndex=Math.max(0,Math.min(index,tour.length-1));const [next,title,copy]=tour[tourIndex];setMode(next);$('tour-banner').hidden=false;$('tour-number').textContent=`GUIDED TOUR / ${tourIndex+1} OF ${tour.length}`;$('tour-title').textContent=title;$('tour-copy').textContent=copy;$('tour-prev').disabled=tourIndex===0;$('tour-next').textContent=tourIndex===tour.length-1?'完成导览 ✓':'下一步 →';}
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.mode)));
  $('mobile-mode').innerHTML=[...document.querySelectorAll('[data-mode]')].map(button=>`<option value="${button.dataset.mode}">${esc(button.childNodes[1]?.textContent||button.textContent)}</option>`).join('');
  $('mobile-mode').addEventListener('change',event=>setMode(event.target.value));
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.select)selectNode(button.dataset.select,{source:true});
    if(button.dataset.searchHit){selectNode(button.dataset.searchHit,{source:true});renderResults();}
    if(button.dataset.flowStep!==undefined){stopPlayback();flowStep=Number(button.dataset.flowStep);selected=extra.processes.find(p=>p.id===processId).steps[flowStep].id;drawGraph();renderResults();renderInspector();showSource();}
    if(button.dataset.diffLine){changed=true;selectNode(shipping,{source:true});}
    if(button.dataset.change){changed=button.dataset.change==='after';render();}
    if(button.dataset.agentStep!==undefined){agentStep=Number(button.dataset.agentStep);selected=shipping;drawGraph();renderResults();renderInspector();}
    if(button.dataset.goMode)setMode(button.dataset.goMode);
    if(button.dataset.advanced){advancedTab=button.dataset.advanced;advancedFocus=new Set();sourceLine=null;const graph=graphForMode();if(!graph.nodes.some(n=>n.id===selected))selected=graph.nodes[0]?.id;render();}
    if(button.dataset.pdg){pdgTab=button.dataset.pdg;advancedFocus=new Set();sourceLine=null;const graph=graphForMode();selected=graph.nodes.find(n=>n.kind==='Function')?.id||graph.nodes[0]?.id;render();}
    if(button.dataset.taint){taintCase=button.dataset.taint;advancedFocus=new Set();sourceLine=null;selected='Function:security/preview.ts:'+({unsafe:'unsafePreview',safe:'safePreview',wrapped:'wrappedPreview',callback:'callbackPreview'}[taintCase]);render();}
    if(button.dataset.edit!==undefined){const edit=advanced.views.rename.details.edits[Number(button.dataset.edit)];selectCode(edit.filePath,edit.line);document.querySelectorAll('.rename-edit').forEach((item,i)=>item.classList.toggle('active',i===Number(button.dataset.edit)));}
    if(button.dataset.codeLine)selectCode(button.dataset.codeFile,Number(button.dataset.codeLine));
    if(button.dataset.shapeFocus){advancedFocus=new Set(['File:client/create-order.ts','Route:POST /api/orders','File:server/create-order.ts']);selected='Route:POST /api/orders';drawGraph();renderInspector();}
    if(button.dataset.dependency){
      const from=Number(button.dataset.from),to=Number(button.dataset.to);const candidates=advanced.views.pdg.nodes;
      const matching=currentEdges.filter(edge=>edge.type===button.dataset.dependency&&candidates.find(n=>n.id===edge.source)?.startLine===from&&candidates.find(n=>n.id===edge.target)?.startLine===to);
      advancedFocus=new Set(matching.flatMap(edge=>[edge.source,edge.target]));
      selectCode('services/shipping.ts',to,false);drawGraph();
    }
    if(button.dataset.traceSave){stopPlayback();flowStep=-1;const ids=['Function:routes/order.ts:submitOrder','Function:services/checkout.ts:checkoutOrder','Function:storage/orders.ts:saveOrder'];litNodes=new Set(ids);selected=ids[2];drawGraph();svg.querySelectorAll('.atlas-node').forEach(g=>{const active=ids.includes(g.dataset.nodeId);g.classList.toggle('dim',!active);g.classList.toggle('lit',active);});svg.querySelectorAll('.graph-edge').forEach((path,i)=>{const edge=currentEdges[i];const active=ids.indexOf(edge.source)>=0&&ids.indexOf(edge.target)===ids.indexOf(edge.source)+1;path.classList.toggle('lit',active);path.classList.toggle('dim',!active);});renderInspector();showSource();$('mode-insight').innerHTML='<b>真实 trace 路径：</b>submitOrder → checkoutOrder → saveOrder，共 2 跳；现在高亮的是这条保存的路径。';}
  });
  function selectCode(file,line,focusNeighbors=true){
    const candidates=currentNodes.filter(n=>n.filePath===file);
    const node=candidates.find(n=>n.kind==='BasicBlock'&&n.startLine===line)||candidates.find(n=>n.kind==='BasicBlock'&&n.startLine<=line&&n.endLine>=line)||candidates.find(n=>n.kind==='File')||candidates.find(n=>n.kind==='Function')||candidates[0];
    if(!node)return;selected=node.id;sourceLine=line;
    if(focusNeighbors){advancedFocus=new Set([node.id]);currentEdges.forEach(e=>{if(e.source===node.id)advancedFocus.add(e.target);if(e.target===node.id)advancedFocus.add(e.source);});}
    drawGraph();renderInspector();showSource();
  }
  $('graph-scope').addEventListener('change',event=>{scope=event.target.value;neighbors=false;drawGraph();renderInspector();});
  $('graph-search').addEventListener('input',event=>{
    queryText=event.target.value;drawGraph();
    if(queryText.trim())$('mode-results').innerHTML=`<div class="result-head">当前图谱实体查找<small>${currentNodes.length} 个匹配；浏览器内筛选</small></div><div class="result-grid">${currentNodes.map(n=>`<article class="result-card"><button data-select="${esc(n.id)}">${esc(n.name)}</button><p>${esc(n.filePath||n.id)}</p><small>${esc(n.kind)}</small></article>`).join('')}</div>`;
    else renderResults();
  });
  $('expand-neighbors').addEventListener('click',()=>{neighbors=true;drawGraph();renderInspector();});
  $('clear-focus').addEventListener('click',()=>{neighbors=false;touched=false;queryText='';$('graph-search').value='';drawGraph();renderResults();});
  $('source-toggle').addEventListener('click',()=>{$('source-box').hidden?showSource():$('source-box').hidden=true;});
  $('source-close').addEventListener('click',()=>{$('source-box').hidden=true;});
  function applyViewport(){svg.setAttribute('viewBox',`${vx} ${vy} ${1000/zoom} ${650/zoom}`);$('zoom-reset').textContent=Math.round(zoom*100)+'%';}
  function setZoom(next){next=Math.max(.55,Math.min(3.5,next));const oldW=1000/zoom,oldH=650/zoom;vx+=oldW/2-500/next;vy+=oldH/2-325/next;zoom=next;applyViewport();}
  $('zoom-in').addEventListener('click',()=>setZoom(zoom*1.25));$('zoom-out').addEventListener('click',()=>setZoom(zoom/1.25));$('zoom-reset').addEventListener('click',()=>{zoom=1;vx=0;vy=0;applyViewport();});
  svg.addEventListener('wheel',event=>{event.preventDefault();setZoom(zoom*(event.deltaY>0?.9:1.1));},{passive:false});
  svg.addEventListener('pointerdown',event=>{if(event.target.closest('.atlas-node'))return;drag={x:event.clientX,y:event.clientY,vx,vy};svg.setPointerCapture(event.pointerId);});
  svg.addEventListener('pointermove',event=>{if(!drag)return;const rect=svg.getBoundingClientRect();vx=drag.vx-(event.clientX-drag.x)/rect.width*1000/zoom;vy=drag.vy-(event.clientY-drag.y)/rect.height*650/zoom;applyViewport();});
  svg.addEventListener('pointerup',()=>{drag=null;});svg.addEventListener('pointercancel',()=>{drag=null;});
  svg.addEventListener('keydown',event=>{
    const moves={ArrowLeft:[-45,0],ArrowRight:[45,0],ArrowUp:[0,-45],ArrowDown:[0,45]};
    if(moves[event.key]){event.preventDefault();vx+=moves[event.key][0]/zoom;vy+=moves[event.key][1]/zoom;applyViewport();}
  });
  $('tour-start').addEventListener('click',()=>showTour(0));$('tour-prev').addEventListener('click',()=>showTour(tourIndex-1));$('tour-next').addEventListener('click',()=>{if(tourIndex===tour.length-1){$('tour-banner').hidden=true;tourIndex=-1;}else showTour(tourIndex+1);});$('tour-close').addEventListener('click',()=>{$('tour-banner').hidden=true;tourIndex=-1;});
  window.addEventListener('beforeunload',stopPlayback);
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.data?.type!=='gitnexus-demo'||!info[event.data.mode])return;
    if(['route_map','shape_check','api_impact','tool_map'].includes(event.data.detail))advancedTab=event.data.detail;
    requestedMode=event.data.mode;if(data)setMode(requestedMode);
  });
  async function get(name,optional=false){const response=await fetch(name+'.json');if(!response.ok){if(optional)return null;throw Error(name+': '+response.status);}return response.json();}
  Promise.all([get('atlas'),get('showcase'),get('evidence'),get('advanced',true),get('business-probes',true)]).then(([a,b,c,d,e])=>{data=a;extra=b;evidence=c;advanced=d;probes=e;if(data.status!=='verified')throw Error('Unverified graph');$('run-state').textContent=`npm ${data.version} · ${advanced?'2':'1'} 组样本 · 实跑回放`;document.documentElement.dataset.ready='true';requestedMode?setMode(requestedMode):render();}).catch(error=>{$('run-state').textContent='运行记录加载失败';$('mode-title').textContent='暂时无法读取真实图谱';$('mode-description').textContent='请通过 HTTP 访问并刷新，或打开原始记录。'+error.message;document.documentElement.dataset.ready='error';});
})();
