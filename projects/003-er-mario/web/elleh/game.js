(async () => {
  'use strict';
  const $=id=>document.getElementById(id), T=window.THREE;
  let world;
  try {await window.EllehHuman.load();world=window.EllehWorld.create($('viewport'));} catch(error) {$('loading').hidden=true;$('render-error').hidden=false;console.error('Scene initialization failed:',error);return;}
  const player=new window.EllehPhysics.Controller({floor:world.floor,obstacles:world.obstacles,spawn:{x:0,z:16}});
  player.height=1.9;
  const keys=new Set(),touch=new Set(),visited=new Set();
  const state={started:false,tour:false,overview:false,near:null,elapsed:0,yaw:0,pitch:.32,distance:12,dragging:false,dragX:0,dragY:0,waypoint:0,tourClock:0,toastUntil:0,discoveryUntil:0};
  let selectedCharacter=window.EllehCharacters.catalog[0];
  const wardrobe=window.EllehWardrobe.create({
    onSelect(info){selectedCharacter=info;world.setCharacter(info.id);$('character-name').textContent=info.name;$('character-emblem').textContent=info.badge;$('character-emblem').style.background=info.color;$('viewport').dataset.character=info.id;$('game').setAttribute('aria-label',info.name+'探索艾雷教堂，WASD 移动，空格跳跃，E 交互');$('viewport').setAttribute('aria-label','艾雷教堂三维局部场景，当前角色：'+info.name);},
    onOpen(){keys.clear();touch.clear();state.dragging=false;help(false);},
    onClose(){keys.clear();touch.clear();focusGame();}
  });
  const path=[{x:0,z:10,jump:true},{x:0,z:5,jump:true},{x:0,z:-1.2,id:'grace'},{x:2.2,z:-6.7,id:'merchant'},{x:-2.5,z:.3,id:'smith'}];
  const cameraTarget=new T.Vector3(),cameraDesired=new T.Vector3(),cameraLook=new T.Vector3(),ray=new T.Ray(),box3=new T.Box3(),hit=new T.Vector3();
  let lastTime=performance.now(),accumulator=0,lastTelemetry=0;
  world.camera.position.set(9,7.9,32);world.camera.lookAt(-.3,5.8,-1.5);
  function announce(message,duration=3){$('toast').textContent=message;$('toast').hidden=false;state.toastUntil=state.elapsed+duration;}
  function focusGame(){$('game').focus({preventScroll:true});}
  function start(){if(state.started)return;state.started=true;$('game').classList.add('is-playing');$('welcome').hidden=true;focusGame();announce('保持移动，连续落地再起跳，可以衔接三段跳。',4);}
  function stopTour(){state.tour=false;$('tour-button').setAttribute('aria-pressed','false');$('mode-name').textContent=state.overview?'俯瞰教堂':'自由探索';}
  function reset(){player.reset();state.overview=false;stopTour();state.yaw=0;state.pitch=.32;$('overview-button').setAttribute('aria-pressed','false');$('dialog').hidden=true;announce('已回到教堂入口。');focusGame();}
  function findNearest(){let nearest=null,distance=2.45;for(const point of world.hotspots){const d=Math.hypot(player.x-point.x,player.z-point.z);if(d<distance&&player.y<1.2){nearest=point;distance=d;}}state.near=nearest;$('interaction').hidden=!nearest||!state.started||state.overview||!$('dialog').hidden||wardrobe.isOpen;if(nearest)$('interaction-name').textContent=nearest.label;}
  function updateGoals(){for(const id of ['grace','merchant','smith'])$('goal-'+id).classList.toggle('done',visited.has(id));$('goal-count').textContent=visited.size+' / 3 处地标';}
  function openDialog(title,text,kicker='CHURCH OF ELLEH'){$('dialog-title').textContent=title;$('dialog-text').textContent=text;$('dialog-kicker').textContent=kicker;$('dialog').hidden=false;keys.clear();touch.clear();$('dialog-close').focus({preventScroll:true});}
  function closeDialog(){$('dialog').hidden=true;focusGame();}
  function interact(point=state.near){
    if(!point||!state.started)return;
    const first=!visited.has(point.id);visited.add(point.id);updateGoals();
    if(point.id==='grace'){
      $('discovery').hidden=false;state.discoveryUntil=state.elapsed+2.6;world.graceLight.intensity=4;
      if(!first)announce('在艾雷教堂赐福歇脚。');
    }else if(point.id==='merchant'){
      if(state.tour)announce('商人咖列 · 火光旁的旅途补给站。',3.5);
      else openDialog('商人咖列','欢迎，远道而来的旅人。废墟里也能找到歇脚的地方。看看那边的锻造台，再沿着赐福的光继续前行。','MERCHANT KALÉ · 场景交互');
    }else{
      world.impact(point.x,point.z);
      if(state.tour)announce('锻造台 · 教堂入口左侧的铁砧。',3.5);
      else openDialog('锻造台','石座上的铁砧、留在手边的锤子。这里是旅途早期整理装备的落脚点。你已经找到教堂的第三处地标。','SMITHING TABLE · 场景交互');
    }
    if(visited.size===3&&first)state.completionAt=state.elapsed+3;
  }
  $('start-button').addEventListener('click',start);$('reset-button').addEventListener('click',()=>{start();reset();});
  $('interact-button').addEventListener('click',()=>interact());$('dialog-close').addEventListener('click',closeDialog);
  function help(open){$('help-panel').hidden=!open;$('help-toggle').setAttribute('aria-expanded',String(open));if(!open)focusGame();}
  $('help-toggle').addEventListener('click',()=>help($('help-panel').hidden));$('help-close').addEventListener('click',()=>help(false));
  $('tour-button').addEventListener('click',()=>{
    start();if(state.tour){stopTour();focusGame();return;}
    player.reset();state.overview=false;state.tour=true;state.waypoint=0;state.tourClock=0;state.lastAutoJump=-5;state.yaw=0;state.pitch=.34;
    $('tour-button').setAttribute('aria-pressed','true');$('overview-button').setAttribute('aria-pressed','false');$('mode-name').textContent='自动导览';announce('导览：从入口穿过拱门，依次拜访三处地标。',4);focusGame();
  });
  $('overview-button').addEventListener('click',()=>{start();stopTour();state.overview=!state.overview;$('overview-button').setAttribute('aria-pressed',String(state.overview));$('mode-name').textContent=state.overview?'俯瞰教堂':'自由探索';focusGame();});
  window.addEventListener('keydown',event=>{
    if(event.target.closest('input,textarea,select'))return;
    if(event.code==='Escape'&&wardrobe.isOpen){event.preventDefault();wardrobe.close();return;}
    if(!event.repeat&&/^Digit[1-7]$/.test(event.code)&&$('dialog').hidden){wardrobe.select(window.EllehCharacters.catalog[Number(event.code.slice(-1))-1].id);return;}
    if(!event.repeat&&event.code==='KeyV'&&$('dialog').hidden){event.preventDefault();if(wardrobe.isOpen)wardrobe.close();else wardrobe.open();return;}
    if(wardrobe.isOpen)return;
    if(event.code==='Escape'){help(false);closeDialog();stopTour();return;}
    if(!$('dialog').hidden){if(event.code==='Enter'||event.code==='KeyE'){event.preventDefault();closeDialog();}return;}
    if(!state.started)return;
    if(event.target.closest('button')&&['Space','Enter'].includes(event.code))return;
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code))event.preventDefault();
    if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)){if(state.tour)stopTour();if(state.overview){state.overview=false;$('overview-button').setAttribute('aria-pressed','false');$('mode-name').textContent='自由探索';}}
    keys.add(event.code);
    if(event.repeat)return;
    if(event.code==='Space'&&!state.overview)player.jump(keys.has('KeyC'));
    if(event.code==='KeyX')player.pound();
    if(event.code==='KeyE')interact();
    if(event.code==='KeyR')reset();
  });
  window.addEventListener('keyup',event=>keys.delete(event.code));window.addEventListener('blur',()=>{keys.clear();touch.clear();state.dragging=false;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();touch.clear();}});
  const canvas=world.renderer.domElement;
  canvas.addEventListener('pointerdown',event=>{state.dragging=true;state.dragX=event.clientX;state.dragY=event.clientY;canvas.setPointerCapture(event.pointerId);if(state.started)focusGame();});
  canvas.addEventListener('pointermove',event=>{if(!state.dragging)return;state.yaw-=(event.clientX-state.dragX)*.006;state.pitch=Math.max(.13,Math.min(1.12,state.pitch+(event.clientY-state.dragY)*.004));state.dragX=event.clientX;state.dragY=event.clientY;});
  canvas.addEventListener('pointerup',()=>{state.dragging=false;});canvas.addEventListener('pointercancel',()=>{state.dragging=false;});
  canvas.addEventListener('wheel',event=>{event.preventDefault();state.distance=Math.max(5.5,Math.min(20,state.distance+event.deltaY*.01));},{passive:false});
  for(const button of document.querySelectorAll('[data-touch]')){
    button.addEventListener('pointerdown',event=>{event.preventDefault();start();stopTour();state.overview=false;$('overview-button').setAttribute('aria-pressed','false');$('mode-name').textContent='自由探索';button.setPointerCapture(event.pointerId);touch.add(button.dataset.touch);});
    const release=()=>touch.delete(button.dataset.touch);button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
  }
  $('touch-jump').addEventListener('pointerdown',event=>{event.preventDefault();start();state.overview=false;$('overview-button').setAttribute('aria-pressed','false');$('mode-name').textContent='自由探索';player.jump(false);});
  $('touch-pound').addEventListener('pointerdown',event=>{event.preventDefault();start();player.pound();});
  function input(){
    if(!state.started||state.overview||!$('dialog').hidden||!$('help-panel').hidden||wardrobe.isOpen)return {x:0,z:0};
    if(state.tour){
      const point=path[state.waypoint];if(!point){stopTour();announce('导览结束。现在可以自由探索。');return {x:0,z:0};}
      const dx=point.x-player.x,dz=point.z-player.z,d=Math.hypot(dx,dz);
      if(d<1.3){if(point.id){const spot=world.hotspots.find(p=>p.id===point.id);interact(spot);}state.waypoint++;return {x:0,z:0};}
      if(point.jump&&player.grounded&&state.elapsed-state.lastAutoJump>.6){player.jump();state.lastAutoJump=state.elapsed;}
      return {x:dx/d,z:dz/d,run:false};
    }
    const right=Number(keys.has('KeyD')||keys.has('ArrowRight')||touch.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||touch.has('left'));
    const forward=Number(keys.has('KeyW')||keys.has('ArrowUp')||touch.has('forward'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||touch.has('back'));
    const yaw=state.cameraYaw??state.yaw;
    return {x:right*Math.cos(yaw)-forward*Math.sin(yaw),z:-right*Math.sin(yaw)-forward*Math.cos(yaw),run:keys.has('ShiftLeft')||keys.has('ShiftRight')};
  }
  function updateCamera(dt){
    if(!state.started){
      const motion=matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.sin(state.elapsed*.09)*.8;
      cameraDesired.set(9+motion,7.9,32);cameraLook.set(-.3,5.8,-1.5);
    }else if(state.overview){cameraDesired.set(22,32,23);cameraLook.set(0,2,-3);}
    else{
      const distance=innerWidth<700?state.distance+3.5:state.distance;
      cameraTarget.set(player.x,player.y+1.4,player.z);
      function clearDistance(yaw){
        const direction=new T.Vector3(Math.sin(yaw)*Math.cos(state.pitch),Math.sin(state.pitch),Math.cos(yaw)*Math.cos(state.pitch));ray.set(cameraTarget,direction);let clear=distance;
        for(const b of world.obstacles){box3.min.set(b.x0,b.bottom||0,b.z0);box3.max.set(b.x1,b.top,b.z1);if(ray.intersectBox(box3,hit)){const d=hit.distanceTo(cameraTarget);if(d>.4&&d<clear)clear=d;}}
        if(Math.abs(player.x)<4.8&&player.z<2.45&&player.z>-11.3){
          if(direction.x>.001)clear=Math.min(clear,(4.85-player.x)/direction.x);
          if(direction.x<-.001)clear=Math.min(clear,(-4.85-player.x)/direction.x);
          if(direction.z>.001)clear=Math.min(clear,(2.45-player.z)/direction.z);
          if(direction.z<-.001)clear=Math.min(clear,(-11.4-player.z)/direction.z);
        }
        return Math.max(2.9,clear-.35);
      }
      let chosen=state.yaw,clear=clearDistance(chosen),score=clear;
      if(clear<distance*.72)for(const offset of [.5,-.5,1,-1,1.6,-1.6,Math.PI]){const candidate=clearDistance(state.yaw+offset),candidateScore=candidate-Math.abs(offset)*.9;if(candidateScore>score){score=candidateScore;chosen=state.yaw+offset;clear=candidate;}}
      state.cameraYaw=chosen;cameraDesired.set(player.x+Math.sin(chosen)*clear*Math.cos(state.pitch),player.y+1.4+Math.sin(state.pitch)*clear,player.z+Math.cos(chosen)*clear*Math.cos(state.pitch));
      cameraDesired.y=Math.max(cameraDesired.y,world.floor(cameraDesired.x,cameraDesired.z)+.8);
      cameraLook.copy(cameraTarget);cameraLook.y+=.25;
    }
    const smoothing=1-Math.exp(-dt*5.5);world.camera.position.lerp(cameraDesired,smoothing);
    if(!state.look)state.look=cameraLook.clone();state.look.lerp(cameraLook,smoothing);world.camera.lookAt(state.look);
  }
  function frame(now){
    requestAnimationFrame(frame);const dt=Math.min((now-lastTime)/1000,.055);lastTime=now;
    if(document.hidden)return;state.elapsed+=dt;
    if(state.started&&!state.overview&&$('dialog').hidden&&$('help-panel').hidden&&!wardrobe.isOpen){accumulator+=dt;while(accumulator>=1/120){player.step(1/120,input());accumulator-=1/120;}for(const event of player.drainEvents()){if(event.type==='impact'){world.impact(event.x,event.z);announce('下砸着地',1.3);}if(event.type==='wallkick')announce('蹬墙跳',1.1);if(event.type==='jump'&&event.tier===3)announce('三段跳！',1.3);}}
    else accumulator=0;
    world.animate(state.elapsed,dt,player);updateCamera(dt);world.render();findNearest();wardrobe.tick(dt);
    $('action-name').textContent=player.action;
    const compass=((state.yaw*180/Math.PI)%360+360)%360;$('compass-heading').textContent=compass<45||compass>=315?'N':compass<135?'W':compass<225?'S':'E';
    if(state.elapsed>state.toastUntil)$('toast').hidden=true;
    if(state.elapsed>state.discoveryUntil){$('discovery').hidden=true;world.graceLight.intensity=2.7;}
    if(state.completionAt&&state.elapsed>state.completionAt){announce('三处地标已找到。可以继续探索，试试蹬墙和三段跳。',5);state.completionAt=0;}
    if(state.elapsed-lastTelemetry>.12){$('telemetry').textContent=selectedCharacter.name+'位置：'+[player.x,player.y,player.z].map(n=>n.toFixed(2)).join(', ')+'；动作：'+player.action;$('viewport').dataset.playerX=player.x.toFixed(3);$('viewport').dataset.playerY=player.y.toFixed(3);$('viewport').dataset.playerZ=player.z.toFixed(3);$('viewport').dataset.playerVy=player.vy.toFixed(3);$('viewport').dataset.playerTier=String(player.tier);lastTelemetry=state.elapsed;}
  }
  $('loading').hidden=true;$('character-toggle').disabled=false;$('start-button').disabled=false;updateGoals();
  const params=new URLSearchParams(location.search);if(params.has('character'))wardrobe.select(params.get('character'));if(params.get('compare')==='all')wardrobe.open({compare:true});
  requestAnimationFrame(frame);
})();
