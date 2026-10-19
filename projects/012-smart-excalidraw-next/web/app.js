/* Browser-local research exhibition. Sample selection never invokes a model. */
(() => {
  'use strict';
  const R=window.RESEARCH, $=s=>document.querySelector(s);
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const source=path=>`https://github.com/liujuntao123/smart-excalidraw-next/blob/${R.commit}/${path}`;
  const colors={purple:['#eee8fa','#7962b5'],orange:['#fff0de','#c48a52'],green:['#e5f2e8','#5b9470'],rose:['#fae6e7','#bb7f83'],gray:['#f0efec','#a09d95']};
  let scene=R.scenarios[0], mode='text', selectedChart='flowchart', filter='全部';
  let toastTimer;
  function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
  window.researchToast=toast;
  // Compact SVG explanation thumbnails. The large workbench uses actual Excalidraw.
  const rect=(x,y,w,h,color='#e7dff7')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${color}" stroke="#8c81a3" stroke-width="1.2"/>`;
  const line=(x,y,a,b)=>`<path d="M${x} ${y}L${a} ${b}" fill="none" stroke="#9c91b0" stroke-width="1.4"/>`;
  const circle=(x,y,r,c='#e7dff7')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" stroke="#9684b2" stroke-width="1.2"/>`;
  function glyph(type){let s='';
    if(['flowchart','state','dataflow'].includes(type)){s=rect(8,25,25,18)+line(33,34,48,34)+`<path d="M60 19 77 34 60 49 43 34Z" fill="#f9e6cd" stroke="#bd9b71"/>`+line(77,34,95,34)+rect(95,25,25,18,'#deeddf');}
    else if(type==='sequence'){[20,64,108].forEach(x=>{s+=rect(x-11,3,22,13)+`<path d="M${x} 18V65" stroke="#b9adcb" stroke-dasharray="3 3"/>`;});s+=line(20,30,64,30)+line(64,45,108,45)+line(108,57,20,57);}
    else if(type==='swimlane'){s=rect(4,8,122,22,'#f5f0e8')+rect(4,38,122,22,'#eff2eb')+rect(14,13,22,12)+line(36,19,67,48)+rect(67,43,22,12)+line(89,48,104,19)+rect(104,13,16,12);}
    else if(['tree','orgchart','architecture','class'].includes(type)){s=rect(48,4,34,17)+line(65,21,65,34)+line(20,34,110,34);[20,65,110].forEach((x,i)=>{s+=line(x,34,x,46)+rect(x-14,46,28,18,i===1?'#f9e6cd':'#e7dff7');});if(type==='class')s+=line(52,12,78,12);}
    else if(type==='er'){s=rect(4,15,37,38)+rect(88,15,37,38,'#deeddf')+line(41,34,88,34)+line(7,27,38,27)+line(91,27,122,27)+`<text x="53" y="28" font-size="8" fill="#847098">1:N</text>`;}
    else if(['mindmap','concept','network'].includes(type)){[[17,13],[110,13],[17,55],[110,55]].forEach(([x,y])=>{s+=line(65,34,x,y)+circle(x,y,9,'#e9eddd');});s+=circle(65,34,15);if(type==='network')s+=line(17,13,110,13)+line(17,55,110,55);}
    else if(type==='venn'){s=`<circle cx="48" cy="34" r="25" fill="#cabbeb" fill-opacity=".6" stroke="#9684b2"/><circle cx="80" cy="34" r="25" fill="#b9d7c0" fill-opacity=".6" stroke="#7da689"/>`;}
    else if(type==='gantt'){[15,40,65,90,115].forEach(x=>{s+=line(x,6,x,64);});s+=rect(15,12,35,10)+rect(40,29,50,10,'#f9e6cd')+rect(65,46,50,10,'#deeddf');}
    else if(type==='timeline'){s=line(8,34,122,34);[25,65,105].forEach((x,i)=>{s+=circle(x,34,4)+line(x,34,x,i%2?50:17)+rect(x-13,i%2?50:6,26,11,i===1?'#deeddf':'#e7dff7');});}
    else if(type==='fishbone'){s=line(8,34,120,34);[30,65,100].forEach(x=>{s+=line(x,34,x-15,10)+line(x,34,x-15,58);});s+=`<path d="m115 30 7 4-7 4" fill="none" stroke="#9684b2"/>`;}
    else if(type==='swot'||type==='matrix'){[[8,6],[67,6],[8,36],[67,36]].forEach(([x,y],i)=>s+=rect(x,y,53,25,['#e7dff7','#f9e6cd','#deeddf','#f4dedf'][i]));}
    else if(type==='pyramid'||type==='funnel'){[0,1,2].forEach(i=>{const w=type==='pyramid'?30+i*30:90-i*30;s+=rect(65-w/2,8+i*19,w,15,['#e7dff7','#f9e6cd','#deeddf'][i]);});}
    else {s=rect(8,5,114,58,'#fbf9f4')+rect(15,12,45,10)+rect(15,31,24,24,'#f9e6cd')+rect(46,31,24,24,'#deeddf')+rect(77,31,37,24);}
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 130 70" aria-hidden="true">${s}</svg>`;
  }
  function sceneSVG(s){
    const maxX=Math.max(...s.nodes.map(n=>n[2]+n[4]))+35,maxY=Math.max(...s.nodes.map(n=>n[3]+n[5]))+30;
    let content='<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 8 4 0 8" fill="none" stroke="#9990a8" stroke-width="1.2"/></marker></defs>';
    for(const [from,to,label]of s.edges){const a=s.nodes.find(n=>n[0]===from),b=s.nodes.find(n=>n[0]===to);const ax=a[2]+a[4]/2,ay=a[3]+a[5]/2,bx=b[2]+b[4]/2,by=b[3]+b[5]/2;let x1,y1,x2,y2;if(Math.abs(bx-ax)>Math.abs(by-ay)){x1=ax+Math.sign(bx-ax)*a[4]/2;y1=ay;x2=bx-Math.sign(bx-ax)*b[4]/2;y2=by;}else{x1=ax;y1=ay+Math.sign(by-ay)*a[5]/2;x2=bx;y2=by-Math.sign(by-ay)*b[5]/2;}content+=`<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#9990a8" stroke-width="2.5" fill="none" marker-end="url(#arrow)"/>`;if(label)content+=`<text x="${(x1+x2)/2}" y="${(y1+y2)/2-10}" font-size="21" text-anchor="middle" fill="#81748d">${escape(label)}</text>`;}
    for(const [,text,x,y,w,h,tone,type]of s.nodes){const [bg,stroke]=colors[tone];content+=type==='diamond'?`<path d="M${x+w/2} ${y}L${x+w} ${y+h/2}L${x+w/2} ${y+h}L${x} ${y+h/2}Z" fill="${bg}" stroke="${stroke}" stroke-width="2.5"/>`:type==='ellipse'?`<ellipse cx="${x+w/2}" cy="${y+h/2}" rx="${w/2}" ry="${h/2}" fill="${bg}" stroke="${stroke}" stroke-width="2.5"/>`:`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${bg}" stroke="${stroke}" stroke-width="2.5"/>`;const lines=text.split('\n');content+=`<text x="${x+w/2}" y="${y+h/2-(lines.length-1)*15}" font-family="Segoe UI, Microsoft YaHei,sans-serif" font-size="25" text-anchor="middle" dominant-baseline="middle" fill="#51475f">${lines.map((l,i)=>`<tspan x="${x+w/2}" dy="${i?30:0}">${escape(l)}</tspan>`).join('')}</text>`;}
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${maxX} ${maxY}" role="img" aria-label="${escape(s.name)}预设示例">${content}</svg>`;
  }
  const overviewDialog=$('#overview-dialog');
  $('#open-overview').addEventListener('click',()=>{overviewDialog.showModal();});
  $('#close-overview').addEventListener('click',()=>overviewDialog.close());
  overviewDialog.addEventListener('click',e=>{if(e.target===overviewDialog)overviewDialog.close();});
  $('#overview-zoom').addEventListener('click',()=>{const original=$('#overview-full-image').classList.toggle('is-original');$('#overview-zoom').setAttribute('aria-pressed',String(original));$('#overview-zoom').textContent=original?'适应宽度':'原尺寸阅读';});
  overviewDialog.addEventListener('close',()=>{$('#overview-full-image').classList.remove('is-original');$('#overview-zoom').setAttribute('aria-pressed','false');$('#overview-zoom').textContent='原尺寸阅读';});
  function renderInput(){
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    $('#input-image').hidden=mode!=='image';
    $('#input-label').textContent=mode==='text'?'PROMPT / 场景输入示例':mode==='file'?`${scene.id}.md / 文件内容示例`:'REFERENCE / 自绘参考图示意';
    $('#input-content').textContent=mode==='text'?scene.prompt:mode==='file'?scene.file:'识别图中的文字、节点和连接关系，重建为可编辑图表。';
    $('#input-image').innerHTML=mode==='image'?sceneSVG(scene):'';
    $('#input-explanation').textContent=mode==='text'?'把对象、关系和表达目的说清楚，也可以直接粘贴文章。':mode==='file'?'上游读取 MD / TXT 文件为文本，最大 1MB。本页展示样例内容。':'上游需要支持视觉的模型。本页只说明图片输入路径，没有执行识别。';
  }
  function selectScene(id){scene=R.scenarios.find(s=>s.id===id)||R.scenarios[0];const i=R.scenarios.indexOf(scene);window.researchCurrentScene=scene;
    document.querySelectorAll('[data-scene]').forEach(b=>{const yes=b.dataset.scene===id;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});
    $('#scenario-panel').setAttribute('aria-labelledby',`scenario-${scene.id}`);
    $('#scenario-category').textContent=scene.category;$('#scenario-number').textContent=`0${i+1} / 06`;
    $('#scenario-title').textContent=scene.title;$('#scenario-purpose').textContent=scene.purpose;$('#scenario-outcome').textContent=scene.outcome;$('#scenario-check').textContent=scene.check;$('#chart-name').textContent=scene.chart;
    renderInput();window.dispatchEvent(new CustomEvent('research:scene',{detail:scene}));
  }
  $('#scenario-tabs').innerHTML=R.scenarios.map((s,i)=>`<button class="scenario-tab" id="scenario-${s.id}" data-scene="${s.id}" role="tab" aria-controls="scenario-panel" aria-selected="${i===0}" tabindex="${i===0?0:-1}"><span class="scenario-icon" aria-hidden="true">${s.icon}</span><span><strong>${s.name}</strong><small>${s.chart}</small></span></button>`).join('');
  $('#scenario-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-scene]');if(b)selectScene(b.dataset.scene);});
  function tabKeys(container,selector,activate){container.addEventListener('keydown',e=>{const tabs=[...container.querySelectorAll(selector)],index=tabs.indexOf(e.target);if(index<0||!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();activate(tabs[next]);});}
  tabKeys($('#scenario-tabs'),'[data-scene]',b=>selectScene(b.dataset.scene));
  $('#input-modes').addEventListener('click',e=>{const b=e.target.closest('[data-mode]');if(b){mode=b.dataset.mode;renderInput();}});
  $('#copy-input').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(mode==='file'?scene.file:mode==='image'?'请识别所附图片中的文字、节点和连接关系，重建为可编辑图表。':scene.prompt);toast('已复制，可粘贴到上游应用使用');}catch{toast('复制不可用，请直接选中上方文字复制');}});
  $('#reset-canvas').addEventListener('click',()=>{window.dispatchEvent(new CustomEvent('research:reset',{detail:scene}));toast('已恢复当前场景示例');});
  $('#export-svg').addEventListener('click',()=>window.dispatchEvent(new CustomEvent('research:export',{detail:'svg'})));
  $('#export-drawing').addEventListener('click',()=>window.dispatchEvent(new CustomEvent('research:export',{detail:'drawing'})));
  selectScene('refund');
  const categories=['全部',...new Set(R.charts.map(c=>c[2]))];
  $('#atlas-filters').innerHTML=categories.map((c,i)=>`<button data-filter="${c}" aria-pressed="${i===0}">${c}</button>`).join('');
  function selectChart(id){selectedChart=id;const c=R.charts.find(c=>c[0]===id);if(!c)return;$('#chart-detail').innerHTML=`${glyph(c[0])}<span class="pill purple">${c[2]}</span><h3>${c[1]}</h3><p>${c[3]}</p><span class="detail-label">适合的实际场景</span><blockquote>${c[4]}</blockquote><span class="detail-label">可以这样描述</span><blockquote>“${c[5]}”</blockquote><p class="detail-footnote">核对重点：${c[6]}</p>`;document.querySelectorAll('[data-chart]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.chart===id)));}
  function renderCharts(){const q=$('#chart-search').value.trim().toLowerCase(),items=R.charts.filter(c=>(filter==='全部'||c[2]===filter)&&c.join(' ').toLowerCase().includes(q));$('#chart-grid').innerHTML=items.map(c=>`<button class="chart-card" data-chart="${c[0]}" aria-pressed="${c[0]===selectedChart}">${glyph(c[0])}<strong>${c[1]}</strong><small>${c[0].toUpperCase()}</small></button>`).join('');$('#chart-empty').hidden=items.length>0;$('#chart-count').textContent=`显示 ${items.length} / 22 种图表 · 点击查看场景与描述示例`;$('#chart-detail').hidden=items.length===0;if(items.length){if(!items.some(c=>c[0]===selectedChart))selectedChart=items[0][0];selectChart(selectedChart);}}
  $('#atlas-filters').addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderCharts();}});
  $('#chart-search').addEventListener('input',renderCharts);$('#chart-grid').addEventListener('click',e=>{const b=e.target.closest('[data-chart]');if(b)selectChart(b.dataset.chart);});renderCharts();
  $('#pipeline-steps').innerHTML=R.steps.map((s,i)=>`<button id="step-${i}" data-step="${i}" role="tab" aria-controls="pipeline-content" aria-selected="${i===0}" tabindex="${i===0?0:-1}"><span>0${i+1}</span><strong>${s.name}</strong></button>`).join('');
  $('.pipeline-detail').id='pipeline-content';$('.pipeline-detail').setAttribute('role','tabpanel');
  function selectStep(i){const s=R.steps[i];document.querySelectorAll('[data-step]').forEach(b=>{const yes=+b.dataset.step===i;b.setAttribute('aria-selected',String(yes));b.tabIndex=yes?0:-1;});$('.pipeline-detail').setAttribute('aria-labelledby',`step-${i}`);$('#step-label').textContent=`步骤 0${i+1} / 05`;$('#step-title').textContent=s.title;$('#step-description').textContent=s.description;$('#step-file').textContent=s.file;$('#step-source').href=source(s.file);$('#step-code').textContent=s.code;}
  $('#pipeline-steps').addEventListener('click',e=>{const b=e.target.closest('[data-step]');if(b)selectStep(+b.dataset.step);});tabKeys($('#pipeline-steps'),'[data-step]',b=>selectStep(+b.dataset.step));selectStep(0);
  $('#source-list').innerHTML=R.sources.map(([title,path],i)=>`<div class="source-item"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${title}</strong><small>${path}</small></div><a href="${source(path)}" target="_blank" rel="noopener noreferrer">源码 ↗</a><a href="references/upstream/${path}" target="_blank" rel="noopener noreferrer">快照 ↗</a></div>`).join('');
  window.researchLab={selectScene,sceneSVG,glyph,getScene:()=>scene};
})();
