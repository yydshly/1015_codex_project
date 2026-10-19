/* Run with a local Playwright installation (or NODE_PATH pointing to one). */
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const url=process.env.RESEARCH_URL||'http://127.0.0.1:8884/projects/012-smart-excalidraw-next/';
const verificationFile=process.env.VERIFICATION_FILE||'verification.json';
const screenshotPrefix=process.env.SCREENSHOT_PREFIX||'';
const results=[],errors=[],failed=[],external=[];
const pass=(name,detail)=>{results.push({name,passed:true,detail});console.log('PASS',name);};
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true,permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()});});
  page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText}));
  page.on('request',r=>{if(!r.url().startsWith(new URL(url).origin)&&/^https?:/.test(r.url()))external.push(r.url());});
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
  await page.waitForFunction(()=>window.diagramLab?.ready&&window.diagramLab.getElements().length>0,null,{timeout:60000});
  await page.waitForTimeout(500);
  pass('initial native canvas has elements',await page.evaluate(()=>window.diagramLab.getElements().length));
  const crypto=require('node:crypto');
  const guide=await fs.readFile(path.join(root,'assets','smart-excalidraw-understanding-20261020.png'));
  const response=await context.request.get(new URL('assets/smart-excalidraw-understanding-20261020.png',url).href);
  assert.equal(crypto.createHash('sha256').update(await response.body()).digest('hex'),crypto.createHash('sha256').update(guide).digest('hex'));pass('guide uses the exact original PNG');
  await page.locator('#open-overview').click();assert(await page.locator('#overview-dialog').isVisible());pass('full guide modal opens');
  await page.locator('#overview-zoom').click();assert.equal(await page.locator('#overview-full-image').evaluate(e=>e.getBoundingClientRect().width),1920);pass('full guide original-size reading');
  await page.keyboard.press('Escape');assert(!(await page.locator('#overview-dialog').isVisible()));pass('guide closes with Escape');
  assert.equal(await page.locator('#extensions article').count(),6);assert((await page.locator('#extensions').innerText()).includes('需要额外接入和开发'));pass('six grounded extension scenarios');
  const scenes=await page.evaluate(()=>window.RESEARCH.scenarios.map(s=>({id:s.id,texts:s.nodes.map(n=>n[1])})));
  for(const s of scenes){
    await page.locator(`[data-scene="${s.id}"]`).click();
    await page.waitForFunction(id=>window.diagramLab.sceneId===id&&window.diagramLab.getElements().length>0,s.id);
    await page.waitForTimeout(180);
    const data=await page.evaluate(()=>window.diagramLab.getElements().map(e=>({id:e.id,type:e.type,text:e.originalText??e.text,x:e.x,y:e.y,start:e.startBinding?.elementId,end:e.endBinding?.elementId})));
    for(const text of s.texts)assert(data.some(e=>e.text===text),`missing ${s.id}: ${text}`);
    for(const e of data){assert(Number.isFinite(e.x)&&Number.isFinite(e.y));if(e.start)assert(data.some(n=>n.id===e.start));if(e.end)assert(data.some(n=>n.id===e.end));}
    pass(`scene ${s.id}: labels, geometry and bindings`,data.length);
  }
  await page.locator('[data-mode="file"]').click();assert((await page.locator('#input-content').innerText()).startsWith('#'));pass('file input explanation');
  await page.locator('[data-mode="image"]').click();assert(await page.locator('#input-image svg').isVisible());assert((await page.locator('#input-explanation').innerText()).includes('没有执行识别'));pass('image input boundary and reference');
  await page.locator('[data-mode="text"]').click();await page.locator('#copy-input').click();assert((await page.evaluate(()=>navigator.clipboard.readText())).includes('甘特图'));pass('copy scenario prompt');
  const categories=await page.locator('[data-filter]').evaluateAll(bs=>bs.map(b=>b.dataset.filter));
  for(const category of categories){await page.locator(`[data-filter="${category}"]`).click();const expected=await page.evaluate(c=>window.RESEARCH.charts.filter(x=>c==='全部'||x[2]===c).length,category);assert.equal(await page.locator('[data-chart]').count(),expected);pass(`chart filter ${category}`,expected);}
  await page.locator('[data-filter="全部"]').click();await page.locator('#chart-search').fill('ER 图');assert.equal(await page.locator('[data-chart]').count(),1);assert((await page.locator('#chart-detail h3').innerText()).includes('ER'));pass('chart keyword search');
  await page.locator('#chart-search').fill('不存在的类型012');assert(await page.locator('#chart-empty').isVisible());assert(!(await page.locator('#chart-detail').isVisible()));pass('chart empty state');
  await page.locator('#chart-search').fill('');assert.equal(await page.locator('[data-chart]').count(),22);
  for(const id of await page.locator('[data-chart]').evaluateAll(bs=>bs.map(b=>b.dataset.chart))){await page.locator(`[data-chart="${id}"]`).click();assert.equal(await page.locator('#chart-detail h3').innerText(),await page.locator(`[data-chart="${id}"] strong`).innerText());}
  pass('all 22 chart detail selections');
  for(let i=0;i<5;i++){await page.locator(`[data-step="${i}"]`).click();assert((await page.locator('#step-label').innerText()).includes(`0${i+1}`));assert((await page.locator('#step-source').getAttribute('href')).includes('fd139925b01a'));}pass('five source-linked mechanism steps');
  await page.locator('[data-step="0"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-step="1"]').getAttribute('aria-selected'),'true');pass('mechanism keyboard navigation');
  await page.locator('[data-scene="refund"]').click();await page.waitForTimeout(300);
  // Actual pointer drag, followed by edit and export of the mutated native element.
  await page.locator('#canvas-root').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const before=await page.evaluate(()=>{const es=window.diagramLab.getElements();const e=es.find(x=>x.type==='rectangle');const a=window.diagramLab.getAppState();return {id:e.id,x:e.x,y:e.y,width:e.width,height:e.height,zoom:a.zoom.value,scrollX:a.scrollX,scrollY:a.scrollY};});
  const box=await page.locator('#canvas-root .excalidraw__canvas.interactive').boundingBox();
  const x=box.x+(before.x+before.width/2+before.scrollX)*before.zoom;
  const y=box.y+(before.y+before.height/2+before.scrollY)*before.zoom;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+40,y+22,{steps:12});await page.mouse.up();await page.waitForTimeout(250);
  const after=await page.evaluate(id=>{const e=window.diagramLab.getElements().find(x=>x.id===id);return {x:e.x,y:e.y};},before.id);
  assert(Math.abs(after.x-before.x)>20,'native drag did not move the shape');pass('native Excalidraw node drag',after);
  const drawingEvent=page.waitForEvent('download');await page.locator('#export-drawing').click();const drawing=await drawingEvent;const drawingPath=path.join(root,'assets','refund-edited.excalidraw');await drawing.saveAs(drawingPath);const json=JSON.parse(await fs.readFile(drawingPath,'utf8'));assert.equal(json.type,'excalidraw');assert.equal(json.elements.find(e=>e.id===before.id).x,after.x);pass('native export retains actual edit',json.elements.length);
  const svgEvent=page.waitForEvent('download');await page.locator('#export-svg').click();const svgDownload=await svgEvent;const svgPath=path.join(root,'assets','refund-edited.svg');await svgDownload.saveAs(svgPath);const svg=await fs.readFile(svgPath,'utf8');assert(svg.includes('<svg'));assert(svg.includes('提交退款申请'));pass('SVG export contains scene content');
  await page.locator('#reset-canvas').click();await page.waitForTimeout(250);assert.equal(await page.evaluate(id=>window.diagramLab.getElements().find(e=>e.id===id)?.x,before.id),before.x);pass('reset restores original node position');
  // Double-click and type through native canvas UI.
  const point=await page.evaluate(()=>{const es=window.diagramLab.getElements(),t=es.find(e=>e.type==='text'&&e.text==='提交退款申请'),a=window.diagramLab.getAppState();return {x:(t.x+t.width/2+a.scrollX)*a.zoom.value,y:(t.y+t.height/2+a.scrollY)*a.zoom.value};});
  const cb=await page.locator('#canvas-root .excalidraw__canvas.interactive').boundingBox();await page.mouse.dblclick(cb.x+point.x,cb.y+point.y);const editor=page.locator('textarea.excalidraw-wysiwyg');await editor.waitFor({state:'visible',timeout:5000});await editor.fill('提交售后申请');await page.keyboard.press('Escape');assert(await page.evaluate(()=>window.diagramLab.getElements().some(e=>e.type==='text'&&e.text==='提交售后申请')));pass('native text editing');
  await page.locator('#reset-canvas').click();await page.waitForTimeout(250);
  await page.waitForTimeout(2900);
  await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.screenshot({path:path.join(root,'assets',screenshotPrefix+'preview-desktop.png')});
  await page.locator('#scenarios').screenshot({path:path.join(root,'assets',screenshotPrefix+'scenario-desktop.png')});
  await page.locator('#atlas').screenshot({path:path.join(root,'assets',screenshotPrefix+'atlas-desktop.png')});
  for(const width of [1440,1024,768,390,320]){await page.setViewportSize({width,height:900});await page.waitForTimeout(450);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width,`page overflow at ${width}`);const fits=await page.evaluate(()=>{const a=window.diagramLab.getAppState();return window.diagramLab.getElements().filter(e=>['rectangle','ellipse','diamond'].includes(e.type)).every(e=>(e.x+a.scrollX)*a.zoom.value>=0&&(e.x+e.width+a.scrollX)*a.zoom.value<=a.width+1&&(e.y+a.scrollY)*a.zoom.value>=0&&(e.y+e.height+a.scrollY)*a.zoom.value<=a.height+1);});assert(fits,`diagram does not fit at ${width}`);pass(`responsive layout and diagram fit ${width}px`);if(width===390){await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0);});await page.screenshot({path:path.join(root,'assets',screenshotPrefix+'preview-mobile.png')});await page.locator('#scenarios').screenshot({path:path.join(root,'assets',screenshotPrefix+'scenario-mobile.png')});}}
  await page.setViewportSize({width:390,height:900});await page.locator('[data-scene="er"]').click();await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.diagramLab.sceneId),'er');pass('mobile scene selection');
  await page.locator('#open-overview').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.locator('#overview-zoom').click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),390);await page.locator('#close-overview').click();pass('mobile guide scroll stays inside dialog');
  const localUrls=await page.locator('a[href],link[href],script[src]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.href||n.src).filter(h=>h&&h.startsWith(location.origin)&&!h.includes('#')))]);
  for(const href of localUrls){const r=await context.request.get(href);assert.equal(r.status(),200,href);}pass('local resources and documentation',localUrls.length);
  await page.goto(new URL('../../',url).href,{waitUntil:'domcontentloaded'});assert(await page.locator('a.card').filter({hasText:'Smart Excalidraw'}).count());pass('research catalog links to project');
  assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(failed.length,0,JSON.stringify(failed));assert.equal(external.length,0,JSON.stringify(external));pass('no browser errors, failed resources or runtime CDN requests');
  await fs.writeFile(path.join(root,'references',verificationFile),JSON.stringify({date:'2026-10-20',url,scope:'Constructed examples, actual Excalidraw rendering/edit/export; no LLM request',results,errors,failed,external},null,2)+'\n');
  console.log(`Verified ${results.length} checks.`);
 }finally{await browser.close();}
})().catch(async e=>{console.error(e);await fs.writeFile(path.join(root,'references','verification-failure.json'),JSON.stringify({message:e.message,results,errors,failed,external},null,2));process.exit(1);});
