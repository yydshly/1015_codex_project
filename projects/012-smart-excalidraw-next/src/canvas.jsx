import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Excalidraw, convertToExcalidrawElements, exportToSvg, serializeAsJSON} from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';

// Resolve fonts relative to the bundle for both local and Pages subpaths.
window.EXCALIDRAW_ASSET_PATH = new URL('./', import.meta.url).href;
const palette={purple:['#eee8fa','#7962b5'],orange:['#fff0de','#c48a52'],green:['#e5f2e8','#5b9470'],rose:['#fae6e7','#bb7f83'],gray:['#f0efec','#a09d95']};

function toElements(scene){
  const nodes=scene.nodes.map(([id,text,x,y,width,height,tone,type='rectangle'])=>({
    id:`${scene.id}-${id}`,type,x,y,width,height,
    backgroundColor:palette[tone][0],strokeColor:palette[tone][1],
    fillStyle:'solid',strokeWidth:1.5,roughness:.6,
    roundness:{type:3},label:{text,fontFamily:2,fontSize:20,strokeColor:'#453d51',textAlign:'center'}
  }));
  const arrows=scene.edges.map(([from,to,text],i)=>{
    const a=nodes.find(n=>n.id===`${scene.id}-${from}`),b=nodes.find(n=>n.id===`${scene.id}-${to}`);
    const ax=a.x+a.width/2,ay=a.y+a.height/2,bx=b.x+b.width/2,by=b.y+b.height/2;
    let x,y,endX,endY;
    if(Math.abs(bx-ax)>Math.abs(by-ay)){
      x=ax+Math.sign(bx-ax)*(a.width/2+8);y=ay;endX=bx-Math.sign(bx-ax)*(b.width/2+8);endY=by;
    }else{
      x=ax;y=ay+Math.sign(by-ay)*(a.height/2+8);endX=bx;endY=by-Math.sign(by-ay)*(b.height/2+8);
    }
    return {type:'arrow',id:`${scene.id}-arrow-${i}`,x,y,width:endX-x||1,height:endY-y,
      start:{id:a.id},end:{id:b.id},strokeColor:'#a297b4',strokeWidth:1.6,roughness:.6,
      ...(text?{label:{text,fontSize:16,fontFamily:2,strokeColor:'#746181'}}:{})};
  });
  return convertToExcalidrawElements([...nodes,...arrows],{regenerateIds:false});
}
function download(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}

function Workbench(){
  const [api,setApi]=useState(null);
  const current=useRef(null);
  const modified=useRef(false);
  const applying=useRef(false);
  const initial=useRef(null);
  if(!initial.current)initial.current={elements:toElements(window.researchCurrentScene||window.RESEARCH.scenarios[0]),appState:{viewBackgroundColor:'#ffffff',currentItemFontFamily:2,gridSize:null},scrollToContent:true};
  useEffect(()=>{
    if(!api)return;
    let fitTimer,resizeTimer;
    const load=scene=>{
      if(!scene)return;current.current=scene;applying.current=true;modified.current=false;
      const elements=toElements(scene);
      api.updateScene({elements,appState:{selectedElementIds:{},viewBackgroundColor:'#ffffff'}});
      api.history.clear();
      clearTimeout(fitTimer);
      fitTimer=setTimeout(()=>{api.scrollToContent(elements,{fitToContent:true,viewportZoomFactor:.78,animate:false});applying.current=false;},100);
      document.getElementById('canvas-status').textContent='预设场景示例 · 未调用 AI 模型';
      window.diagramLab.sceneId=scene.id;
    };
    const loadEvent=e=>load(e.detail);
    const exportEvent=async e=>{
      try{
        const elements=api.getSceneElements();
        const state={...api.getAppState(),exportBackground:true,exportWithDarkMode:false};
        if(e.detail==='svg'){
          const svg=await exportToSvg({elements,appState:state,files:api.getFiles(),exportPadding:30});
          download(new Blob([svg.outerHTML],{type:'image/svg+xml;charset=utf-8'}),`${current.current.id}-diagram.svg`);
        }else{
          download(new Blob([serializeAsJSON(elements,state,api.getFiles(),'local')],{type:'application/json'}),`${current.current.id}-diagram.excalidraw`);
        }
        window.researchToast?.('已导出当前画布，包含你的修改');
      }catch(error){window.researchToast?.(`导出失败：${error.message}`);}
    };
    window.diagramLab={ready:true,sceneId:null,getElements:()=>api.getSceneElements(),getAppState:()=>api.getAppState(),load};
    window.addEventListener('research:scene',loadEvent);window.addEventListener('research:reset',loadEvent);window.addEventListener('research:export',exportEvent);
    load(window.researchCurrentScene||window.RESEARCH?.scenarios[0]);
    const observer=new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{const elements=api.getSceneElements();if(elements.length)api.scrollToContent(elements,{fitToContent:true,viewportZoomFactor:.78,animate:false});},180);});
    observer.observe(document.getElementById('canvas-root'));
    return()=>{observer.disconnect();clearTimeout(resizeTimer);clearTimeout(fitTimer);window.removeEventListener('research:scene',loadEvent);window.removeEventListener('research:reset',loadEvent);window.removeEventListener('research:export',exportEvent);};
  },[api]);
  return <Excalidraw excalidrawAPI={setApi} initialData={initial.current} langCode="zh-CN" theme="light" autoFocus={false} handleKeyboardGlobally={false}
    UIOptions={{canvasActions:{loadScene:false,saveToActiveFile:false,export:false,saveAsImage:false,toggleTheme:false,changeViewBackgroundColor:false},tools:{image:false}}}
    onChange={()=>{if(!api||!current.current||applying.current||modified.current)return;modified.current=true;document.getElementById('canvas-status').textContent='当前画布可编辑 · 下载保留当前内容';}}/>;
}

class CanvasBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(error){return {error};}
  render(){return this.state.error?<div className="canvas-loading">画布加载失败，请刷新或使用本地 HTTP 服务打开。</div>:this.props.children;}
}
createRoot(document.getElementById('canvas-root')).render(<CanvasBoundary><Workbench/></CanvasBoundary>);
