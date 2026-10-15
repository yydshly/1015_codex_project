/* Preview and in-scene avatars use the same controller state and the same pose function. */
(() => {
  'use strict';
  const T=window.THREE,$=id=>document.getElementById(id),characters=window.EllehCharacters;
  function create({onSelect,onOpen,onClose}){
    let current='mario',opened=false,compare=false,action='run',preview,elapsed=0,clock=0,accumulator=0,landedAt=null,returnFocus;
    const models=new Map(),labels=new Map();let renderer,scene,camera,resizeObserver;
    for(const [index,info] of characters.catalog.entries()){
      const button=document.createElement('button');button.type='button';button.dataset.character=info.id;button.setAttribute('aria-pressed',String(info.id===current));button.style.setProperty('--avatar-color',info.color);
      const emblem=document.createElement('b');emblem.textContent=info.badge;const name=document.createElement('span');name.textContent=info.name;const key=document.createElement('small');key.textContent=String(index+1);button.append(emblem,name,key);button.addEventListener('click',()=>select(info.id));$('character-list').appendChild(button);
    }
    function resetPreview(){preview=new window.EllehPhysics.Controller({spawn:{x:0,z:0}});preview.vz=action==='run'?7.6:5.4;elapsed=0;accumulator=0;landedAt=null;}
    function select(id){
      const info=characters.catalog.find(c=>c.id===id);if(!info)return;
      current=id;onSelect(info);
      for(const button of $('character-list').children)button.setAttribute('aria-pressed',String(button.dataset.character===id));
      $('character-note').textContent=info.note;$('preview-name').textContent=compare?'SAME CONTROLLER · SAME POSE':info.en;$('wardrobe-play').textContent='用'+info.name+'探索 →';
      if(renderer)layout();
    }
    function prepare(){
      if(renderer)return;
      renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.setClearColor('#202e29');
      $('avatar-viewport').appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
      scene=new T.Scene();camera=new T.PerspectiveCamera(38,1,.1,80);
      scene.add(new T.HemisphereLight('#f2f3de','#698274',1.25));const light=new T.DirectionalLight('#fff1d1',2.1);light.position.set(3,7,6);scene.add(light);const rim=new T.DirectionalLight('#a8c6d5',1.2);rim.position.set(-4,3,-4);scene.add(rim);
      for(const info of characters.catalog){const model=characters.create(info.id);models.set(info.id,model);scene.add(model.root);const label=document.createElement('span');label.textContent=info.name;labels.set(info.id,label);$('avatar-labels').appendChild(label);}
      resizeObserver=new ResizeObserver(layout);resizeObserver.observe($('avatar-viewport'));resetPreview();layout();
    }
    function layout(){
      if(!renderer||!opened)return;const host=$('avatar-viewport'),w=host.clientWidth,h=host.clientHeight;
      if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
      for(const [id,model] of models){model.root.visible=compare||id===current;labels.get(id).hidden=!compare;}
      $('avatar-labels').hidden=!compare;
    }
    function setCompare(value){compare=value;$('compare-toggle').setAttribute('aria-pressed',String(compare));$('compare-toggle').textContent=compare?'查看单人细节':'七人同步对比';}
    function open(options={}){
      if(opened)return;returnFocus=document.activeElement;opened=true;$('wardrobe').hidden=false;onOpen();
      if(options.compare)setCompare(true);
      prepare();select(current);resetPreview();$('character-list').querySelector('[aria-pressed="true"]').focus({preventScroll:true});
    }
    function close(){if(!opened)return;opened=false;$('wardrobe').hidden=true;onClose();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
    function tick(dt){
      if(!opened||!renderer)return;dt=Math.min(dt,.05);elapsed+=dt;clock+=dt;accumulator+=dt;
      while(accumulator>=1/120){
        if(action!=='run'&&preview.grounded&&landedAt===null)preview.jump(action==='long');
        if(action==='pound'&&!preview.grounded&&preview.airTime>.28)preview.pound();
        preview.step(1/120,{x:0,z:1,run:action==='run'});accumulator-=1/120;
        if(action!=='run'&&preview.grounded&&preview.landings>0){
          if(action==='triple'&&preview.tier<3)preview.jump();else if(landedAt===null)landedAt=elapsed;
        }
      }
      if(landedAt!==null&&elapsed-landedAt>.65)resetPreview();
      const narrow=$('avatar-viewport').clientWidth<700,follow=preview.y*.85,count=models.size;
      if(compare){camera.position.set(0,(narrow?2.8:1.2)+follow,narrow?Math.max(9.7,8/(camera.aspect*.689)):Math.max(5.7,count*1.96/(camera.aspect*.689)));camera.lookAt(0,(narrow?2.8:1.2)+follow,0);}
      else{camera.position.set(1.7,1.9+follow,4.1);camera.lookAt(0,1.03+follow,0);}
      let index=0;
      for(const [id,model] of models){
        const rowCount=Math.min(4,count-Math.floor(index/4)*4);
        const x=compare?(narrow?(index%4-(rowCount-1)/2)*1.9:(index-(count-1)/2)*1.96):0;
        const row=compare&&narrow&&index<4?2.55:0;
        characters.pose(model,clock,{...preview,x,y:preview.y+row,z:0,heading:compare?0:.25});
        if(compare){const point=new T.Vector3(x,preview.y+row-.13,0).project(camera);const label=labels.get(id);label.style.left=(point.x*.5+.5)*100+'%';label.style.top=(-point.y*.5+.5)*100+'%';label.classList.toggle('selected',id===current);}
        index++;
      }
      $('preview-action').textContent=preview.action==='站立'?'奔跑':preview.action;
      $('avatar-viewport').setAttribute('aria-label',(compare?'七个角色同步':characters.catalog.find(c=>c.id===current).name)+'动作预览：'+$('preview-action').textContent);
      $('wardrobe').dataset.character=current;$('wardrobe').dataset.action=action;$('wardrobe').dataset.previewY=preview.y.toFixed(3);$('wardrobe').dataset.compare=String(compare);
      renderer.render(scene,camera);
    }
    $('character-toggle').addEventListener('click',open);$('wardrobe-close').addEventListener('click',close);$('wardrobe-play').addEventListener('click',()=>{close();document.getElementById('start-button').click();});
    $('compare-toggle').addEventListener('click',()=>{setCompare(!compare);select(current);});
    for(const button of $('preview-actions').children)button.addEventListener('click',()=>{action=button.dataset.action;for(const b of $('preview-actions').children)b.setAttribute('aria-pressed',String(b===button));resetPreview();});
    $('wardrobe').addEventListener('click',event=>{if(event.target===$('wardrobe'))close();});
    $('wardrobe').addEventListener('keydown',event=>{
      if(event.key==='Tab'){const buttons=[...$('wardrobe').querySelectorAll('button')],first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
    });
    select(current);
    return {open,close,select,tick,get isOpen(){return opened;}};
  }
  window.EllehWardrobe={create};
})();
