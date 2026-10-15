/* Original geometric character studies. One semantic rig and pose adapter for every body. */
(() => {
  'use strict';
  const T=window.THREE;
  const catalog=[
    {id:'mario',name:'马里奥',en:'MARIO',badge:'M',color:'#d73528',note:'红帽、背带裤与大鼻子，经典的起点。'},
    {id:'luigi',name:'路易吉',en:'LUIGI',badge:'L',color:'#36934a',note:'更高的身形、更细的四肢，共用同一套动作。'},
    {id:'sonic',name:'索尼克',en:'SONIC',badge:'S',color:'#2870dc',note:'蓝色背刺、白手套与红鞋，奔跑轮廓一眼可辨。'},
    {id:'kirby',name:'卡比',en:'KIRBY',badge:'K',color:'#e88daf',note:'球形身体和短手短脚，也能映射跑跳与下砸。'},
    {id:'steve',name:'史蒂夫',en:'STEVE',badge:'S',color:'#399a9e',note:'方块头、青色上衣和方形四肢，保留像素轮廓。'},
    {id:'link',name:'林克',en:'LINK',badge:'L',color:'#688c35',note:'绿帽、尖耳与背后的剑盾，换一位冒险者。'},
    {id:'human',name:'写实人物',en:'REALISTIC HUMAN',badge:'H',color:'#95775b',note:'真实人体比例、皮肤与衣物纹理，用骨骼蒙皮承接同一套跑跳动作。'}
  ];
  function create(id='mario'){
    const info=catalog.find(c=>c.id===id);if(!info)throw new Error('Unknown character: '+id);
    const root=new T.Group(),pivot=new T.Group(),body=new T.Group();
    root.add(pivot);pivot.position.y=1;body.position.y=-1;pivot.add(body);
    const arms=[],legs=[],materials=new Map();let retarget;
    function mat(hex){if(!materials.has(hex))materials.set(hex,new T.MeshStandardMaterial({color:new T.Color(hex).convertSRGBToLinear(),roughness:.78}));return materials.get(hex);}
    function mesh(geo,hex,x,y,z,parent=body){const m=new T.Mesh(geo,mat(hex));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
    function ball(x,y,z,rx,ry,rz,hex,parent=body){const m=mesh(new T.SphereGeometry(1,16,12),hex,x,y,z,parent);m.scale.set(rx,ry,rz);return m;}
    function box(x,y,z,w,h,d,hex,parent=body){return mesh(new T.BoxGeometry(w,h,d),hex,x,y,z,parent);}
    function coneBetween(a,b,r,hex,parent=body){const start=new T.Vector3(...a),end=new T.Vector3(...b),delta=end.clone().sub(start);const m=mesh(new T.ConeGeometry(r,delta.length(),10),hex,0,0,0,parent);m.position.copy(start.add(end).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
    function joint(x,y,z,list){const g=new T.Group();g.position.set(x,y,z);body.add(g);list.push(g);return g;}
    const white='#faf5e9',black='#242424',skin='#edb183',brown='#603b22',blue='#2050a2';
    function eyes(y,z,spacing=.12,rx=.065,ry=.105,pupil='#2876aa'){
      for(const s of [-1,1]){ball(s*spacing,y,z,rx,ry,.035,white);ball(s*spacing,y,z+.027,rx*.55,ry*.74,.022,pupil);ball(s*spacing,y,z+.043,rx*.28,ry*.57,.015,black);}
    }
    function badge(letter,hex,y,z){
      const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#fff8e6';ctx.beginPath();ctx.arc(64,64,54,0,Math.PI*2);ctx.fill();ctx.fillStyle=hex;ctx.font='bold 88px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(letter,64,69);
      const texture=new T.CanvasTexture(c);texture.encoding=T.sRGBEncoding;
      const m=new T.Mesh(new T.PlaneGeometry(.25,.25),new T.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.25,roughness:.8}));m.position.set(0,y,z);body.add(m);
    }
    if(id==='human'){
      retarget=window.EllehHuman.create(body,arms,legs);
    }else if(id==='mario'||id==='luigi'){
      const luigi=id==='luigi',shirt=info.color,headY=luigi?1.56:1.49,headR=luigi?.29:.33;
      ball(0,1.02,0,luigi?.29:.35,.4,.28,shirt);ball(0,.74,.01,luigi?.3:.36,.3,.29,blue);box(0,1.01,.277,.35,.32,.045,blue);
      for(const s of [-1,1]){box(s*.16,1.14,.23,.075,.38,.055,blue);ball(s*.145,1.04,.31,.039,.039,.039,'#ffd65e');}
      ball(0,headY,-.07,headR,headR*.96,.29,brown);ball(0,headY,0,headR,headR*1.02,.3,skin);
      eyes(headY+.1,.265,luigi?.105:.125,.067,.098);
      for(const s of [-1,1]){ball(s*headR,headY-.03,0,.09,.1,.075,skin);ball(s*.22,headY-.055,.12,.05,.13,.1,brown);}
      ball(0,headY-.04,.36,luigi?.135:.145,.13,.14,skin);
      for(let i=0;i<7;i++)ball((i-3)*.052,headY-.145+Math.abs(i-3)*.009,.287,.068,.044,.052,brown);
      ball(0,headY+.27,-.025,headR+.04,.21,.34,shirt);ball(0,headY+.22,.22,.41,.04,.3,shirt);badge(info.badge,shirt,headY+.32,.319);
      for(const s of [-1,1]){const a=joint(s*(luigi?.34:.39),1.15,0,arms);ball(0,-.17,0,.115,.24,.12,shirt,a);ball(0,-.43,.02,.14,.16,.15,white,a);
        const l=joint(s*.17,.6,0,legs);ball(0,-.16,0,.13,.23,.14,blue,l);ball(0,-.43,.075,.17,.125,.26,brown,l);}
    }else if(id==='sonic'){
      const cobalt='#2465d4',tan='#e2b48a',red='#cb322f';
      ball(0,.93,0,.29,.41,.28,cobalt);ball(0,.95,.24,.18,.26,.065,tan);
      ball(0,1.51,0,.47,.44,.4,cobalt);
      for(const s of [-1,1]){coneBetween([s*.29,1.72,0],[s*.36,2.02,-.05],.16,cobalt);coneBetween([s*.29,1.76,.09],[s*.35,1.95,.05],.09,tan);}
      // Backward-facing spikes keep the silhouette distinctive from the chase camera.
      for(const s of [-1,1]){coneBetween([s*.27,1.61,-.2],[s*.64,1.38,-.61],.27,cobalt);coneBetween([s*.28,1.37,-.18],[s*.52,1.06,-.57],.23,cobalt);}
      coneBetween([0,1.79,-.15],[0,1.67,-.85],.31,cobalt);coneBetween([0,1.29,-.15],[0,1.03,-.64],.24,cobalt);
      ball(0,1.37,.32,.34,.19,.18,tan);eyes(1.59,.34,.14,.13,.2,'#3a9b50');ball(0,1.43,.51,.1,.075,.08,black);
      const smile=box(.13,1.27,.442,.13,.015,.025,black);smile.rotation.z=.12;
      for(const s of [-1,1]){const a=joint(s*.32,1.12,0,arms);ball(0,-.18,0,.07,.23,.075,tan,a);ball(0,-.4,0,.12,.08,.12,white,a);ball(0,-.51,.04,.14,.14,.13,white,a);
        const l=joint(s*.15,.65,0,legs);ball(0,-.19,0,.075,.24,.085,cobalt,l);ball(0,-.42,.07,.15,.09,.17,white,l);ball(0,-.53,.12,.19,.13,.32,red,l);box(0,-.465,.19,.34,.055,.1,white,l);}
    }else if(id==='kirby'){
      const pink='#ee91b2',red='#b93661';
      ball(0,.87,0,.73,.71,.65,pink);
      for(const s of [-1,1]){ball(s*.18,1.07,.596,.068,.18,.035,black);ball(s*.18,1.14,.629,.033,.065,.014,white);ball(s*.18,1.0,.629,.035,.055,.012,'#3473a7');ball(s*.43,.83,.52,.12,.052,.018,'#d45281');}
      ball(0,.75,.636,.07,.085,.018,'#9b284d');ball(0,.715,.65,.041,.022,.009,'#ec6386');
      for(const s of [-1,1]){const a=joint(s*.61,.9,0,arms);ball(s*.07,-.05,0,.24,.23,.25,pink,a);const l=joint(s*.32,.26,0,legs);ball(0,-.08,.14,.29,.18,.38,red,l);}
    }else if(id==='steve'){
      const hair='#3a291c',cyan='#35a4ac',pants='#494488';
      box(0,1.5,0,.62,.62,.57,skin);box(0,1.77,-.02,.64,.12,.6,hair);box(0,1.53,-.286,.64,.5,.05,hair);
      for(const s of [-1,1]){box(s*.265,1.67,.29,.1,.16,.025,hair);box(s*.14,1.54,.292,.15,.065,.018,white);box(s*.125,1.54,.306,.065,.065,.012,'#51408d');}
      box(0,1.4,.31,.12,.09,.055,'#b9815d');box(0,1.31,.294,.26,.1,.025,'#664232');box(0,1.32,.311,.105,.035,.012,skin);
      box(0,.96,0,.61,.54,.31,cyan);box(0,.68,0,.6,.13,.33,pants);
      for(const s of [-1,1]){const a=joint(s*.43,1.2,0,arms);box(0,-.12,0,.24,.24,.3,cyan,a);box(0,-.41,0,.24,.34,.29,skin,a);
        const l=joint(s*.155,.63,0,legs);box(0,-.235,0,.28,.47,.31,pants,l);box(0,-.54,.035,.28,.15,.38,'#45464a',l);}
    }else if(id==='link'){
      const green='#638934',hair='#d3a542',boot='#634129';
      ball(0,.99,0,.29,.36,.22,green);const tunic=mesh(new T.CylinderGeometry(.28,.37,.38,10),green,0,.73,0);box(0,.87,.015,.58,.075,.45,boot);box(0,.87,.253,.12,.085,.027,'#d4b65a');
      ball(0,1.51,0,.28,.3,.25,skin);ball(0,1.64,-.04,.29,.22,.25,hair);eyes(1.55,.226,.105,.059,.081);
      ball(0,1.45,.26,.06,.065,.065,skin);box(0,1.37,.239,.09,.012,.015,brown);
      for(const s of [-1,1]){coneBetween([s*.22,1.5,0],[s*.46,1.57,-.03],.095,skin);coneBetween([s*.2,1.7,.14],[s*.24,1.43,.2],.11,hair);}
      ball(0,1.76,-.04,.31,.13,.27,green);coneBetween([0,1.76,-.04],[.09,1.48,-.74],.28,green);
      for(const s of [-1,1]){const a=joint(s*.32,1.16,0,arms);ball(0,-.12,0,.12,.19,.13,green,a);ball(0,-.32,0,.083,.15,.09,skin,a);ball(0,-.46,.02,.1,.105,.11,boot,a);
        const l=joint(s*.145,.62,0,legs);ball(0,-.16,0,.105,.2,.11,'#e0d5ad',l);ball(0,-.38,0,.12,.18,.13,boot,l);ball(0,-.52,.08,.13,.105,.22,boot,l);}
      // Shield and sword are body attachments; they follow flips and landings with the torso.
      const shield=new T.Group();shield.position.set(-.08,1.09,-.3);shield.rotation.z=-.17;body.add(shield);
      const outline=new T.Shape();outline.moveTo(-.32,.32);outline.lineTo(.32,.32);outline.lineTo(.29,-.12);outline.lineTo(0,-.4);outline.lineTo(-.29,-.12);outline.closePath();
      const sh=mesh(new T.ExtrudeGeometry(outline,{depth:.06,bevelEnabled:false}), '#adb7b2',0,0,0,shield);sh.rotation.y=Math.PI;
      const inner=mesh(new T.ExtrudeGeometry(outline,{depth:.075,bevelEnabled:false}),'#284f89',0,0,0,shield);inner.rotation.y=Math.PI;inner.scale.set(.82,.82,1);
      box(0,.06,-.083,.045,.3,.015,'#d9b853',shield);const wing=box(0,.13,-.085,.23,.045,.015,'#d9b853',shield);wing.rotation.z=.1;
      const sword=new T.Group();sword.rotation.z=-.57;sword.position.set(.16,1.04,-.31);body.add(sword);box(0,0,0,.07,1.02,.08,'#a7b5b0',sword);box(0,.61,0,.08,.22,.09,'#51457d',sword);box(0,.46,0,.33,.06,.1,'#bca55f',sword);
    }
    root.userData.characterId=id;
    return {root,pivot,body,arms,legs,info,retarget};
  }
  // No model-specific action branches: each model maps its own proportions to these joints.
  function pose(model,time,player){
    const {root,pivot,arms,legs}=model;
    root.position.set(player.x,player.y,player.z);root.rotation.y=player.heading;
    pivot.rotation.set(0,0,0);pivot.scale.set(1,1,1);
    for(const limb of [...arms,...legs])limb.rotation.set(0,0,0);
    const speed=Math.hypot(player.vx,player.vz),walk=player.grounded?Math.sin(time*(speed>6?14:10))*Math.min(speed/6,.8):.3;
    arms[0].rotation.x=walk;arms[1].rotation.x=-walk;legs[0].rotation.x=-walk;legs[1].rotation.x=walk;
    arms[0].rotation.z=-.1;arms[1].rotation.z=.1;
    if(player.grounded&&speed>.2)pivot.position.y=1+Math.abs(Math.sin(time*(speed>6?14:10)))*.025;else pivot.position.y=1;
    if(!player.grounded){
      arms[0].rotation.z=-.6;arms[1].rotation.z=.6;legs[0].rotation.x=legs[1].rotation.x=-.3;
      if(player.tier===3&&!player.pounding&&!player.longJump)pivot.rotation.x=Math.min(1,player.airTime/1.24)*Math.PI*2;
      if(player.longJump){pivot.rotation.x=-.2;arms[0].rotation.x=arms[1].rotation.x=-1;legs[0].rotation.x=1;legs[1].rotation.x=-.5;}
      if(player.pounding){legs[0].rotation.x=legs[1].rotation.x=-1.5;arms[0].rotation.x=arms[1].rotation.x=1.3;}
      if(player.action==='蹬墙跳'){arms[0].rotation.x=-1.1;legs[0].rotation.x=.6;legs[1].rotation.x=-.8;}
    }
    if(model.retarget)model.retarget(time,player);
  }
  window.EllehCharacters={catalog,create,pose};
})();
