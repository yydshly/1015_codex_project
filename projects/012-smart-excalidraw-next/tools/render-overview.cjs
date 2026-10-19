const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const basename='smart-excalidraw-understanding-20261020';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1920,height:1200},deviceScaleFactor:1});
  const svg=await fs.readFile(path.join(root,'assets',basename+'.svg'),'utf8');
  await page.setContent('<!doctype html><html lang="zh-CN"><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#f8f7f3}svg{display:block}</style><body>'+svg+'</body></html>');
  await page.evaluate(()=>document.fonts.ready);
  const report=await page.evaluate(()=>{
   const texts=[...document.querySelectorAll('text')];
   const boxes=texts.filter(e=>e.textContent).map(e=>{const b=e.getBoundingClientRect();return{text:e.textContent,x:b.x,y:b.y,width:b.width,height:b.height};});
   return {date:'2026-10-20',method:'Original SVG diagram; browser-rendered PNG, not an ImageGen output',width:1920,height:6880,textCount:texts.length,outOfBounds:boxes.filter(b=>b.x<65||b.x+b.width>1855||b.y<0||b.y+b.height>6880)};
  });
  await fs.writeFile(path.join(root,'references','overview-verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report));
  await page.screenshot({path:path.join(root,'assets',basename+'.png'),fullPage:true,timeout:60000});
  for(const [name,y,height] of [['top',0,2300],['middle',2300,1700],['bottom',4000,2880]]){
   await page.setViewportSize({width:1920,height});
   await page.evaluate(top=>window.scrollTo(0,top),y);
   await page.screenshot({path:path.join(root,'assets',`overview-detail-${name}.png`),timeout:60000});
  }
  console.log('PNG and three QA views rendered.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
