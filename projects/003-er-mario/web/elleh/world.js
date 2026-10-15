/* Reference-led geometric reconstruction; all meshes and textures are generated locally. */
(() => {
  'use strict';
  const T = window.THREE;
  function create(host) {
    let seed = 53017;
    const rnd = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    const color = hex => new T.Color(hex).convertSRGBToLinear();
    const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    host.appendChild(renderer.domElement); renderer.domElement.setAttribute('aria-hidden','true');
    const scene = new T.Scene(); scene.fog = new T.FogExp2('#69725a', .0075);
    const camera = new T.PerspectiveCamera(57, 1, .12, 400);
    const obstacles = [], flickers = [], graceRibbons = [], flames = [], foliage = [];
    const material = (hex, options = {}) => new T.MeshStandardMaterial({ color: color(hex), roughness: .93, ...options });
    const stoneBase = material('#787c68'), darkStone = material('#464d3d'), trim = material('#8b8a70');
    const wood = material('#504431'), iron = material('#45483b',{metalness:.7,roughness:.65});
    const canvas = (w,h) => { const c=document.createElement('canvas'); c.width=w;c.height=h;return c; };
    function texture(c, u=1, v=1) { const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(u,v);tex.anisotropy=4;return tex; }

    // Staggered masonry: joints, mineral variation, small cracks and lichen.
    const masonry = canvas(512,512), cx=masonry.getContext('2d');
    cx.fillStyle='#343b2d';cx.fillRect(0,0,512,512);
    for(let row=-1;row<9;row++) for(let col=-1;col<7;col++) {
      const x=col*86+(row%2)*43,y=row*62, gray=92+rnd()*43;
      const g=cx.createLinearGradient(x,y,x,y+60);
      g.addColorStop(0,'rgb('+(gray+16)+','+(gray+18)+','+(gray+3)+')');
      g.addColorStop(1,'rgb('+gray+','+(gray+4)+','+(gray-11)+')');
      cx.fillStyle=g;cx.fillRect(x+2,y+2,82-rnd()*3,58-rnd()*3);
      cx.strokeStyle='rgba(23,31,18,.32)';cx.lineWidth=1;cx.strokeRect(x+4,y+5,77,51);
      for(let k=0;k<11;k++) {cx.fillStyle=rnd()>.5?'rgba(224,213,162,.08)':'rgba(7,19,5,.12)';cx.fillRect(x+rnd()*84,y+rnd()*59,1+rnd()*12,1+rnd()*3);}
      if(rnd()>.6){cx.strokeStyle='rgba(22,31,19,.45)';cx.beginPath();cx.moveTo(x+20,y+2);cx.lineTo(x+28,y+17);cx.lineTo(x+23,y+25);cx.stroke();}
    }
    for(let i=0;i<12000;i++){const x=rnd()*512,y=rnd()*512;cx.fillStyle=rnd()>.5?'rgba(228,220,178,.1)':'rgba(19,35,10,.12)';cx.fillRect(x,y,1+rnd()*2,1+rnd()*2);}
    const stonePixels=cx.getImageData(0,0,512,512);for(let i=0;i<stonePixels.data.length;i+=4){const grain=(rnd()-.5)*27;stonePixels.data[i]+=grain;stonePixels.data[i+1]+=grain;stonePixels.data[i+2]+=grain*.8;}cx.putImageData(stonePixels,0,0);
    const stoneTexture=texture(masonry);stoneTexture.encoding=T.sRGBEncoding;
    const matCache=new Map();
    function stone(w,h,shade='#ccccad') {
      const key=w.toFixed(1)+'/'+h.toFixed(1)+'/'+shade;
      if(!matCache.has(key)) {const map=stoneTexture.clone();map.needsUpdate=true;map.repeat.set(Math.max(.4,w/3.4),Math.max(.4,h/2.5));const bump=map.clone();bump.needsUpdate=true;bump.encoding=T.LinearEncoding;matCache.set(key,material(shade,{map,bumpMap:bump,bumpScale:.045}));}
      return matCache.get(key);
    }
    function mesh(geo,mat,x=0,y=0,z=0,parent=scene){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
    function box(w,h,d,x,y,z,mat=stone(w,h),solid=false,parent=scene){const m=mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,parent);if(solid)obstacles.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2,bottom:y-h/2,top:y+h/2});return m;}
    function cylinder(r1,r2,h,x,y,z,mat,segments=10,parent=scene){return mesh(new T.CylinderGeometry(r1,r2,h,segments),mat,x,y,z,parent);}
    function branch(a,b,r,mat,parent=scene){const p=new T.Vector3(...a),q=new T.Vector3(...b),delta=q.clone().sub(p);const m=cylinder(r*.4,r,delta.length(),0,0,0,mat,7,parent);m.position.copy(p.add(q).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
    function floor(x,z){if(Math.abs(x)<7&&z>-14&&z<6)return 0;const lane=Math.exp(-x*x/18)*Math.max(0,Math.min(1,(z-3)/7));return (Math.sin(x*.17)*.45+Math.cos(z*.12)*.35+Math.sin(x*.08+z*.13)*.28)*(1-lane)+Math.max(0,(-x-17)*.17);}
    const groundGeo=new T.PlaneGeometry(150,150,120,120);groundGeo.rotateX(-Math.PI/2);
    const positions=groundGeo.attributes.position,groundColors=[];
    for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i);positions.setY(i,floor(x,z)-.055);const interior=Math.abs(x)<5.5&&z>-12&&z<3;const road=Math.abs(x)<2&&z>3;const c=color(interior||road?'#535c39':'#596c39');const v=.78+rnd()*.38;c.multiplyScalar(v);groundColors.push(c.r,c.g,c.b);}
    groundGeo.computeVertexNormals();groundGeo.setAttribute('color',new T.Float32BufferAttribute(groundColors,3));
    const ground=mesh(groundGeo,material('#ffffff',{vertexColors:true}));ground.castShadow=false;
    // Local soil grain avoids external texture requests.
    const soil=canvas(256,256),sc=soil.getContext('2d');sc.fillStyle='#a9a58b';sc.fillRect(0,0,256,256);
    for(let i=0;i<12000;i++){const g=100+rnd()*95;sc.fillStyle='rgba('+g+','+g+','+(g*.75)+',.25)';sc.fillRect(rnd()*256,rnd()*256,1+rnd()*3,1+rnd()*3);}
    const soilMap=texture(soil,55,55);soilMap.encoding=T.sRGBEncoding;ground.material.map=soilMap;ground.material.needsUpdate=true;

    const skyCanvas=canvas(768,384),skyContext=skyCanvas.getContext('2d'),skyImage=skyContext.createImageData(768,384);
    const cloudGrid=Float32Array.from({length:128*64},()=>rnd());
    function cloudNoise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;const a=fx*fx*(3-2*fx),b=fy*fy*(3-2*fy);const sample=(xx,yy)=>cloudGrid[((yy%64+64)%64)*128+(xx%128+128)%128];return (sample(ix,iy)*(1-a)+sample(ix+1,iy)*a)*(1-b)+(sample(ix,iy+1)*(1-a)+sample(ix+1,iy+1)*a)*b;}
    for(let y=0;y<384;y++)for(let x=0;x<768;x++){const yy=y/384;const cloud=(cloudNoise(x/65,y/34)-.5)*70+(cloudNoise(x/24,y/15)-.5)*30+(cloudNoise(x/9,y/7)-.5)*10;const glow=Math.exp(-((x-480)**2/35000+(y-130)**2/11000));const index=(y*768+x)*4;skyImage.data[index]=31+yy*47+cloud+glow*73;skyImage.data[index+1]=47+yy*39+cloud*.92+glow*54;skyImage.data[index+2]=33+yy*26+cloud*.6+glow*19;skyImage.data[index+3]=255;}
    skyContext.putImageData(skyImage,0,0);const skyTex=new T.CanvasTexture(skyCanvas);skyTex.mapping=T.EquirectangularReflectionMapping;skyTex.encoding=T.sRGBEncoding;scene.background=skyTex;
    scene.add(new T.HemisphereLight('#d9d4a7','#354927',.85));
    const sun=new T.DirectionalLight('#ffe4a7',1.7);sun.position.set(24,38,18);sun.castShadow=true;
    Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:110});sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.035;sun.shadow.bias=-.00012;scene.add(sun);scene.add(sun.target);
    const fill=new T.DirectionalLight('#b0c8b1',.32);fill.position.set(-20,10,-20);scene.add(fill);

    // Gothic wall outline with a real opening, used for the nave's damaged facade.
    function archProfile(w,h){return [[-w/2,0],[-w/2,h*.55],[-w*.38,h*.82],[0,h],[w*.38,h*.82],[w/2,h*.55],[w/2,0]];}
    function archFrame(w,h,t,depth,x,y,z,rotation=0){const outer=archProfile(w+2*t,h+t),inner=archProfile(w,h);const shape=new T.Shape();shape.moveTo(...outer[0]);for(const p of outer.slice(1))shape.lineTo(...p);for(const p of inner.reverse())shape.lineTo(...p);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1});const m=mesh(geo,stone(1,1),x,y,z);m.rotation.y=rotation;return m;}
    const facadeShape=new T.Shape();
    const contour=[[-5.5,0],[5.5,0],[5.5,5.4],[4.6,5.4],[4.4,6.3],[3.6,6.0],[3.6,7.0],[2.5,7.2],[2.3,7.9],[1.4,8.1],[0,9.4],[-1.2,8.3],[-1.8,8.5],[-2.4,7.4],[-3.5,6.7],[-3.9,6.1],[-5.5,5.8]];
    facadeShape.moveTo(-5.5,0);facadeShape.lineTo(-1.45,0);facadeShape.lineTo(-1.45,2.7);facadeShape.quadraticCurveTo(-1.25,3.8,0,4.65);facadeShape.quadraticCurveTo(1.25,3.8,1.45,2.7);facadeShape.lineTo(1.45,0);facadeShape.lineTo(5.5,0);for(const p of contour.slice(2))facadeShape.lineTo(...p);facadeShape.closePath();
    mesh(new T.ExtrudeGeometry(facadeShape,{depth:.85,bevelEnabled:false}),stone(1,1),0,0,3);
    archFrame(2.9,4.65,.32,1.02,0,0,2.9);
    obstacles.push({x0:-5.5,x1:-1.45,z0:2.9,z1:3.9,bottom:0,top:7},{x0:1.45,x1:5.5,z0:2.9,z1:3.9,bottom:0,top:7},{x0:-1.45,x1:1.45,z0:2.9,z1:3.9,bottom:4.0,top:9.4});
    // Broken roof edges and buttresses, with the nave deliberately open to the sky.
    for(const side of [-1,1]) {
      for(const z of [2,-2,-6,-10]) {
        box(.86,5.35,.96,side*5.25,2.675,z,stone(.86,5.35),true);
        cylinder(.69,.8,.18,side*5.25,.09,z,trim,12);
        cylinder(.57,.69,.22,side*5.25,.29,z,trim,12);
        cylinder(.49,.54,4.6,side*5.25,2.6,z,stone(.8,4.6),12);
        box(1.12,.24,1.15,side*5.25,4.92,z,trim);
        if(z<2){const arch=archFrame(3.05,2.7,.26,.7,side*5.25,2.45,z+2,Math.PI/2);arch.castShadow=true;}
        if(z!==-6||side===1) box(.65,1.15,3.1,side*5.25,.575,z+1.95,stone(3.1,1.15),true);
        box(.9,3.9,.86,side*5.9,1.95,z,stone(.9,3.9),true);
      }
    }
    box(3.9,3.7,.85,-3.25,1.85,-12,stone(3.9,3.7),true);
    box(3.0,4.9,.85,3.7,2.45,-12,stone(3,4.9),true);
    box(3.8,.4,1.5,-.3,.2,-10.55,stone(3.8,.4),true);
    box(3.3,.45,1.1,-.3,.625,-10.75,stone(3.3,.45),true);
    for(let i=0;i<15;i++){const left=i<8;const x=left?-5.1+(i/8)*3.2:2.35+((i-8)/7)*2.7;const y=(left?3.7:4.9)-.08;const rock=mesh(new T.DodecahedronGeometry(.17+rnd()*.14),stoneBase,x,y,-12);rock.scale.y=.6;rock.rotation.y=rnd()*3;}

    // The slender bell tower is the church's most recognizable exterior silhouette.
    const tx=4.5,tz=3.0;
    box(3.15,6.25,3.25,tx,3.125,tz,stone(3.15,6.25),true);
    box(3.5,.28,3.6,tx,6.3,tz,trim);
    box(2.58,3.25,2.7,tx,8.03,tz,stone(2.58,3.25));
    box(2.94,.25,3.04,tx,9.69,tz,trim);
    box(2.17,2.68,2.3,tx,11.16,tz,stone(2.17,2.68));
    for(const angle of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
      const gx=tx+Math.sin(angle)*1.18,gz=tz+Math.cos(angle)*1.18;
      const niche=box(.74,1.8,.035,gx,11.3,gz,material('#19251e'));niche.rotation.y=angle;
      archFrame(.74,1.8,.14,.12,gx,10.4,gz,angle);
      const slot=box(.18,.75,.04,tx+Math.sin(angle)*1.38,8.05,tz+Math.cos(angle)*1.38,darkStone);slot.rotation.y=angle;
    }
    box(2.45,.26,2.58,tx,12.62,tz,trim);
    const spire=cylinder(0,1.43,4.1,tx,14.8,tz,stone(2,4,'#8f8e76'),4);spire.rotation.y=Math.PI/4;
    cylinder(.08,.12,.9,tx,17.15,tz,iron,6);
    // Decorative side entrance and shallow lancet niches on the tower.
    const niche=box(1.02,2.15,.025,tx,1.07,tz+1.64,material('#1e281d'));archFrame(1.02,2.15,.2,.1,tx,0,tz+1.65);
    for(const x of [-4.45,-2.9,2.3]){box(.65,2.25,.04,x,2.1,3.87,material('#263125'));archFrame(.65,2.25,.15,.15,x,.95,3.89);}
    // Buttress rubble, worn paving and floor weeds.
    for(let i=0;i<135;i++){const a=rnd()*Math.PI*2;const along=i<70;const x=along?(rnd()>.5?1:-1)*(5.5+rnd()*2.1):(rnd()-.5)*25;const z=along?-12+rnd()*17:-12+rnd()*29;if(Math.abs(x)<1.8&&z>1)continue;const r=.16+rnd()*.46;const rubble=mesh(new T.DodecahedronGeometry(r,0),i%3?stoneBase:darkStone,x,floor(x,z)+r*.25,z);rubble.scale.set(1.2,.5+rnd()*.5,.7);rubble.rotation.set(rnd(),a,rnd());}
    for(let i=0;i<35;i++){const x=(rnd()-.5)*8.5,z=-11+rnd()*13;const tile=box(.5+rnd()*.7,.07,.4+rnd()*.6,x,-.015,z,stone(1,1));tile.rotation.y=rnd()*.3;}

    // Ivy sheets use a locally drawn leaf texture; transparent gaps expose the masonry.
    const leafCanvas=canvas(128,128),lc=leafCanvas.getContext('2d');
    for(let i=0;i<95;i++){const x=rnd()*128,y=rnd()*128;lc.save();lc.translate(x,y);lc.rotate(rnd()*6.28);lc.fillStyle=i%3?'#687542':'#8b8b4d';lc.beginPath();lc.ellipse(0,0,3+rnd()*4,1.8+rnd()*2,0,0,Math.PI*2);lc.fill();lc.restore();}
    const leafMap=texture(leafCanvas);leafMap.encoding=T.sRGBEncoding;
    const ivyMat=material('#8b9565',{map:leafMap,transparent:false,alphaTest:.48,side:T.DoubleSide,roughness:1});
    for(let i=0;i<34;i++){const x=i<17?(-5.45+rnd()*3):(2.9+rnd()*3);const y=1.5+rnd()*8;const z=i<17?3.9:4.68;const ivy=mesh(new T.PlaneGeometry(.6+rnd()*1.4,1+rnd()*2.7),ivyMat,x,y,z);ivy.rotation.z=(rnd()-.5)*.5;ivy.castShadow=false;}

    // Dense, wind-bent grass in a single instanced draw call.
    const grassVertices=[];
    for(const angle of [0,1.05,2.1]){const c=Math.cos(angle),sn=Math.sin(angle);const points=[[-.055,0,0],[.055,0,0],[.018,.43,.015],[0,.77,.05]];for(const i of [0,1,2,0,2,3]){const [x,y,z]=points[i];grassVertices.push(x*c-z*sn,y,x*sn+z*c);}}
    const grassGeo=new T.BufferGeometry();grassGeo.setAttribute('position',new T.Float32BufferAttribute(grassVertices,3));grassGeo.computeVertexNormals();
    const grassMat=material('#8d9c54',{side:T.DoubleSide,roughness:1});
    const wind={value:0};grassMat.onBeforeCompile=shader=>{shader.uniforms.windTime=wind;shader.vertexShader='uniform float windTime;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(windTime*1.6 + instanceMatrix[3].x*.35 + instanceMatrix[3].z*.24)*pow(position.y,.9)*.12;');};
    const grass=new T.InstancedMesh(grassGeo,grassMat,27000),dummy=new T.Object3D();let grassCount=0;
    for(let i=0;i<35000&&grassCount<27000;i++){const x=(rnd()-.5)*60,z=(rnd()-.5)*58;const interior=Math.abs(x)<5&&z>-12&&z<4;const path=Math.abs(x)<1.7&&z>-11&&z<29;if(path&&rnd()>.05)continue;if(interior&&rnd()>.5)continue;dummy.position.set(x,floor(x,z),z);dummy.rotation.set(0,rnd()*6.28,(rnd()-.5)*.12);const s=.55+rnd()*.8;dummy.scale.set(s,s,s);dummy.updateMatrix();grass.setMatrixAt(grassCount,dummy.matrix);const shade=color(i%4?'#87934d':'#b2a86b');shade.multiplyScalar(.65+rnd()*.5);grass.setColorAt(grassCount,shade);grassCount++;}
    grass.count=grassCount;grass.receiveShadow=true;grass.castShadow=false;scene.add(grass);
    const flowerMat=material('#d9d2b1',{side:T.DoubleSide});const flowers=new T.InstancedMesh(new T.PlaneGeometry(.07,.11),flowerMat,450);
    for(let i=0;i<450;i++){const x=(rnd()-.5)*36,z=(rnd()-.5)*38;dummy.position.set(x,floor(x,z)+.3+rnd()*.3,z);dummy.rotation.set(0,rnd()*6.28,.4);dummy.scale.setScalar(.8+rnd());dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);}scene.add(flowers);

    // Autumn trees share one alpha-cutout canopy material.
    const canopy=new T.InstancedMesh(new T.PlaneGeometry(2.6,2.5),material('#c5a957',{map:leafMap,alphaTest:.4,side:T.DoubleSide}),1300);let leafCount=0;
    for(let i=0;i<26;i++){
      const a=i/26*Math.PI*2,x=Math.cos(a)*(20+rnd()*19),z=Math.sin(a)*(18+rnd()*20)-3;
      if(z>7&&Math.abs(x)<34)continue;
      const y=floor(x,z),h=6+rnd()*5;branch([x,y,z],[x+.3,y+h,z],.19,wood);
      for(let j=0;j<5;j++){const theta=rnd()*6.28,len=1.6+rnd()*2;branch([x,y+h*.5,z],[x+Math.sin(theta)*len,y+h*.83,z+Math.cos(theta)*len],.08,wood);}
      for(let j=0;j<46;j++){const theta=rnd()*6.28,r=rnd()*3.1;dummy.position.set(x+Math.cos(theta)*r,y+h-1.8+rnd()*3,z+Math.sin(theta)*r);dummy.rotation.set((rnd()-.5)*.8,rnd()*6.28,(rnd()-.5)*1);const s=.85+rnd()*.7;dummy.scale.setScalar(s);dummy.updateMatrix();canopy.setMatrixAt(leafCount,dummy.matrix);canopy.setColorAt(leafCount,color(j%3?'#bca152':'#d4be6c'));leafCount++;}
    }
    canopy.count=leafCount;canopy.castShadow=false;scene.add(canopy);
    // Far cliffs and Stormveil's silhouette establish Limgrave's setting.
    const cliffMat=material('#626d58');
    for(let i=0;i<28;i++){const x=-55+i*4.5,z=-53-rnd()*16,h=10+rnd()*18;const rock=mesh(new T.DodecahedronGeometry(5+rnd()*4,2),cliffMat,x,h*.2-3,z);rock.scale.set(1,h/8,.7);rock.rotation.y=rnd()*2;rock.castShadow=false;}
    for(let i=0;i<7;i++){const x=-47+i*5.3;box(4.6,3.6,3,x,15+i*.25,-49,darkStone);if(i%2===0){cylinder(1.8,2.0,10,x,18.5,-49,cliffMat,8);for(let j=0;j<7;j++){const a=j/7*Math.PI*2;box(.55,.8,.6,x+Math.cos(a)*1.6,23.7,-49+Math.sin(a)*1.6,cliffMat);}}}
    // Erdtree: a luminous branching silhouette beyond the church, not an extracted game model.
    const erdtree=new T.Group();scene.add(erdtree);erdtree.position.set(28,-3,-95);erdtree.scale.setScalar(.75);
    const treeMat=material('#cfbf76',{emissive:color('#a38940'),emissiveIntensity:.85,roughness:.8});
    branch([0,0,0],[3,61,0],3.7,treeMat,erdtree);branch([3,61,0],[-4,88,-1],1.45,treeMat,erdtree);
    for(let i=0;i<52;i++){const h=34+rnd()*48,a=rnd()*6.28,l=9+rnd()*25;const end=[Math.cos(a)*l,h+7+rnd()*12,Math.sin(a)*l*.7];branch([2,h,0],end,.32+rnd()*.32,treeMat,erdtree);for(let j=0;j<3;j++){const b=[end[0]+(rnd()-.5)*12,end[1]+2+rnd()*7,end[2]+(rnd()-.5)*10];branch(end,b,.1,treeMat,erdtree);}}
    const treeLeaves=new T.InstancedMesh(new T.PlaneGeometry(10,7),material('#e1cc7e',{map:leafMap,alphaTest:.28,side:T.DoubleSide,emissive:color('#b7a756'),emissiveIntensity:.6}),320);
    for(let i=0;i<320;i++){const a=rnd()*6.28,r=Math.sqrt(rnd())*35;dummy.position.set(28+Math.cos(a)*r*.75,(51+rnd()*37)*.75-3,-95+Math.sin(a)*r*.525);dummy.rotation.set((rnd()-.5)*1,rnd()*6.28,rnd());dummy.scale.setScalar((.8+rnd())*.75);dummy.updateMatrix();treeLeaves.setMatrixAt(i,dummy.matrix);}treeLeaves.castShadow=false;scene.add(treeLeaves);

    // Site of Grace, anvil, Kalé, campfire and pack animal.
    const grace={x:0,z:-2.3},merchant={x:3.0,z:-8.3},smith={x:-3.7,z:.15};
    const graceLight=new T.PointLight('#ffe2a0',2.7,7,2);graceLight.position.set(grace.x,.65,grace.z);scene.add(graceLight);
    const graceMat=new T.MeshBasicMaterial({color:color('#e9bc62'),transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false});
    const graceRing=mesh(new T.RingGeometry(.32,.42,48),graceMat,grace.x,.04,grace.z);graceRing.rotation.x=-Math.PI/2;
    for(let i=0;i<9;i++){const curve=new T.CatmullRomCurve3([new T.Vector3(0,0,0),new T.Vector3(.15, .4,0),new T.Vector3(-.04,.8,.07),new T.Vector3(.1,1.1,0)]);const ribbon=mesh(new T.TubeGeometry(curve,16,.016,4,false),graceMat.clone(),grace.x+(rnd()-.5)*.3,.02,grace.z+(rnd()-.5)*.3);ribbon.rotation.y=rnd()*6.28;graceRibbons.push(ribbon);}
    box(.95,.62,.7,smith.x,.31,smith.z,stone(1,.6),true);
    const anvil=new T.Group();anvil.position.set(smith.x,.64,smith.z);scene.add(anvil);
    box(.82,.12,.42,0,.05,0,iron,false,anvil);box(.33,.26,.28,0,.22,0,iron,false,anvil);box(.9,.16,.42,0,.42,0,iron,false,anvil);
    const horn=mesh(new T.ConeGeometry(.17,.5,5),iron,-.65,.4,0,anvil);horn.rotation.z=Math.PI/2;
    box(.32,.07,.27,smith.x+.85,.12,smith.z+.3,wood);const hammer=box(.12,.12,.3,smith.x+.4,.85,smith.z+.2,iron);hammer.rotation.y=.4;
    const fireCenter={x:2.25,z:-7.0};
    for(let i=0;i<7;i++){const a=i/7*Math.PI*2;const log=cylinder(.075,.12,.8,fireCenter.x,.13,fireCenter.z,wood,7);log.rotation.z=Math.PI/2;log.rotation.y=a;}
    const fireMat=new T.MeshBasicMaterial({color:'#ffbd53',transparent:true,opacity:.8,depthWrite:false});
    for(let i=0;i<8;i++){const f=mesh(new T.ConeGeometry(.11+rnd()*.08,.55+rnd()*.5,5),fireMat.clone(),fireCenter.x+(rnd()-.5)*.35,.4,fireCenter.z+(rnd()-.5)*.35);flames.push(f);}
    const fireLight=new T.PointLight('#ff9d45',3.1,9,2);fireLight.position.set(fireCenter.x,.7,fireCenter.z);scene.add(fireLight);flickers.push(fireLight);
    const cape=material('#9a4932'),fabric=material('#9b8b67'),faceMat=material('#c79e71');
    const kale=new T.Group();kale.position.set(merchant.x,0,merchant.z);kale.rotation.y=-.5;scene.add(kale);
    cylinder(.3,.56,.84,0,.55,0,cape,9,kale);mesh(new T.SphereGeometry(.21,12,8),faceMat,0,1.15,0,kale);
    const cap=cylinder(0,.22,.58,.06,1.55,0,cape,8,kale);cap.rotation.z=-.25;mesh(new T.SphereGeometry(.11,8,6),fabric,.15,1.82,0,kale);
    box(.35,.2,.65,-.25,.17,.3,fabric,false,kale);box(.35,.2,.65,.25,.17,.3,fabric,false,kale);
    for(const side of [-1,1]){const arm=box(.16,.55,.18,side*.32,.8,.1,cape,false,kale);arm.rotation.z=side*.5;mesh(new T.SphereGeometry(.09,8,6),faceMat,side*.44,.58,.12,kale);}
    const beard=mesh(new T.ConeGeometry(.18,.35,8),fabric,0,.99,.16,kale);beard.rotation.z=Math.PI;
    // Pack animal and the merchant's stock are simple silhouettes at the rear of the nave.
    const donkey=new T.Group();donkey.position.set(3.2,0,-10.75);donkey.rotation.y=.5;scene.add(donkey);
    const fur=material('#5a5741');const torso=mesh(new T.SphereGeometry(.5,10,8),fur,0,.85,0,donkey);torso.scale.set(.7,.8,1.4);
    for(const x of [-.22,.22])for(const z of [-.4,.4])cylinder(.065,.08,.7,x,.35,z,fur,6,donkey);
    const head=mesh(new T.SphereGeometry(.25,9,7),fur,0,1.2,.66,donkey);head.scale.set(.7,1,.9);
    for(const x of [-.13,.13]){const ear=mesh(new T.SphereGeometry(.1,6,5),fur,x,1.62,.66,donkey);ear.scale.set(.45,2,.6);}
    box(.95,.48,.75,0,1.17,-.18,fabric,false,donkey);
    for(let i=0;i<6;i++){const sack=mesh(new T.SphereGeometry(.2+rnd()*.12,8,6),fabric,2+rnd()*2.3,.2,-9.4-rnd()*1.8);sack.scale.y=1.2;}
    // A few glowing motes, with no game audio or extracted effects.
    const motesGeo=new T.BufferGeometry(),motePositions=[];for(let i=0;i<110;i++)motePositions.push((rnd()-.5)*28,.4+rnd()*9,-12+rnd()*25);
    motesGeo.setAttribute('position',new T.Float32BufferAttribute(motePositions,3));const motes=new T.Points(motesGeo,new T.PointsMaterial({color:'#d9bd75',size:.025,transparent:true,opacity:.55}));scene.add(motes);

    const avatars=new Map(window.EllehCharacters.catalog.map(info=>[info.id,window.EllehCharacters.create(info.id)]));
    let avatar=avatars.get('mario');
    for(const model of avatars.values()){model.root.visible=model===avatar;scene.add(model.root);}
    function setCharacter(id){const next=avatars.get(id);if(!next)return false;avatar.root.visible=false;avatar=next;avatar.root.visible=true;return true;}
    const pulse=mesh(new T.RingGeometry(.7,.78,48),new T.MeshBasicMaterial({color:'#d7c690',transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false}),0,.025,0);pulse.rotation.x=-Math.PI/2;let pulseLife=0;
    const hotspots=[{id:'grace',x:grace.x,z:grace.z,label:'触碰赐福',name:'艾雷教堂赐福'},{id:'merchant',x:merchant.x,z:merchant.z,label:'与商人咖列交谈',name:'商人咖列'},{id:'smith',x:smith.x,z:smith.z,label:'查看锻造台',name:'锻造台'}];
    function animate(time,dt,player){
      wind.value=time;
      for(let i=0;i<flames.length;i++){flames[i].scale.y=.8+Math.sin(time*9+i*1.3)*.25;flames[i].material.opacity=.65+Math.sin(time*7+i)*.15;}
      fireLight.intensity=2.7+Math.sin(time*8)*.25+Math.sin(time*19)*.15;
      for(let i=0;i<graceRibbons.length;i++){graceRibbons[i].rotation.y+=dt*(.6+i*.07);graceRibbons[i].scale.y=.7+Math.sin(time*2+i)*.18;}
      graceRing.material.opacity=.45+Math.sin(time*2)*.12;
      window.EllehCharacters.pose(avatar,time,player);
      if(pulseLife>0){pulseLife-=dt;pulse.scale.setScalar(1+(1-pulseLife/.6)*3);pulse.material.opacity=Math.max(0,pulseLife/.6)*.7;}
      motes.rotation.y=Math.sin(time*.03)*.025;
    }
    function impact(x,z){pulse.position.set(x,floor(x,z)+.05,z);pulseLife=.6;}
    function resize(){renderer.setSize(host.clientWidth,host.clientHeight,false);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}
    new ResizeObserver(resize).observe(host);resize();
    return {scene,camera,renderer,setCharacter,floor,obstacles,hotspots,animate,impact,graceLight,render(){renderer.render(scene,camera);},resize};
  }
  window.EllehWorld={create};
})();
