"use strict";
(() => {
  const root = document.getElementById("room-demo");
  if (!root) return;
  const byId = id => document.getElementById(id);
  const tabs = [...root.querySelectorAll("[data-room-step]")];
  const viewport = byId("room-viewport");
  const reference = byId("room-reference");
  const play = byId("room-play");
  const back = byId("room-back");
  const next = byId("room-next");
  const edit = byId("room-edit-controls");
  const layout = byId("room-layout");
  const chairSlider = byId("room-chair-position");
  const stages = [
    {actor:"输入 / 同一张房间图",title:"图片里有物体，还没有独立资产。",description:"原图展示了整个房间。此时椅子和花瓶都只是画面中的像素，不能作为独立物体移动或替换。",badge:"二维房间参考图",hint:"先看原图：桌子、椅子和花瓶，还在同一张画面里。",result:"一张包含背景与物体的房间图，作为后续分析和图片编辑的输入。",boundary:"接下来先确认要独立生成的物体，再为背景和物体准备不同的输入。"},
    {actor:"Claude 理解 → 图片编辑模型",title:"背景清空了，物体也有了各自的参考图。",description:"左边是移除选定物体后的背景；右边把木桌、绿椅、花瓶单独放到干净背景上。背景和物体将进入不同的生成路线。",badge:"清理后的背景图",hint:"桌、椅、花瓶已经从背景移除。右侧是三张独立参考图，仍然是二维图片。",result:"一张 clean plate 背景图，加上三张单物体参考图。",boundary:"真实流程依赖生成式图片编辑，可能补全或改变细节。本演示用预制画面说明拆分，不执行精确抠图。"},
    {actor:"Marble / Hunyuan 或 Meshy",title:"分别生成：一份环境，三个独立模型。",description:"背景图用于生成环境，物体参考图各自用于生成模型。三维视图把资产分开展示，线框让你看见物体的网格结构。",badge:"三维资产 / 分开展示",hint:"可拖动旋转、滚轮缩放。后方点状房间表示环境外观，前方三个物体分别用网格表示。",result:"环境外观与碰撞资产 + 木桌模型 + 绿椅模型 + 花瓶模型。声音还可以单独生成。",boundary:"这里的点状背景和网格都是预制示意，没有调用三维模型。真实 .spz 环境与普通网格物体的表示不同。"},
    {actor:"查看器 / 人工布局与编辑",title:"先放到一起，再调整到合适的位置。",description:"默认先把三个物体排成网格。点击下方“摆入示意位置”，观察它们进入房间；再只移动绿椅，或替换花瓶，其他资产保持独立。",badge:"三维场景 / 可独立调整",hint:"可拖动旋转。先摆入示意位置，再试着只移动椅子或切换花瓶版本。",result:"保留独立资产的可交互场景。修改一个物体，无需把整个场景全部重做。",boundary:"“摆入位置”采用本演示预设值，不能当作上游自动恢复布局。本演示未模拟物理碰撞或调用生成接口。"}
  ];
  let stage = 0;
  let arranged = false;
  let vaseVersion = 0;
  let timer = null;
  let inView = true;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pause = () => {if (timer !== null) window.clearInterval(timer);timer = null;play.textContent = "播放四步过程";play.setAttribute("aria-pressed","false");};
  let renderer, scene, camera, controls, background, points;
  let sourceImage = "", cleanImage = "";
  const assets = {};
  const previews = {};
  const homes = {table:[0,0,-0.3],chair:[1.9,0,1.15],vase:[-0.45,1.34,-0.4]};
  const grid = {table:[-2.25,0,1.35],chair:[0,0,1.35],vase:[2.25,0,1.35]};
  const separated = {table:[-2.7,0,3.6],chair:[0,0,3.6],vase:[2.7,0,3.6]};
  const targets = {};
  let vaseMeshes = [];

  function updateEditState() {
    chairSlider.disabled = !arranged;
    layout.textContent = arranged ? "恢复网格摆放" : "摆入示意位置";
    const offset = Number(chairSlider.value);
    byId("room-chair-value").textContent = offset.toFixed(1);
    byId("room-edit-state").textContent = arranged
      ? `已按预设示意位置摆放；绿椅左右偏移 ${offset.toFixed(1)}，花瓶为预制版本 ${vaseVersion === 0 ? "A" : "B"}。桌子与环境无需重新生成。`
      : `当前为网格初始布局，花瓶为预制版本 ${vaseVersion === 0 ? "A" : "B"}；先摆入房间，再单独移动椅子。`;
  }
  function moveTargets() {
    const positions = stage === 2 ? separated : stage === 3 && !arranged ? grid : homes;
    for (const key of Object.keys(assets)) {
      targets[key].fromArray(positions[key]);
      if (key === "chair" && stage === 3 && arranged) targets[key].x += Number(chairSlider.value);
    }
  }
  function resetCamera() {
    if (!camera) return;
    camera.position.set(...(stage === 2 ? [10,8.7,14.8] : [8.8,7.1,10.8]));
    controls.target.set(0, stage === 2 ? 0.85 : 1.05, stage === 2 ? 0.6 : 0);
    controls.update();
  }
  function selectStage(index, keepPlaying = false) {
    if (!keepPlaying) pause();
    stage = Math.max(0,Math.min(stages.length - 1,index));
    const content = stages[stage];
    root.dataset.roomStage = String(stage);
    for (const [id,key] of [["room-step-actor","actor"],["room-step-title","title"],["room-step-description","description"],["room-view-badge","badge"],["room-view-hint","hint"],["room-result-text","result"],["room-step-boundary","boundary"]]) byId(id).textContent = content[key];
    byId("room-view-number").textContent = `${String(stage+1).padStart(2,"0")} / 04`;
    tabs.forEach((tab,i) => {tab.classList.toggle("active",i===stage);tab.setAttribute("aria-selected",String(i===stage));tab.tabIndex=i===stage?0:-1;});
    byId("room-demo-panel").setAttribute("aria-labelledby",`room-tab-${stage}`);
    back.disabled = stage === 0;
    next.disabled = stage === 3;
    byId("room-assets").hidden = stage === 0;
    edit.hidden = stage !== 3;
    edit.disabled = stage !== 3;
    viewport.dataset.mode = stage < 2 ? "image" : "three";
    reference.setAttribute("aria-hidden",String(stage >= 2));
    if (sourceImage) reference.src = stage === 1 ? cleanImage : sourceImage;
    reference.alt = stage === 1 ? "已移除木桌、绿椅和花瓶的空房间背景图" : "房间参考图：木桌、绿椅和橙色花瓶在同一张图片中";
    root.querySelectorAll(".room-asset-kind").forEach(item => {item.textContent = stage === 1 ? "参考图" : "网格示意";});
    if (renderer) {
      renderer.domElement.setAttribute("aria-hidden",String(stage < 2));
      renderer.domElement.tabIndex = stage >= 2 ? 0 : -1;
      controls.enabled = stage >= 2;
      points.visible = stage === 2;
      background.traverse(item => {
        if (!item.isMesh) return;
        item.material.transparent = stage === 2;
        item.material.opacity = stage === 2 ? 0.13 : 1;
        item.material.depthWrite = stage !== 2;
        item.material.needsUpdate = true;
      });
      for (const [key,group] of Object.entries(assets)) {
        group.traverse(item => {if (item.isMesh) item.material.wireframe = stage === 2;});
        const preview = previews[key];
        if (preview) byId(`room-thumb-${key}`).src = preview[stage === 1 ? "reference" : "mesh"];
      }
      moveTargets();
      resetCamera();
    }
    updateEditState();
  }

  function initializeScene() {
    if (!window.THREE || !window.THREE.OrbitControls) throw new Error("本地三维依赖未能加载");
    const T = window.THREE;
    scene = new T.Scene();
    scene.background = new T.Color(0xece9df);
    camera = new T.PerspectiveCamera(40,8/5,0.1,80);
    renderer = new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true,alpha:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,1.5));
    renderer.setSize(960,600,false);
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-label","房间三维示意：拖动旋转、滚轮或双指缩放");
    renderer.domElement.setAttribute("role","img");
    renderer.domElement.tabIndex = 0;
    viewport.prepend(renderer.domElement);
    controls = new T.OrbitControls(camera,renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 7;
    controls.maxDistance = 25;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 1.43;
    controls.addEventListener("start",pause);
    resetCamera();
    scene.add(new T.HemisphereLight(0xfff7df,0x8c9c80,0.75));
    const sun = new T.DirectionalLight(0xfff1d2,0.85);
    sun.position.set(3,8,5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024,1024);
    Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:0.5,far:25});
    sun.shadow.normalBias = 0.04;
    sun.shadow.bias = -0.0002;
    scene.add(sun);
    background = new T.Group();
    scene.add(background);
    function box(parent,size,position,color,roughness=0.8) {
      const mesh = new T.Mesh(new T.BoxGeometry(...size),new T.MeshStandardMaterial({color,roughness}));
      mesh.material.color.convertSRGBToLinear();
      mesh.position.set(...position);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
    }
    box(background,[8.15,0.14,6.15],[0,-0.1,0],0xa78d70);
    for (let i=0;i<12;i++) {
      const color = new T.Color().setHSL(0.09,0.24,0.58 + Math.sin(i*3.2)*0.025);
      box(background,[0.665,0.035,6],[-3.665+i*0.666,0,0],color);
    }
    box(background,[8.1,3.8,0.13],[0,1.9,-3.07],0xe3dfd2);
    box(background,[0.13,3.8,6.1],[-4.07,1.9,0],0xd6d5c7);
    box(background,[8,0.15,0.07],[0,0.09,-2.98],0xf8f4e8);
    box(background,[0.07,0.15,6],[-3.98,0.09,0],0xf8f4e8);
    box(background,[2.15,1.85,0.06],[-1.45,2.23,-2.94],0xf8f4e8);
    const glass = box(background,[1.91,1.61,0.045],[-1.45,2.23,-2.89],0xa2bfc0);
    glass.material.emissive.setHex(0x708f91);glass.material.emissiveIntensity=0.16;
    box(background,[0.07,1.65,0.06],[-1.45,2.23,-2.85],0xfff9eb);
    box(background,[1.95,0.07,0.06],[-1.45,2.23,-2.85],0xfff9eb);
    box(background,[2.35,0.11,0.3],[-1.45,1.28,-2.77],0xf5f0df);
    box(background,[1.45,1.65,0.1],[2.1,2.2,-2.9],0x816d52);
    box(background,[1.26,1.46,0.025],[2.1,2.2,-2.83],0xe9e4d0);
    box(background,[0.93,0.52,0.03],[2.1,2.05,-2.8],0x8b9c7b);
    const artDisc = new T.Mesh(new T.CircleGeometry(0.24,32),new T.MeshBasicMaterial({color:0xd3a278}));
    artDisc.material.color.convertSRGBToLinear();
    artDisc.position.set(2.33,2.56,-2.78);background.add(artDisc);
    box(background,[3.9,0.018,2.8],[0.1,0.035,0.3],0xc8cbb5);
    const table = new T.Group();
    box(table,[2.65,0.14,1.7],[0,1.27,0],0xb78c62,0.65);
    box(table,[2.48,0.09,1.54],[0,1.16,0],0x9e7650);
    for(const x of [-1.05,1.05]) for(const z of [-0.62,0.62]) box(table,[0.12,1.16,0.12],[x,0.58,z],0x9b744e);
    const chair = new T.Group();
    box(chair,[0.86,0.13,0.88],[0,0.68,0],0x668068);
    for(const x of [-0.32,0.32]) for(const z of [-0.33,0.33]) box(chair,[0.085,0.64,0.085],[x,0.32,z],0x526852);
    for(const x of [-0.33,0.33]) box(chair,[0.075,0.84,0.075],[x,1.06,-0.36],0x526852);
    box(chair,[0.82,0.52,0.1],[0,1.22,-0.36],0x718b6e);
    chair.rotation.y=-0.32;
    const vase = new T.Group();
    const profiles = [
      [[0,0],[0.18,0],[0.28,0.1],[0.32,0.23],[0.24,0.39],[0.105,0.53],[0.105,0.69],[0.15,0.71],[0.15,0.74],[0.1,0.74]],
      [[0,0],[0.2,0],[0.22,0.05],[0.24,0.31],[0.2,0.47],[0.15,0.51],[0.15,0.68],[0.19,0.7],[0.19,0.73],[0.14,0.73]]
    ];
    vaseMeshes = profiles.map((profile,i) => {
      const mesh = new T.Mesh(new T.LatheGeometry(profile.map(([x,y])=>new T.Vector2(x,y)),36),new T.MeshStandardMaterial({color:i===0?0xc9764d:0x659394,roughness:0.38,side:T.DoubleSide}));
      mesh.material.color.convertSRGBToLinear();
      mesh.castShadow=true;mesh.receiveShadow=true;mesh.visible=i===0;vase.add(mesh);return mesh;
    });
    Object.assign(assets,{table,chair,vase});
    for(const [key,group] of Object.entries(assets)) {group.position.fromArray(homes[key]);scene.add(group);targets[key]=group.position.clone();}
    const coords=[];
    for(let x=-3.9;x<=4;x+=0.18) for(let z=-2.9;z<=3;z+=0.18) coords.push(x,0.06,z);
    for(let x=-3.9;x<=4;x+=0.18) for(let y=0.1;y<=3.8;y+=0.18) coords.push(x,y,-2.97);
    for(let z=-2.9;z<=3;z+=0.18) for(let y=0.1;y<=3.8;y+=0.18) coords.push(-3.97,y,z);
    const pointGeometry = new T.BufferGeometry();
    pointGeometry.setAttribute("position",new T.Float32BufferAttribute(coords,3));
    points=new T.Points(pointGeometry,new T.PointsMaterial({color:0x7e9978,size:0.045,transparent:true,opacity:0.85}));
    points.visible=false;scene.add(points);
    renderer.render(scene,camera);
    sourceImage=renderer.domElement.toDataURL("image/png");
    Object.values(assets).forEach(group=>{group.visible=false;});
    renderer.render(scene,camera);
    cleanImage=renderer.domElement.toDataURL("image/png");
    Object.values(assets).forEach(group=>{group.visible=true;});

    const thumbRenderer = new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
    thumbRenderer.setSize(300,230,false);thumbRenderer.outputEncoding=T.sRGBEncoding;
    thumbRenderer.toneMapping=T.ACESFilmicToneMapping;thumbRenderer.toneMappingExposure=1.1;
    const thumbScene=new T.Scene();thumbScene.background=new T.Color(0xf1f0e7);
    thumbScene.add(new T.HemisphereLight(0xfff8e6,0x86907b,0.8));
    const thumbLight=new T.DirectionalLight(0xffffff,0.7);thumbLight.position.set(2,5,4);thumbScene.add(thumbLight);
    function thumbnail(group,wireframe) {
      const clone=group.clone(true);clone.position.set(0,0,0);clone.rotation.set(0,0,0);
      const materials=[];
      clone.traverse(item=>{if(item.isMesh){item.material=item.material.clone();item.material.wireframe=wireframe;materials.push(item.material);}});
      const bounds=new T.Box3().setFromObject(clone);
      const size=bounds.getSize(new T.Vector3());
      clone.position.sub(bounds.getCenter(new T.Vector3()));
      thumbScene.add(clone);
      const distance=Math.max(size.x,size.y,size.z)*2.25;
      const thumbCamera=new T.PerspectiveCamera(35,300/230,0.01,40);
      thumbCamera.position.set(distance,distance*0.7,distance);thumbCamera.lookAt(0,0,0);
      thumbRenderer.render(thumbScene,thumbCamera);
      const image=thumbRenderer.domElement.toDataURL("image/png");
      thumbScene.remove(clone);materials.forEach(material=>material.dispose());return image;
    }
    for(const [key,group] of Object.entries(assets)) previews[key]={reference:thumbnail(group,false),mesh:thumbnail(group,true)};
    const vasePreviews=[previews.vase];
    vaseMeshes[0].visible=false;vaseMeshes[1].visible=true;
    vasePreviews.push({reference:thumbnail(vase,false),mesh:thumbnail(vase,true)});
    vaseMeshes[0].visible=true;vaseMeshes[1].visible=false;
    previews.vaseVersions=vasePreviews;
    thumbRenderer.dispose();thumbRenderer.forceContextLoss();
    reference.src=sourceImage;reference.hidden=false;
    byId("room-fallback").style.display="none";
    for(const key of Object.keys(assets)) {const image=byId(`room-thumb-${key}`);image.src=previews[key].reference;image.hidden=false;}
    function resize() {
      const {width,height}=viewport.getBoundingClientRect();
      if(width<1||height<1)return;
      renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();
      if(stage<2)renderer.render(scene,camera);
    }
    new ResizeObserver(resize).observe(viewport);resize();
    new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;},{rootMargin:"200px"}).observe(root);
    const clock=new T.Clock();
    function animate() {
      window.requestAnimationFrame(animate);
      const delta=Math.min(clock.getDelta(),0.06);
      if(!inView||stage<2)return;
      const alpha=reducedMotion?1:1-Math.exp(-delta*6);
      Object.keys(assets).forEach(key=>assets[key].position.lerp(targets[key],alpha));
      controls.update();renderer.render(scene,camera);
    }
    animate();
  }

  try {initializeScene();} catch(error) {
    byId("room-view-hint").textContent="当前设备未能启动三维演示。下方八步流程和研究说明仍可阅读。";
    byId("room-step-boundary").textContent="请使用支持 WebGL 的现代浏览器查看房间拆分与组合演示。";
    root.querySelectorAll("button").forEach(button=>{button.disabled=true;});
    if(renderer) renderer.dispose();
    return;
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener("click",()=>selectStage(index));
    tab.addEventListener("keydown",event=>{
      let index;
      if(event.key==="ArrowRight"||event.key==="ArrowDown")index=(stage+1)%4;
      else if(event.key==="ArrowLeft"||event.key==="ArrowUp")index=(stage+3)%4;
      else if(event.key==="Home")index=0;
      else if(event.key==="End")index=3;
      else return;
      event.preventDefault();selectStage(index);tabs[index].focus();
    });
  });
  back.addEventListener("click",()=>selectStage(stage-1));
  next.addEventListener("click",()=>selectStage(stage+1));
  play.addEventListener("click",()=>{
    if(timer!==null){pause();return;}
    if(stage===3)selectStage(0);
    play.textContent="暂停演示";play.setAttribute("aria-pressed","true");
    timer=window.setInterval(()=>{if(stage<3)selectStage(stage+1,true);if(stage===3)pause();},4200);
  });
  byId("room-reset").addEventListener("click",()=>{
    arranged=false;vaseVersion=0;chairSlider.value="0";
    vaseMeshes[0].visible=true;vaseMeshes[1].visible=false;previews.vase=previews.vaseVersions[0];
    Object.keys(assets).forEach(key=>assets[key].position.fromArray(homes[key]));selectStage(0);
  });
  layout.addEventListener("click",()=>{pause();arranged=!arranged;chairSlider.value="0";moveTargets();updateEditState();});
  chairSlider.addEventListener("input",()=>{pause();moveTargets();updateEditState();});
  byId("room-vase-version").addEventListener("click",()=>{
    pause();vaseVersion=(vaseVersion+1)%2;vaseMeshes.forEach((mesh,i)=>{mesh.visible=i===vaseVersion;});
    previews.vase=previews.vaseVersions[vaseVersion];byId("room-thumb-vase").src=previews.vase.mesh;
    updateEditState();
  });
  byId("room-camera-reset").addEventListener("click",()=>{pause();resetCamera();});
  document.addEventListener("visibilitychange",()=>{if(document.hidden)pause();});
  selectStage(0);
})();
